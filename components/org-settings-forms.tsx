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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { inviteMember, updateOrgName, deleteOrg, type OrgActionState } from "@/lib/actions/org";

export function OrgSettingsShell({
  orgName,
  isOwner,
  children,
}: {
  orgName: string;
  isOwner: boolean;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Org Information"
        description={
          isOwner
            ? "Manage your organization's profile and team."
            : "View your organization's profile and invite teammates. Only the owner can edit or delete the organization."
        }
        action={
          isOwner ? (
            <Button
              variant={editing ? "outline" : "default"}
              className="rounded-full px-6"
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? "Cancel" : "Edit"}
            </Button>
          ) : undefined
        }
      />

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-bold">Organization</CardTitle>
          <CardDescription>Shown across the app and in invite emails.</CardDescription>
        </CardHeader>
        <CardContent>
          {editing && isOwner ? (
            <OrgNameForm currentName={orgName} onSaved={() => setEditing(false)} />
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Organization name</p>
              <p className="text-base font-medium">{orgName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {children}

      {isOwner && (
        <Card className="rounded-3xl border-destructive/30">
          <CardHeader>
            <CardTitle className="font-bold text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Deleting the organization removes all job openings, candidates, and members. This
              can&apos;t be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteOrgButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DeleteOrgButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<OrgActionState, FormData>(deleteOrg, null);

  return (
    <>
      <Button variant="destructive" className="rounded-full px-6" onClick={() => setOpen(true)}>
        Delete organization
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organization?</DialogTitle>
            <DialogDescription>
              This permanently deletes the organization, its job openings, candidates, and
              members. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter showCloseButton>
            <form action={formAction}>
              <Button type="submit" variant="destructive" disabled={pending} className="rounded-full px-6">
                {pending ? "Deleting…" : "Delete"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OrgNameForm({
  currentName,
  onSaved,
}: {
  currentName: string;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState<OrgActionState, FormData>(updateOrgName, null);

  // Leave edit mode once the rename lands.
  useEffect(() => {
    if (state?.success) onSaved?.();
  }, [state, onSaved]);

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
