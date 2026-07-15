"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createOrg, deleteOrg, updateOrg } from "@/lib/actions/platform";
import type { PlatformOrg } from "@/lib/data/platform";

function OrgFields({ name, tier }: { name?: string; tier?: string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Name</Label>
        <Input id="org-name" name="name" defaultValue={name} className="h-11 rounded-xl" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-tier">Plan</Label>
        <Select name="tier" defaultValue={tier ?? "free"}>
          <SelectTrigger id="org-tier" className="h-11 w-40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function NewOrgButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button className="rounded-full" onClick={() => setOpen(true)}>
        New org
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New organization</DialogTitle>
            <DialogDescription>Creates an empty tenant. Add users from the User page.</DialogDescription>
          </DialogHeader>
          <form
            action={(fd) =>
              startTransition(async () => {
                const result = await createOrg(null, fd);
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("Organization created.");
                  setOpen(false);
                }
              })
            }
          >
            <OrgFields />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending} className="rounded-full">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OrgRowActions({ org }: { org: PlatformOrg }) {
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditOpen(true)}>
        Edit
      </Button>
      <Button variant="destructive" size="sm" className="rounded-full" onClick={() => setDelOpen(true)}>
        Delete
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit organization</DialogTitle>
            <DialogDescription>Rename or change plan.</DialogDescription>
          </DialogHeader>
          <form
            action={(fd) =>
              startTransition(async () => {
                const result = await updateOrg(org.id, null, fd);
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("Organization updated.");
                  setEditOpen(false);
                }
              })
            }
          >
            <OrgFields name={org.name} tier={org.subscriptionTier} />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending} className="rounded-full">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organization?</DialogTitle>
            <DialogDescription>
              Permanently deletes &quot;{org.name}&quot; with all its members, jobs and candidates. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setDelOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              className="rounded-full"
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteOrg(org.id);
                  if (result?.error) toast.error(result.error);
                  else {
                    toast.success("Organization deleted.");
                    setDelOpen(false);
                  }
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
