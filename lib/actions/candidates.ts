"use server";

import { revalidatePath } from "next/cache";
import { PDFParse } from "pdf-parse";
import { createClient } from "@/lib/supabase/server";
import { FREE_TIER_LIMITS, getOrgContext, getOrgUsage } from "@/lib/data/org";

const MAX_FILES = 10;

export type UploadState = { error: string } | { success: true } | null;

export async function uploadCandidates(jobOpeningId: string, _prev: UploadState, formData: FormData): Promise<UploadState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };

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

    // Extract text inline (fast, ~100ms/file). Empty on failure — scoring worker
    // (§5) surfaces "no text" via its own validation; upload should not hard-fail.
    let extractedText = "";
    try {
      const parser = new PDFParse({ data: bytes });
      extractedText = (await parser.getText()).text ?? "";
      await parser.destroy();
    } catch {
      extractedText = "";
    }

    await supabase
      .from("candidates")
      .update({ file_url: path, extracted_text: extractedText })
      .eq("id", candidate.id);
    await supabase.from("processing_jobs").insert({ candidate_id: candidate.id, status: "pending" });
  }

  revalidatePath(`/admin/jobs/${jobOpeningId}`);
  return { success: true };
}
