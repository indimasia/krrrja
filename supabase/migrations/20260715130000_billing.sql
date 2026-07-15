-- Billing groundwork (Stripe integration wired later — keys not yet provisioned).
--
-- stripe_events: webhook idempotency ledger keyed by Stripe event.id. Webhook
-- handler INSERTs before processing; a conflict means the event was already
-- handled (Stripe retries deliveries) and must be skipped.

create table stripe_events (
  id text primary key, -- Stripe event.id ("evt_...")
  type text not null,
  processed_at timestamptz not null default now()
);

alter table stripe_events enable row level security;

-- Service role only (webhook handler). No policies for authenticated/anon =
-- default-deny; service role bypasses RLS.

-- Grace period: on subscription cancellation the org keeps Pro until this
-- timestamp (cancel + 3 days per spec), then limits re-apply.
alter table orgs add column grace_expires_at timestamptz;
