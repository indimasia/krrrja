"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateCandidateStatus, type CandidateStatus } from "@/lib/actions/candidates";

const STATUS_OPTIONS: CandidateStatus[] = ["New", "Reviewed", "Shortlisted", "Rejected"];

export function CandidateStatusMenu({ candidateId, status }: { candidateId: string; status: CandidateStatus }) {
  const [pending, startTransition] = useTransition();

  function setStatus(next: CandidateStatus) {
    if (next === status) return;
    startTransition(async () => {
      const result = await updateCandidateStatus(candidateId, next);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={pending}>
            {status}
          </Button>
        }
      />
      <DropdownMenuContent>
        {STATUS_OPTIONS.map((s) => (
          <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
