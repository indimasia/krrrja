"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { logout } from "@/lib/auth-actions";

// Confirm-before-logout. Used in every dashboard shell (admin, pro).
export function LogoutDialog({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="ghost" size="sm" className={cn(className, "hover:bg-destructive/10 hover:text-destructive")}>
            <LogOut />
            Log out
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log out?</DialogTitle>
          <DialogDescription>You will be signed out of your Krrrja session.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline" className="rounded-full">
                Cancel
              </Button>
            }
          />
          <Button
            type="button"
            disabled={pending}
            className="rounded-full"
            onClick={() => startTransition(() => logout())}
          >
            {pending ? "Logging out…" : "Log out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
