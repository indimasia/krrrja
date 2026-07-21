"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/data/org";
import { canManageBilling } from "@/lib/permissions";
import { getStripe, isStripeConfigured, siteOrigin, PRO_PRICE_CENTS } from "@/lib/billing/stripe";

export type BillingActionState = { error: string } | null;

// Resolves the org's Stripe customer, creating it on first use. Writes go
// through the service-role client: stripe_customer_id is billing plumbing, not
// user-editable data, so orgs exposes no UPDATE policy for it.
async function ensureCustomer(orgId: string, orgName: string): Promise<string> {
  const admin = createAdminClient();
  const { data: org } = await admin.from("orgs").select("stripe_customer_id").eq("id", orgId).maybeSingle();
  if (org?.stripe_customer_id) return org.stripe_customer_id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customer = await getStripe().customers.create({
    name: orgName,
    email: user?.email ?? undefined,
    metadata: { org_id: orgId },
  });

  const { error } = await admin.from("orgs").update({ stripe_customer_id: customer.id }).eq("id", orgId);
  if (error) throw new Error(`Failed to save Stripe customer: ${error.message}`);

  return customer.id;
}

// Starts a recurring Stripe Checkout session for the $40/month Pro subscription
// and redirects to it. mode="subscription" — billed monthly until cancelled.
export async function startProCheckout(): Promise<BillingActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canManageBilling(ctx.role)) return { error: "Only org admins can manage billing." };
  if (ctx.subscriptionTier === "pro") return { error: "Your organization is already on Pro." };

  if (!isStripeConfigured()) {
    return { error: "Payments are not configured yet — Stripe keys are pending. Contact support." };
  }

  let url: string | null;
  try {
    const origin = await siteOrigin();
    const customerId = await ensureCustomer(ctx.orgId, ctx.orgName);

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      // Price built inline — a recurring monthly charge, no product/price ID.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PRO_PRICE_CENTS,
            recurring: { interval: "month" },
            product_data: {
              name: "Krrrja Pro — Monthly",
              description: "Billed monthly. Unlimited job openings and CV uploads. Cancel anytime.",
            },
          },
        },
      ],
      // client_reference_id + subscription metadata give the webhook a second
      // way to route the event if the customer lookup ever misses.
      client_reference_id: ctx.orgId,
      subscription_data: { metadata: { org_id: ctx.orgId } },
      success_url: `${origin}/admin/billing?checkout=success`,
      cancel_url: `${origin}/admin/billing?checkout=cancelled`,
      allow_promotion_codes: true,
    });
    url = session.url;
  } catch (e) {
    console.error("[stripe] checkout session failed:", e);
    return { error: "Could not start checkout. Please try again." };
  }

  if (!url) return { error: "Stripe did not return a checkout URL." };
  redirect(url);
}

// Schedules cancellation at the end of the current paid period
// (cancel_at_period_end). The org keeps Pro until then and is not charged
// again; Stripe fires customer.subscription.deleted at period end, which the
// webhook turns into tier='free'. grace_expires_at records that lapse date for
// the billing UI.
export async function cancelProSubscription(): Promise<BillingActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (!canManageBilling(ctx.role)) return { error: "Only org admins can manage billing." };
  if (ctx.subscriptionTier !== "pro") return { error: "Your organization is not on Pro." };
  if (!isStripeConfigured()) return { error: "Payments are not configured." };

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("orgs")
    .select("stripe_subscription_id")
    .eq("id", ctx.orgId)
    .maybeSingle();
  const subId = org?.stripe_subscription_id;
  if (!subId) return { error: "No active subscription found to cancel." };

  try {
    const sub = await getStripe().subscriptions.update(subId, { cancel_at_period_end: true });
    // cancel_at is the unix ts Pro lapses (period end). Top-level + stable
    // across API versions when cancel_at_period_end is set.
    const graceExpiresAt = sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null;
    const { error } = await admin
      .from("orgs")
      .update({ subscription_status: "canceling", grace_expires_at: graceExpiresAt })
      .eq("id", ctx.orgId);
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("[stripe] cancel subscription failed:", e);
    return { error: "Could not cancel the subscription. Please try again." };
  }

  revalidatePath("/admin/billing");
  return null;
}
