"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Eye, FileText, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CandidateDetailDialog } from "@/components/candidate-detail-dialog";
import { updateCandidateStatus, type CandidateStatus } from "@/lib/actions/candidates";
import type { Candidate } from "@/lib/data/candidates";

// "..." menu in the candidates table action column: open the detail dialog or
// jump the status straight to Shortlisted/Rejected (full status control stays
// in the Status column menu).

export function CandidateActions({ candidate }: { candidate: Candidate }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function setStatus(next: CandidateStatus) {
    if (next === candidate.status) return;
    startTransition(async () => {
      const result = await updateCandidateStatus(candidate.id, next);
      if (result?.error) toast.error(result.error);
      else toast.success(`${candidate.name} marked ${next}.`);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" disabled={pending} aria-label={`Actions for ${candidate.name}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setDetailOpen(true)}>
            <Eye className="size-4" />
            Detail
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={candidate.status === "Shortlisted"}
            onClick={() => setStatus("Shortlisted")}
          >
            <FileText className="size-4" />
            Shortlist
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            disabled={candidate.status === "Rejected"}
            onClick={() => setStatus("Rejected")}
          >
            <X className="size-4" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CandidateDetailDialog candidate={candidate} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
