import { createClient } from "@/lib/supabase/server";
import type { CandidateStatus } from "@/lib/actions/candidates";

// Pipeline state (upload → scoring), distinct from the recruiter-facing
// CandidateStatus workflow (New/Reviewed/Shortlisted/Rejected).
export type ProcessingState = "Processing" | "Scored" | "Failed";

export type Candidate = {
  id: string;
  name: string;
  fileName: string;
  score: number | null;
  summary: string[];
  redFlags: string[];
  status: CandidateStatus;
  notes: string | null;
  createdAt: string;
  processingState: ProcessingState;
  processingError: string | null;
};

type JobRow = { status: string; error_message: string | null; created_at: string };

function deriveProcessingState(score: number | null, jobs: JobRow[]): { state: ProcessingState; error: string | null } {
  if (score !== null) return { state: "Scored", error: null };
  // Latest job wins (re-uploads could leave more than one).
  const latest = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (latest?.status === "failed") return { state: "Failed", error: latest.error_message };
  return { state: "Processing", error: null };
}

// MVP: candidate name is derived from the uploaded file name (no AI extraction yet).
export function candidateDisplayName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base || fileName;
}

export const CANDIDATE_STATUS_VALUES: CandidateStatus[] = ["New", "Reviewed", "Shortlisted", "Rejected"];

export type CandidateSort = "score" | "name" | "date";
export const CANDIDATE_SORT_VALUES: CandidateSort[] = ["score", "name", "date"];

export type CandidateListOptions = {
  status?: CandidateStatus;
  sort?: CandidateSort;
  dir?: "asc" | "desc";
};

const SORT_COLUMNS: Record<CandidateSort, string> = {
  score: "score",
  name: "file_name",
  date: "created_at",
};

// Ranked list for one job opening. org_id filter is explicit even though RLS
// already scopes reads — defense in depth, and it keeps the query index-friendly.
export async function listCandidates(
  jobOpeningId: string,
  orgId: string,
  opts: CandidateListOptions = {},
): Promise<Candidate[]> {
  const sort = opts.sort ?? "score";
  const ascending = opts.dir ? opts.dir === "asc" : sort !== "score"; // score defaults desc, others asc

  const supabase = await createClient();
  let query = supabase
    .from("candidates")
    .select("id, file_name, score, summary, red_flags, status, notes, created_at, processing_jobs(status, error_message, created_at)")
    .eq("job_opening_id", jobOpeningId)
    .eq("org_id", orgId);

  if (opts.status) query = query.eq("status", opts.status);

  const { data, error } = await query.order(SORT_COLUMNS[sort], {
    ascending,
    nullsFirst: false,
  });

  if (error || !data) return [];

  return data.map((c) => {
    const jobs = (c.processing_jobs as unknown as JobRow[]) ?? [];
    const { state, error: processingError } = deriveProcessingState(c.score, jobs);
    return {
      id: c.id,
      name: candidateDisplayName(c.file_name),
      fileName: c.file_name,
      score: c.score,
      summary: Array.isArray(c.summary) ? (c.summary as string[]) : [],
      redFlags: Array.isArray(c.red_flags) ? (c.red_flags as string[]) : [],
      status: c.status as CandidateStatus,
      notes: c.notes,
      createdAt: c.created_at,
      processingState: state,
      processingError,
    };
  });
}
