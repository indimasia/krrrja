import "server-only";

// Stripe configuration seam. The SDK is deliberately NOT installed yet —
// checkout/portal go live in a later step once keys + Pro pricing exist.
// Everything here is real plumbing that keeps working when that lands:
// env checks, webhook signature verification (plain HMAC, no SDK needed),
// and the event types we commit to handling.

export const STRIPE_ENV_KEYS = {
  secretKey: "STRIPE_SECRET_KEY",
  webhookSecret: "STRIPE_WEBHOOK_SECRET",
  proPriceId: "STRIPE_PRICE_PRO", // Pro pricing = open product decision
} as const;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_PRICE_PRO);
}

export const HANDLED_EVENT_TYPES = [
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.upcoming",
] as const;

export const GRACE_PERIOD_DAYS = 3;

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
