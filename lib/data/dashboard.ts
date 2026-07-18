import { createClient } from "@/lib/supabase/server";
import { candidateDisplayName } from "@/lib/data/candidates";

export type JobRanking = {
  jobId: string;
  jobTitle: string;
  candidateCount: number;
  avgScore: number | null;
  topCandidates: { id: string; name: string; score: number }[];
};

export type DashboardSummary = {
  totalJobs: number;
  totalCandidates: number;
  totalMembers: number;
  avgScore: number | null;
  jobRankings: JobRanking[];
};

const TOP_N_PER_JOB = 5;

// Org-wide rollup for the summary dashboard. Three counts + one aggregate
// query, then candidates grouped/ranked by job in JS (score is per-candidate,
// no cheap way to get per-job top-N via a single Postgres query without RPC).
export async function getDashboardSummary(orgId: string): Promise<DashboardSummary> {
  const supabase = await createClient();

  const [{ count: totalJobs }, { count: totalMembers }, { data: candidateRows }] = await Promise.all([
    supabase.from("job_openings").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("org_members").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase
      .from("candidates")
      .select("id, file_name, score, job_opening_id, job_openings(title)")
      .eq("org_id", orgId)
      .order("score", { ascending: false, nullsFirst: false }),
  ]);

  const rows = (candidateRows ?? []) as unknown as {
    id: string;
    file_name: string;
    score: number | null;
    job_opening_id: string;
    job_openings: { title: string } | null;
  }[];

  const byJob = new Map<string, JobRanking>();
  for (const row of rows) {
    let job = byJob.get(row.job_opening_id);
    if (!job) {
      job = {
        jobId: row.job_opening_id,
        jobTitle: row.job_openings?.title ?? "Untitled job",
        candidateCount: 0,
        avgScore: null,
        topCandidates: [],
      };
      byJob.set(row.job_opening_id, job);
    }
    job.candidateCount += 1;
    if (row.score !== null && job.topCandidates.length < TOP_N_PER_JOB) {
      job.topCandidates.push({ id: row.id, name: candidateDisplayName(row.file_name), score: row.score });
    }
  }

  const scored = rows.filter((r) => r.score !== null);
  for (const job of byJob.values()) {
    const jobScored = rows.filter((r) => r.job_opening_id === job.jobId && r.score !== null);
    job.avgScore = jobScored.length
      ? Math.round(jobScored.reduce((sum, r) => sum + (r.score ?? 0), 0) / jobScored.length)
      : null;
  }

  const jobRankings = [...byJob.values()].sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1));

  return {
    totalJobs: totalJobs ?? 0,
    totalCandidates: rows.length,
    totalMembers: totalMembers ?? 0,
    avgScore: scored.length ? Math.round(scored.reduce((sum, r) => sum + (r.score ?? 0), 0) / scored.length) : null,
    jobRankings,
  };
}
