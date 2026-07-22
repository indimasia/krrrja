"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Candidate } from "@/lib/data/candidates";
import { scoreTint } from "@/lib/candidate-score";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  );
}

// Uncontrolled by default (renders its own "Detail" trigger button). Pass
// open/onOpenChange to control it externally — e.g. from the "..." actions
// menu — in which case no trigger is rendered.
export function CandidateDetailDialog({
  candidate,
  open,
  onOpenChange,
}: {
  candidate: Candidate;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const c = candidate;
  const controlled = open !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!controlled && <DialogTrigger render={<Button variant="outline" size="sm" />}>Detail</DialogTrigger>}
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{c.name}</DialogTitle>
          <DialogDescription>
            {c.fileName} · added{" "}
            {new Date(c.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {c.processingState === "Scored" && c.score !== null ? (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${scoreTint(c.score)}`}>
              Score {c.score}
            </span>
          ) : c.processingState === "Failed" ? (
            <Badge variant="destructive">Failed</Badge>
          ) : (
            <Badge variant="outline" className="animate-pulse">
              Processing
            </Badge>
          )}
          <Badge variant="outline">{c.status}</Badge>
        </div>

        {c.processingState === "Failed" && c.processingError && (
          <Section label="Error">
            <p className="text-sm text-destructive break-words">{c.processingError}</p>
          </Section>
        )}

        <Section label="Summary">
          {c.summary.length > 0 ? (
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {c.summary.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Not available yet.</p>
          )}
        </Section>

        <Section label="Red flags">
          {c.redFlags.length > 0 ? (
            <ul className="list-disc space-y-1 pl-4 text-sm text-amber-700 dark:text-amber-400">
              {c.redFlags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None</p>
          )}
        </Section>

        <Section label="Notes">
          <p className="text-sm whitespace-pre-wrap">
            {c.notes?.trim() ? c.notes : <span className="text-muted-foreground">No notes.</span>}
          </p>
        </Section>
      </DialogContent>
    </Dialog>
  );
}
