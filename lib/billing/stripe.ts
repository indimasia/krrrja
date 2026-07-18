import "server-only";
import Stripe from "stripe";
import { headers } from "next/headers";

// Stripe integration surface: env checks, the SDK client, the origin used for
// Checkout/Portal return URLs, webhook signature verification (plain HMAC —
// no SDK needed), and the event types we commit to handling.

export const STRIPE_ENV_KEYS = {
  secretKey: "STRIPE_SECRET_KEY",
  webhookSecret: "STRIPE_WEBHOOK_SECRET",
} as const;

// Pro is a one-time $40 lifetime purchase — the price is built inline at
// checkout (price_data), so no product/price ID env var is needed.
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

// Lifetime Pro price, in cents. One-time charge, USD.
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
export async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// One-time lifetime model: the only event that changes state is Checkout
// completing. No recurring invoices, no subscription lifecycle, no cancel.
export const HANDLED_EVENT_TYPES = ["checkout.session.completed"] as const;

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
