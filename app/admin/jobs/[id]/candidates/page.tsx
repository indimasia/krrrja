import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_CANDIDATES, type CandidateStatus } from "@/lib/mock-data";
import { PageHeader } from "@/components/page-header";
import { getJobOpening } from "@/lib/data/jobs";

const STATUS_OPTIONS: CandidateStatus[] = ["New", "Reviewed", "Shortlisted", "Rejected"];

function scoreTint(score: number | null) {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score >= 85) return "bg-secondary text-secondary-foreground";
  if (score >= 60) return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
}

export default async function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobOpening(id);
  if (!job) notFound();

  const candidates = MOCK_CANDIDATES.filter((c) => c.jobOpeningId === id).sort(
    (a, b) => (b.score ?? -1) - (a.score ?? -1),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={`${job.title} — Candidates`} description="Ranked by score, highest first." />

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Red flags</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium whitespace-nowrap">{c.fileName}</TableCell>
                <TableCell>
                  {c.processingStatus === "Scored" ? (
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${scoreTint(c.score)}`}>
                      {c.score}
                    </span>
                  ) : (
                    <Badge variant="outline">{c.processingStatus}</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {c.summary.length > 0 ? (
                    <ul className="text-sm space-y-0.5 list-disc pl-4">
                      {c.summary.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {c.redFlags.length > 0 ? (
                    <ul className="text-sm space-y-0.5 list-disc pl-4 text-amber-700 dark:text-amber-400">
                      {c.redFlags.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" size="sm">
                          {c.status}
                        </Button>
                      }
                    />
                    <DropdownMenuContent>
                      {STATUS_OPTIONS.map((s) => (
                        <DropdownMenuItem key={s}>{s}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
