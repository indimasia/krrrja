"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJobOpening, type JobFormState } from "@/lib/actions/jobs";

export function JobForm() {
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(createJobOpening, null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Job title</Label>
        <Input id="title" name="title" placeholder="e.g. Senior Backend Engineer" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Job description</Label>
        <Textarea id="description" name="description" rows={5} placeholder="Responsibilities, team, what success looks like..." required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="criteria">Screening criteria</Label>
        <Textarea
          id="criteria"
          name="criteria"
          rows={5}
          placeholder="e.g. 5+ yrs Node.js, distributed systems experience, startup background preferred"
          required
        />
        <p className="text-xs text-muted-foreground">
          Free text — AI treats this as the primary constraint when scoring CVs.
        </p>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="rounded-full px-5">
          {pending ? "Creating..." : "Create job opening"}
        </Button>
        <Button type="button" variant="outline" className="rounded-full px-5" render={<Link href="/dashboard">Cancel</Link>} />
      </div>
    </form>
  );
}
