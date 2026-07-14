"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FREE_TIER_LIMITS, getOrgContext, getOrgUsage } from "@/lib/data/org";

export type JobFormState = { error: string } | null;

export async function createJobOpening(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.role !== "admin") return { error: "Only org admins can create job openings." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const criteria = String(formData.get("criteria") ?? "").trim();
  if (!title) return { error: "Job title is required." };

  if (ctx.subscriptionTier === "free") {
    const usage = await getOrgUsage(ctx.orgId);
    if (usage.activeJobOpenings >= FREE_TIER_LIMITS.maxActiveJobOpenings) {
      return { error: `Free plan limit reached (${FREE_TIER_LIMITS.maxActiveJobOpenings} active job openings). Upgrade to Pro for unlimited.` };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_openings")
    .insert({ org_id: ctx.orgId, title, description, criteria })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard");
  redirect(`/admin/jobs/${data.id}`);
}

export async function setJobStatus(jobId: string, status: "active" | "closed"): Promise<JobFormState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.role !== "admin") return { error: "Only org admins can change job status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_openings")
    .update({ status })
    .eq("id", jobId)
    .eq("org_id", ctx.orgId);

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/jobs/${jobId}`);
  return null;
}

// Void wrapper for use as a <form action> (form actions must return void).
export async function toggleJobStatus(jobId: string, status: "active" | "closed"): Promise<void> {
  await setJobStatus(jobId, status);
}
