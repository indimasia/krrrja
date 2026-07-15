"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { openCustomerPortal, startProCheckout, type BillingActionState } from "@/lib/actions/billing";

export function UpgradeButton() {
  const [state, formAction, pending] = useActionState<BillingActionState, FormData>(
    async () => startProCheckout(),
    null,
  );

  return (
    <form action={formAction} className="mt-5 space-y-2">
      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending ? "Starting checkout..." : "Upgrade to Pro"}
      </Button>
      {state?.error && <p className="text-center text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function ManageSubscriptionButton() {
  const [state, formAction, pending] = useActionState<BillingActionState, FormData>(
    async () => openCustomerPortal(),
    null,
  );

  return (
    <form action={formAction} className="mt-5 space-y-2">
      <Button type="submit" variant="outline" disabled={pending} className="w-full rounded-full">
        {pending ? "Opening portal..." : "Manage subscription"}
      </Button>
      {state?.error && <p className="text-center text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
