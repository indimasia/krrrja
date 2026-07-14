"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { acceptInvite, activateAndAcceptInvite, type InviteActionState } from "@/lib/actions/invite";

// Consent-card action block. Modes:
//  - "accept": signed-in user, just confirm.
//  - "accept-set-password": signed in via invite link (no password yet) — set one while joining.
//  - "activate": not signed in, fresh invite-created account — choose password, account activates + joins.
export function InviteAccept({
  token,
  mode,
  orgName,
}: {
  token: string;
  mode: "accept" | "accept-set-password" | "activate";
  orgName: string;
}) {
  const action = mode === "activate" ? activateAndAcceptInvite : acceptInvite;
  const [state, formAction, pending] = useActionState<InviteActionState, FormData>(
    action.bind(null, token),
    null,
  );

  const needsPassword = mode !== "accept";

  return (
    <form action={formAction} className="space-y-4">
      {needsPassword && (
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="password">Choose a password</Label>
            <PasswordInput id="password" name="password" className="h-11 rounded-xl" required minLength={8} />
          </div>
          {mode === "activate" && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <PasswordInput
                id="confirm-password"
                name="confirm-password"
                className="h-11 rounded-xl"
                required
                minLength={8}
              />
            </div>
          )}
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={pending} className="h-11 w-full rounded-full text-base">
          {pending ? "Joining…" : `Join ${orgName}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full text-base"
          render={<Link href="/">Cancel</Link>}
        />
      </div>
    </form>
  );
}
