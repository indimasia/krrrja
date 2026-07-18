import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HANDLED_EVENT_TYPES, isStripeConfigured, verifyStripeSignature } from "@/lib/billing/stripe";

// Stripe webhook receiver. Fully functional once STRIPE_WEBHOOK_SECRET is set:
// signature always verified, idempotent by event.id (stripe_events table).
// One-time lifetime model — the only event that matters is Checkout completing,
// which flips the org to Pro permanently. Until keys exist it answers 503 so a
// misconfigured deploy is loud, not silently dropping events.

type StripeEvent = {
  id: string;
  type: string;
  data: { object: { customer?: string | null } };
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  const rawBody = await request.text();
  const valid = await verifyStripeSignature(
    rawBody,
    request.headers.get("stripe-signature"),
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
  if (!valid) return new NextResponse("Invalid signature", { status: 400 });

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return new NextResponse("Malformed payload", { status: 400 });
  }
  if (!event?.id || !event?.type) return new NextResponse("Malformed event", { status: 400 });

  const admin = createAdminClient();

  // Idempotency: claim the event id before doing work. Duplicate delivery
  // (Stripe retries) hits the primary-key conflict and is acknowledged as
  // already-processed.
  //
  // Known MVP debt: a crash between this claim and the org update leaves the
  // event claimed-but-unapplied (retry sees the conflict and acks). Closing
  // the window needs a pending/processed status column or a transaction —
  // acceptable risk at demo scale, revisit with the real Stripe build.
  const { error: claimError } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (claimError) {
    if (claimError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    console.error("[stripe] event claim failed:", claimError.message);
    return new NextResponse("Storage error", { status: 500 });
  }

  if (!(HANDLED_EVENT_TYPES as readonly string[]).includes(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const customerId = event.data?.object?.customer ?? null;
  if (!customerId) {
    // Nothing to route the event to — acknowledge so Stripe stops retrying.
    console.error(`[stripe] ${event.type} ${event.id} has no customer id`);
    return NextResponse.json({ received: true });
  }

  const { data: org } = await admin.from("orgs").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  if (!org) {
    console.error(`[stripe] no org for customer ${customerId} (event ${event.id})`);
    return NextResponse.json({ received: true });
  }

  // Checkout completed → lifetime Pro. One-time purchase, so there is no
  // renewal, no cancel, no downgrade path. subscription_status="lifetime"
  // records how Pro was granted; grace_expires_at cleared for good measure.
  const update = { subscription_tier: "pro", subscription_status: "lifetime", grace_expires_at: null };

  {
    const { error: updateError } = await admin.from("orgs").update(update).eq("id", org.id);
    if (updateError) {
      console.error(`[stripe] org update failed for event ${event.id}:`, updateError.message);
      // Surface a 500 so Stripe retries — the event row blocks double-apply,
      // so remove the claim to allow the retry to process.
      await admin.from("stripe_events").delete().eq("id", event.id);
      return new NextResponse("Update failed", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
