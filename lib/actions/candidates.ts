"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/screening/extract";
import { processPendingJobs } from "@/lib/screening/process";
import { FREE_TIER_LIMITS, getOrgContext, getOrgUsage } from "@/lib/data/org";
import { canUpdateCandidate, canUploadCV } from "@/lib/permissions";

const MAX_FILES = 10;

export type UploadState = { error: string } | { success: true } | null;

export async function uploadCandidates(jobOpeningId: string, _prev: UploadState, formData: FormData): Promise<UploadState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canUploadCV(ctx.role)) return { error: "You don't have permission to upload CVs." };

  // The target opening must belong to the caller's org (RLS re-checks this on
  // the candidates insert, but fail fast with a clear message here).
  const supabaseCheck = await createClient();
  const { data: job } = await supabaseCheck
    .from("job_openings")
    .select("id")
    .eq("id", jobOpeningId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!job) return { error: "Job opening not found in your organization." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "No files selected." };
  if (files.length > MAX_FILES) return { error: `Max ${MAX_FILES} files per upload.` };
  if (files.some((f) => f.type !== "application/pdf")) return { error: "Only PDF files are accepted." };

  if (ctx.subscriptionTier === "free") {
    const usage = await getOrgUsage(ctx.orgId);
    if (usage.cvProcessedThisMonth + files.length > FREE_TIER_LIMITS.maxCvPerMonth) {
      return {
        error: `Free plan limit: ${FREE_TIER_LIMITS.maxCvPerMonth} CVs/month. This upload would exceed it (${usage.cvProcessedThisMonth} already used). Upgrade to Pro for unlimited.`,
      };
    }
  }

  const supabase = await createClient();

  for (const file of files) {
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        job_opening_id: jobOpeningId,
        org_id: ctx.orgId,
        file_name: file.name,
        file_url: "",
        status: "New",
      })
      .select("id")
      .single();

    if (candidateError || !candidate) return { error: candidateError?.message ?? "Failed to create candidate." };

    const bytes = new Uint8Array(await file.arrayBuffer());

    const path = `${ctx.orgId}/${candidate.id}.pdf`;
    const { error: uploadError } = await supabase.storage.from("cvs").upload(path, bytes, {
      contentType: "application/pdf",
    });

    if (uploadError) {
      await supabase.from("candidates").delete().eq("id", candidate.id);
      return { error: uploadError.message };
    }

    // Extract text: embedded layer first, OCR fallback for scanned/image PDFs.
    // Empty on failure — the scoring worker (§5) surfaces "no text" via its own
    // validation; upload should not hard-fail on one bad file.
    let extractedText = "";
    const extracted = await extractPdfText(bytes);
    if (extracted.ok) {
      extractedText = extracted.text;
    } else {
      // Log the real reason server-side; the worker shows a non-sensitive message.
      console.error(`[upload] extraction failed for "${file.name}" (${extracted.reason}): ${extracted.message}`);
    }

    const { error: metaError } = await supabase
      .from("candidates")
      .update({ file_url: path, extracted_text: extractedText })
      .eq("id", candidate.id);
    if (metaError) {
      await supabase.storage.from("cvs").remove([path]);
      await supabase.from("candidates").delete().eq("id", candidate.id);
      return { error: `Failed to save "${file.name}": ${metaError.message}` };
    }

    const { error: queueError } = await supabase
      .from("processing_jobs")
      .insert({ candidate_id: candidate.id, status: "pending" });
    if (queueError) {
      await supabase.storage.from("cvs").remove([path]);
      await supabase.from("candidates").delete().eq("id", candidate.id);
      return { error: `Failed to queue "${file.name}" for scoring: ${queueError.message}` };
    }
  }

  // Score after the response is sent — upload UX never blocks on AI calls.
  after(() => processPendingJobs());

  revalidatePath(`/admin/jobs/${jobOpeningId}`);
  return { success: true };
}

export type CandidateStatus = "New" | "Reviewed" | "Shortlisted" | "Rejected";

const CANDIDATE_STATUSES: CandidateStatus[] = ["New", "Reviewed", "Shortlisted", "Rejected"];

export type CandidateActionState = { error: string } | null;

// Both roles (admin + member) may update status — org-scoped by RLS and by the
// explicit org_id filter below.
export async function updateCandidateStatus(candidateId: string, status: string): Promise<CandidateActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canUpdateCandidate(ctx.role)) return { error: "You don't have permission to update candidates." };
  if (!CANDIDATE_STATUSES.includes(status as CandidateStatus)) return { error: "Invalid status." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .update({ status })
    .eq("id", candidateId)
    .eq("org_id", ctx.orgId)
    .select("job_opening_id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Candidate not found in your organization." };

  revalidatePath(`/admin/jobs/${data.job_opening_id}/candidates`);
  return null;
}

// Both roles may add/edit notes.
export async function updateCandidateNotes(candidateId: string, notes: string): Promise<CandidateActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canUpdateCandidate(ctx.role)) return { error: "You don't have permission to update candidates." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .update({ notes })
    .eq("id", candidateId)
    .eq("org_id", ctx.orgId)
    .select("job_opening_id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Candidate not found in your organization." };

  revalidatePath(`/admin/jobs/${data.job_opening_id}/candidates`);
  return null;
}
