"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startProCheckout, type BillingActionState } from "@/lib/actions/billing";

export function UpgradeButton() {
  const [state, formAction, pending] = useActionState<BillingActionState, FormData>(
    async () => startProCheckout(),
    null,
  );

  return (
    <form action={formAction} className="mt-5 space-y-2">
      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending ? "Starting checkout..." : "Get Pro — $40 lifetime"}
      </Button>
      {state?.error && <p className="text-center text-xs text-destructive">{state.error}</p>}
    </form>
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
      {pending ? "Starting checkout..." : "Get Pro — $40 lifetime"}
    </Button>
  );
}
