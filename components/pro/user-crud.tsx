"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createUser, deleteUser, removeMember, updateMemberRole } from "@/lib/actions/platform";
import type { OrgOption, PlatformUser } from "@/lib/data/platform";

export function NewUserButton({ orgs }: { orgs: OrgOption[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button className="rounded-full" onClick={() => setOpen(true)}>
        New user
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>Creates a confirmed account and attaches it to an organization.</DialogDescription>
          </DialogHeader>
          <form
            action={(fd) =>
              startTransition(async () => {
                const result = await createUser(null, fd);
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("User created.");
                  setOpen(false);
                }
              })
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" name="email" type="email" className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  name="password"
                  type="text"
                  placeholder="min 8 characters"
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-org">Organization</Label>
                <Select name="orgId">
                  <SelectTrigger id="user-org" className="h-11 w-full rounded-xl">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select name="role" defaultValue="member">
                  <SelectTrigger id="user-role" className="h-11 w-40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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

export function UserRowActions({ user }: { user: PlatformUser }) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function setRole(role: "admin" | "member") {
    if (role === user.role) return;
    startTransition(async () => {
      const result = await updateMemberRole(user.memberId, role);
      if (result?.error) toast.error(result.error);
      else toast.success(`Role set to ${role}.`);
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="rounded-full" disabled={pending}>
              Role
            </Button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setRole("admin")}>Admin</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRole("member")}>Member</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setRemoveOpen(true)}>
        Remove
      </Button>
      <Button variant="destructive" size="sm" className="rounded-full" onClick={() => setDelOpen(true)}>
        Delete
      </Button>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from organization?</DialogTitle>
            <DialogDescription>
              Detaches {user.email} from {user.orgName}. The account is kept and can rejoin via invite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              className="rounded-full"
              onClick={() =>
                startTransition(async () => {
                  const result = await removeMember(user.memberId);
                  if (result?.error) toast.error(result.error);
                  else {
                    toast.success("Removed from organization.");
                    setRemoveOpen(false);
                  }
                })
              }
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              Permanently deletes {user.email} and all their memberships. Cannot be undone.
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
                  const result = await deleteUser(user.userId);
                  if (result?.error) toast.error(result.error);
                  else {
                    toast.success("Account deleted.");
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
