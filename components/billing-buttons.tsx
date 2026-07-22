"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelProSubscription, startProCheckout, type BillingActionState } from "@/lib/actions/billing";

export function UpgradeButton() {
  const [state, formAction, pending] = useActionState<BillingActionState, FormData>(
    async () => startProCheckout(),
    null,
  );

  return (
    <form action={formAction} className="mt-5 space-y-2">
      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending ? "Starting checkout..." : "Get Pro — $40/mo"}
      </Button>
      {state?.error && <p className="text-center text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

// Cancel the monthly subscription. Two-step confirm (no dialog dep). Schedules
// cancel_at_period_end — the org keeps Pro until the period ends, no re-charge.
export function CancelSubscriptionButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-3 w-full rounded-full text-muted-foreground"
        onClick={() => setConfirming(true)}
      >
        Cancel subscription
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-center text-xs text-muted-foreground">
        Cancel at period end? You keep Pro until then — no further charges.
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-full"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Keep Pro
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1 rounded-full"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await cancelProSubscription();
              if (res?.error) toast.error(res.error);
              else toast.success("Subscription will cancel at the end of the billing period.");
              setConfirming(false);
            })
          }
        >
          {pending ? "Cancelling..." : "Confirm cancel"}
        </Button>
      </div>
    </div>
  );
}

// Compact CTA for the dashboard usage banner. Success redirects to Stripe, so
// there's nothing to render on success — only the failure path needs a surface,
// and the banner has no room for one, hence the toast.
export function UpgradeProCta() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="onPrimary"
      disabled={pending}
      className="shrink-0 rounded-full"
      onClick={() =>
        startTransition(async () => {
          const result = await startProCheckout();
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {pending ? "Starting checkout..." : "Get Pro — $40/mo"}
    </Button>
  );
}
