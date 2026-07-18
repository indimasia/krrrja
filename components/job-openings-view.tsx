"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { JobOpening } from "@/lib/data/jobs";

type ViewMode = "grid" | "table";

export function JobOpeningsView({ jobOpenings }: { jobOpenings: JobOpening[] }) {
  const [view, setView] = useState<ViewMode>("grid");
  const router = useRouter();

  if (jobOpenings.length === 0) {
    return <p className="text-sm text-muted-foreground">No job openings yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          {(
            [
              { mode: "grid", icon: LayoutGrid, label: "Grid view" },
              { mode: "table", icon: List, label: "Table view" },
            ] as const
          ).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              aria-label={label}
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                view === mode
                  ? "bg-primary-fill text-primary-ink"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobOpenings.map((job) => (
            <Link key={job.id} href={`/admin/jobs/${job.id}`}>
              <Card className="h-full rounded-3xl transition-all duration-200 hover:border-primary hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold">{job.title}</CardTitle>
                    <Badge variant={job.status === "active" ? "default" : "outline"}>{job.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary-surface px-2.5 py-1 font-semibold text-primary-ink">
                      {job.candidateCount} candidates
                    </span>
                    <span>created {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Candidates</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobOpenings.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/jobs/${job.id}`)}
                >
                  <TableCell>
                    <p className="font-semibold">{job.title}</p>
                    <p className="max-w-md truncate text-xs text-muted-foreground">{job.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.status === "active" ? "default" : "outline"}>{job.status}</Badge>
                  </TableCell>
                  <TableCell>{job.candidateCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
