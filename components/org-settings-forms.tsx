"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inviteMember, updateOrgName, type OrgActionState } from "@/lib/actions/org";

export function OrgNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState<OrgActionState, FormData>(updateOrgName, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="min-w-64 flex-1 space-y-2">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          name="org-name"
          defaultValue={currentName}
          className="h-11 rounded-xl"
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="h-11 rounded-full px-6">
        {pending ? "Saving…" : "Save"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="w-full text-sm text-muted-foreground">{state.success}</p>}
    </form>
  );
}

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState<OrgActionState, FormData>(inviteMember, null);
  const [dupOpen, setDupOpen] = useState(false);

  // Duplicate invite/member → surface as a dialog, not inline text.
  useEffect(() => {
    if (state?.duplicate) setDupOpen(true);
  }, [state]);

  return (
    <>
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="min-w-64 flex-1 space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="teammate@company.com"
          className="h-11 rounded-xl"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select name="role" defaultValue="member">
          <SelectTrigger id="invite-role" className="h-11 w-36 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="h-11 rounded-full px-6">
        {pending ? "Sending…" : "Send invite"}
      </Button>
      {state?.error && !state.duplicate && (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && <p className="w-full text-sm text-muted-foreground">{state.success}</p>}
    </form>

    <Dialog open={dupOpen} onOpenChange={setDupOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Already invited</DialogTitle>
          <DialogDescription>
            {state?.error ?? "This account is already invited."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
    </>
  );
}
