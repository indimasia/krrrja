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

// Parses raw URL search params into validated candidate filters. Shared by the
// candidates page and the CSV export route so both interpret ?status/?q/?from/
// ?to/?sort/?dir identically and the export matches the table.
export type CandidateFilterParams = {
  status?: string;
  sort?: string;
  dir?: string;
  q?: string;
  from?: string;
  to?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseCandidateFilters(sp: CandidateFilterParams): {
  status?: CandidateStatus;
  sort: CandidateSort;
  dir: "asc" | "desc";
  q?: string;
  from?: string;
  to?: string;
} {
  const status = CANDIDATE_STATUS_VALUES.includes(sp.status as CandidateStatus)
    ? (sp.status as CandidateStatus)
    : undefined;
  const sort = CANDIDATE_SORT_VALUES.includes(sp.sort as CandidateSort) ? (sp.sort as CandidateSort) : "score";
  const dir = sp.dir === "asc" || sp.dir === "desc" ? sp.dir : sort === "score" ? "desc" : "asc";
  const q = sp.q?.trim() || undefined;
  const from = sp.from && DATE_RE.test(sp.from) ? sp.from : undefined;
  const to = sp.to && DATE_RE.test(sp.to) ? sp.to : undefined;
  return { status, sort, dir, q, from, to };
}

// In-memory filters applied after the DB query: search (name or score) and an
// inclusive created_at date range. Shared by the candidates page and the CSV
// export route so the download always matches what the table shows. In-memory
// because the displayed name is derived from file_name in JS, so a DB ilike
// can't match it exactly, and per-job candidate lists are small.
export type CandidateClientFilters = { q?: string; from?: string; to?: string };

export function filterCandidates(candidates: Candidate[], f: CandidateClientFilters): Candidate[] {
  const q = f.q?.trim().toLowerCase();
  const fromTs = f.from ? Date.parse(f.from) : NaN;
  // `to` is inclusive — cut off at the following midnight.
  const toTs = f.to ? Date.parse(f.to) + 24 * 60 * 60 * 1000 : NaN;

  return candidates.filter((c) => {
    if (q) {
      const nameHit = c.name.toLowerCase().includes(q);
      const scoreHit = c.score !== null && String(c.score).includes(q);
      if (!nameHit && !scoreHit) return false;
    }
    const ts = Date.parse(c.createdAt);
    if (!Number.isNaN(fromTs) && ts < fromTs) return false;
    if (!Number.isNaN(toTs) && ts >= toTs) return false;
    return true;
  });
}

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
