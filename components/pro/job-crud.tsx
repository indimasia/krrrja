"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createJob, deleteJob, updateJob } from "@/lib/actions/platform";
import type { OrgOption, PlatformJob } from "@/lib/data/platform";

type JobFields = {
  orgId?: string;
  title?: string;
  description?: string;
  criteria?: string;
  status?: string;
  orgLocked?: boolean;
  orgs: OrgOption[];
};

function JobFormFields({ orgId, title, description, criteria, status, orgLocked, orgs }: JobFields) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="job-org">Organization</Label>
        {orgLocked ? (
          <Input value={orgs.find((o) => o.id === orgId)?.name ?? "—"} readOnly className="h-11 rounded-xl" />
        ) : (
          <Select name="orgId" defaultValue={orgId}>
            <SelectTrigger id="job-org" className="h-11 w-full rounded-xl">
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
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="job-title">Title</Label>
        <Input id="job-title" name="title" defaultValue={title} className="h-11 rounded-xl" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="job-desc">Description</Label>
        <Textarea id="job-desc" name="description" defaultValue={description} rows={3} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="job-criteria">Criteria</Label>
        <Textarea id="job-criteria" name="criteria" defaultValue={criteria} rows={3} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="job-status">Status</Label>
        <Select name="status" defaultValue={status ?? "active"}>
          <SelectTrigger id="job-status" className="h-11 w-40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function NewJobButton({ orgs }: { orgs: OrgOption[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button className="rounded-full" onClick={() => setOpen(true)}>
        New job
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New job opening</DialogTitle>
            <DialogDescription>Create a job under any organization.</DialogDescription>
          </DialogHeader>
          <form
            action={(fd) =>
              startTransition(async () => {
                const result = await createJob(null, fd);
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("Job created.");
                  setOpen(false);
                }
              })
            }
          >
            <JobFormFields orgs={orgs} />
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

export function JobRowActions({ job, orgs }: { job: PlatformJob; orgs: OrgOption[] }) {
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
            <DialogTitle>Edit job opening</DialogTitle>
            <DialogDescription>{job.orgName}</DialogDescription>
          </DialogHeader>
          <form
            action={(fd) =>
              startTransition(async () => {
                const result = await updateJob(job.id, null, fd);
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("Job updated.");
                  setEditOpen(false);
                }
              })
            }
          >
            <JobFormFields
              orgs={orgs}
              orgId={job.orgId}
              orgLocked
              title={job.title}
              description={job.description}
              criteria={job.criteria}
              status={job.status}
            />
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
            <DialogTitle>Delete job opening?</DialogTitle>
            <DialogDescription>
              This permanently deletes &quot;{job.title}&quot; and all its candidates. Cannot be undone.
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
                  const result = await deleteJob(job.id);
                  if (result?.error) toast.error(result.error);
                  else {
                    toast.success("Job deleted.");
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
