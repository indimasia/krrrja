import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { processPendingJobs } from "@/lib/screening/process";
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
import { AutoRefresh } from "@/components/auto-refresh";
import { CandidateActions } from "@/components/candidate-actions";
import { CandidateFilters } from "@/components/candidate-filters";
import { scoreTint } from "@/lib/candidate-score";
import { CandidateStatusMenu } from "@/components/candidate-status-menu";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { getJobOpening } from "@/lib/data/jobs";
import { getOrgContext } from "@/lib/data/org";
import {
  CANDIDATE_STATUS_VALUES,
  filterCandidates,
  listCandidates,
  parseCandidateFilters,
  type CandidateSort,
} from "@/lib/data/candidates";
import { canExportData } from "@/lib/permissions";

type SearchParams = { status?: string; sort?: string; dir?: string; q?: string; from?: string; to?: string };

function queryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function SortHeader({
  href,
  active,
  dir,
  children,
}: {
  href: string;
  active: boolean;
  dir: "asc" | "desc";
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 hover:text-foreground">
      {children}
      {active && (dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
    </Link>
  );
}

export default async function CandidatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { status, sort, dir, q, from, to } = parseCandidateFilters(await searchParams);
  // Independent queries — run concurrently, this page re-fetches on every
  // filter change and the sequential chain was the felt latency.
  const [job, all] = await Promise.all([
    getJobOpening(id),
    listCandidates(id, ctx.orgId, { status, sort, dir }),
  ]);
  if (!job) notFound();
  const candidates = filterCandidates(all, { q, from, to });
  const filtersActive = Boolean(status || q || from || to);

  const basePath = `/admin/jobs/${job.id}/candidates`;
  const sortLink = (col: CandidateSort) => {
    // Clicking the active column flips direction; a new column gets its default.
    const nextDir = sort === col ? (dir === "asc" ? "desc" : "asc") : col === "score" ? "desc" : "asc";
    return `${basePath}${queryString({ status, sort: col, dir: nextDir, q, from, to })}`;
  };

  // Straggler sweep: retry any pending/requeued scoring jobs after this page
  // renders (no-op query when the queue is empty).
  after(() => processPendingJobs());

  const anyProcessing = candidates.some((c) => c.processingState === "Processing");

  return (
    <div className="space-y-6">
      <AutoRefresh active={anyProcessing} />
      <PageHeader
        title={`${job.title} — Candidates`}
        description="Ranked by score, highest first."
        action={
          canExportData(ctx.role) ? (
            <Button
              variant="outline"
              className="rounded-full"
              // Export carries the current filters so the CSV matches the table.
              render={<a href={`${basePath}/export${queryString({ status, q, from, to })}`}>Export CSV</a>}
            />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[undefined, ...CANDIDATE_STATUS_VALUES].map((s) => (
            <Link
              key={s ?? "all"}
              href={`${basePath}${queryString({ status: s, sort, dir, q, from, to })}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {s ?? "All"}
            </Link>
          ))}
        </div>
        <CandidateFilters />
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader href={sortLink("name")} active={sort === "name"} dir={dir}>Name</SortHeader>
              </TableHead>
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <SortHeader href={sortLink("score")} active={sort === "score"} dir={dir}>Score</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader href={sortLink("date")} active={sort === "date"} dir={dir}>Added at</SortHeader>
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {filtersActive
                    ? "No candidates match the current filters."
                    : "No candidates yet — upload CVs from the job opening page."}
                </TableCell>
              </TableRow>
            )}
            {candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium whitespace-nowrap">{c.name}</TableCell>
                <TableCell className="max-w-48">
                  <span className="block truncate text-sm text-muted-foreground" title={c.fileName}>
                    {c.fileName}
                  </span>
                </TableCell>
                <TableCell>
                  <CandidateStatusMenu candidateId={c.id} status={c.status} />
                </TableCell>
                <TableCell>
                  {c.processingState === "Scored" && c.score !== null ? (
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${scoreTint(c.score)}`}>
                      {c.score}
                    </span>
                  ) : c.processingState === "Failed" ? (
                    <Badge variant="destructive">Failed</Badge>
                  ) : (
                    <Badge variant="outline" className="animate-pulse">
                      Processing
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </TableCell>
                <TableCell>
                  <CandidateActions candidate={c} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
