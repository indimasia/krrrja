-- Monthly subscription: persist the Stripe subscription id on the org so the
-- in-app "Cancel subscription" action can schedule cancel_at_period_end.
-- grace_expires_at (added in the billing migration) records when Pro actually
-- lapses once a cancellation is scheduled.

alter table orgs add column stripe_subscription_id text;
