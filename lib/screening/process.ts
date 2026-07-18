import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getScorer } from "@/lib/ai/scorer";

// DB-backed queue worker. Runs post-response via next/server `after()` — kicked
// from the upload action and the candidates page, so no extra infra (no pg_cron,
// no Edge Function). Uses the service-role client: processing spans the whole
// queue, and RLS on processing_jobs only grants service_role write access.
//
// Retry contract (CLAUDE.md): max 2 retries = 3 attempts total, then status
// 'failed' + non-sensitive error_message.

const MAX_ATTEMPTS = 3;
const BATCH_LIMIT = 20; // per run — a kick handles one upload batch (≤10) comfortably
const SCORE_TIMEOUT_MS = 30_000;

type PendingJob = {
  id: string;
  candidate_id: string;
  retry_count: number;
};

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Scoring timed out after ${ms}ms.`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function processPendingJobs(): Promise<void> {
  const supabase = createAdminClient();

  // Loop passes so a failed-then-requeued job can retry within the same run
  // instead of waiting for the next kick. Bounded by MAX_ATTEMPTS passes.
  for (let pass = 0; pass < MAX_ATTEMPTS; pass++) {
    const { data: jobs, error } = await supabase
      .from("processing_jobs")
      .select("id, candidate_id, retry_count")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH_LIMIT);

    if (error || !jobs || jobs.length === 0) return;

    for (const job of jobs as PendingJob[]) {
      await processOneJob(supabase, job);
    }
  }
}

async function processOneJob(supabase: ReturnType<typeof createAdminClient>, job: PendingJob): Promise<void> {
  // Atomic claim (compare-and-swap on status) — a concurrent kick that grabbed
  // the same pending row first wins; we skip.
  const { data: claimed } = await supabase
    .from("processing_jobs")
    .update({ status: "processing" })
    .eq("id", job.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!claimed) return;

  try {
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, extracted_text, job_openings(title, description, criteria, requirements, skills)")
      .eq("id", job.candidate_id)
      .single();

    if (candidateError || !candidate) throw new Error("Candidate row not found.");

    const opening = candidate.job_openings as unknown as {
      title: string;
      description: string;
      criteria: string;
      requirements: string | null;
      skills: string[] | null;
    } | null;
    if (!opening) throw new Error("Job opening not found for candidate.");

    const cvText = candidate.extracted_text ?? "";
    if (cvText.trim() === "") {
      // Not retryable — no text after both the embedded layer and OCR. The file
      // is likely blank, corrupted, or an unreadable scan.
      await failJob(supabase, job.id, "No text could be read from this PDF, even after OCR. The file may be blank, corrupted, or an unreadable scan.");
      return;
    }

    const scorer = getScorer();
    const result = await withTimeout(
      scorer.score({
        jobTitle: opening.title,
        // Requirements + skills ride along as secondary context; criteria stays
        // the primary constraint per the scorer prompt contract.
        jobDescription: [
          opening.description,
          opening.requirements?.trim() ? `Requirements:\n${opening.requirements}` : "",
          opening.skills?.length ? `Desired skills: ${opening.skills.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        criteria: opening.criteria,
        cvText,
      }),
      SCORE_TIMEOUT_MS,
    );

    const { error: updateError } = await supabase
      .from("candidates")
      .update({ score: result.score, summary: result.summary, red_flags: result.red_flags })
      .eq("id", job.candidate_id);
    if (updateError) throw new Error(`Failed to save score: ${updateError.message}`);

    const { error: doneError } = await supabase
      .from("processing_jobs")
      .update({ status: "done", error_message: null })
      .eq("id", job.id);
    // Score is saved; a stuck 'processing' row only affects the status badge.
    if (doneError) console.error(`[screening] job ${job.id} scored but status update failed:`, doneError.message);
  } catch (err) {
    const attemptsSoFar = job.retry_count + 1; // this attempt included
    // Log full detail server-side; the stored message stays non-sensitive.
    console.error(`[screening] job ${job.id} attempt ${attemptsSoFar}/${MAX_ATTEMPTS} failed:`, err);

    if (attemptsSoFar >= MAX_ATTEMPTS) {
      await failJob(supabase, job.id, "Scoring failed after 3 attempts. Re-upload the CV to try again.");
    } else {
      const { error: requeueError } = await supabase
        .from("processing_jobs")
        .update({ status: "pending", retry_count: attemptsSoFar })
        .eq("id", job.id);
      if (requeueError) console.error(`[screening] job ${job.id} requeue failed:`, requeueError.message);
    }
  }
}

async function failJob(supabase: ReturnType<typeof createAdminClient>, jobId: string, message: string): Promise<void> {
  const { error } = await supabase
    .from("processing_jobs")
    .update({ status: "failed", error_message: message })
    .eq("id", jobId);
  if (error) console.error(`[screening] job ${jobId} fail-state update failed:`, error.message);
}
