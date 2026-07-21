import "server-only";
import Stripe from "stripe";
import { siteOrigin } from "@/lib/site-url";

export { siteOrigin };

// Stripe integration surface: env checks, the SDK client, the origin used for
// Checkout/Portal return URLs, webhook signature verification (plain HMAC —
// no SDK needed), and the event types we commit to handling.

export const STRIPE_ENV_KEYS = {
  secretKey: "STRIPE_SECRET_KEY",
  webhookSecret: "STRIPE_WEBHOOK_SECRET",
} as const;

// Pro is a $40/month recurring subscription — the price is built inline at
// checkout (price_data with a recurring interval), so no product/price ID env
// var is needed.
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

// Monthly Pro price, in cents, charged every month. USD.
export const PRO_PRICE_CENTS = 4000;

let cached: Stripe | null = null;

// Throws if unconfigured — every caller gates on isStripeConfigured() first.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!cached) cached = new Stripe(key, { typescript: true });
  return cached;
}

// Absolute origin for Checkout/Portal return URLs. NEXT_PUBLIC_SITE_URL wins
// when set (canonical domain); otherwise derive from the request so local dev
// and preview deploys work without extra config.
// Monthly subscription model. Two events change org state:
// - checkout.session.completed → subscription started, grant Pro.
// - customer.subscription.deleted → subscription ended (cancelled or final
//   payment failure), revoke Pro back to Free.
// Renewals (invoice.paid) need no action — the org is already Pro.
export const HANDLED_EVENT_TYPES = [
  "checkout.session.completed",
  "customer.subscription.deleted",
] as const;

// Verifies a Stripe webhook signature header ("t=...,v1=...") against the raw
// request body. Standard Stripe scheme: HMAC-SHA256 over `${t}.${body}` with
// the webhook signing secret. Returns false on any malformed input.
export async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!signatureHeader) return false;

  const parts = new Map<string, string[]>();
  for (const pair of signatureHeader.split(",")) {
    const [k, v] = pair.split("=", 2);
    if (!k || !v) continue;
    const list = parts.get(k.trim()) ?? [];
    list.push(v.trim());
    parts.set(k.trim(), list);
  }

  const timestamp = Number(parts.get("t")?.[0]);
  const candidates = parts.get("v1") ?? [];
  if (!Number.isFinite(timestamp) || candidates.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");

  return candidates.some((c) => {
    const candidateBuf = Buffer.from(c, "utf8");
    return candidateBuf.length === expectedBuf.length && timingSafeEqual(candidateBuf, expectedBuf);
  });
}
