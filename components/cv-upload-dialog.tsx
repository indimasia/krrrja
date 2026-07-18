"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CvUpload } from "@/components/cv-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CvUploadDialog({ jobOpeningId }: { jobOpeningId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-full px-5" />}>Upload CV</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload CVs</DialogTitle>
          <DialogDescription>AI will score each candidate against this opening&apos;s criteria.</DialogDescription>
        </DialogHeader>
        <CvUpload
          jobOpeningId={jobOpeningId}
          onSuccess={(count) => {
            setOpen(false);
            toast.success(`${count} CV${count > 1 ? "s" : ""} uploaded — queued for scoring.`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
