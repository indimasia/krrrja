"use server";

import { getOrgContext } from "@/lib/data/org";
import { canManageBilling } from "@/lib/permissions";
import { isStripeConfigured } from "@/lib/billing/stripe";

export type BillingActionState = { error: string } | null;

// Starts a Stripe Checkout session for the Pro upgrade. Until Stripe keys +
// Pro pricing exist (open product decision), this returns a clear error so the
// UI can show state honestly instead of a dead button.
export async function startProCheckout(): Promise<BillingActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canManageBilling(ctx.role)) return { error: "Only org admins can manage billing." };

  if (!isStripeConfigured()) {
    return { error: "Payments are not configured yet — Stripe keys and Pro pricing are pending. Contact support." };
  }

  // TODO(stripe): create/lookup customer (orgs.stripe_customer_id), create
  // Checkout Session with STRIPE_PRICE_PRO, redirect() to session.url.
  return { error: "Stripe checkout is not implemented yet." };
}

// Opens the Stripe Customer Portal for self-serve manage/cancel.
export async function openCustomerPortal(): Promise<BillingActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canManageBilling(ctx.role)) return { error: "Only org admins can manage billing." };

  if (!isStripeConfigured()) {
    return { error: "Payments are not configured yet — Stripe keys are pending. Contact support." };
  }

  // TODO(stripe): create Billing Portal session for orgs.stripe_customer_id,
  // redirect() to session.url.
  return { error: "Customer portal is not implemented yet." };
}
