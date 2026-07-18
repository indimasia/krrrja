"use server";

import { redirect } from "next/navigation";
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

// Starts a one-time Stripe Checkout session for the $40 lifetime Pro purchase
// and redirects to it. mode="payment" (not subscription) — pay once, keep Pro.
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
      mode: "payment",
      customer: customerId,
      // Price built inline — a single one-time charge, no product/price ID.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PRO_PRICE_CENTS,
            product_data: {
              name: "Krrrja Pro — Lifetime",
              description: "One-time payment. Unlimited job openings and CV uploads, forever.",
            },
          },
        },
      ],
      // client_reference_id + payment metadata give the webhook a second way to
      // route the event if the customer lookup ever misses.
      client_reference_id: ctx.orgId,
      payment_intent_data: { metadata: { org_id: ctx.orgId } },
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
