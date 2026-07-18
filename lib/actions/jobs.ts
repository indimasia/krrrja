"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FREE_TIER_LIMITS, getOrgContext, getOrgUsage } from "@/lib/data/org";
import { canManageJobOpenings } from "@/lib/permissions";
import { isJobType, isWorkplaceType, isCurrency } from "@/lib/job-fields";

export type JobFormState = { error: string } | null;

type ParsedJobFields = {
  title: string;
  description: string;
  criteria: string;
  skills: string[];
  requirements: string;
  job_type: string;
  workplace_type: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
};

function parseJobFields(formData: FormData): { fields: ParsedJobFields } | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const criteria = String(formData.get("criteria") ?? "").trim();
  const requirements = String(formData.get("requirements") ?? "").trim();
  if (!title) return { error: "Job title is required." };

  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);

  const job_type = String(formData.get("job_type") ?? "");
  if (!isJobType(job_type)) return { error: "Pick a valid job type." };
  const workplace_type = String(formData.get("workplace_type") ?? "");
  if (!isWorkplaceType(workplace_type)) return { error: "Pick a valid workplace type." };
  const currency = String(formData.get("currency") ?? "USD");
  if (!isCurrency(currency)) return { error: "Pick a valid currency." };

  const parseSalary = (name: string): number | null | undefined => {
    const raw = String(formData.get(name) ?? "").trim();
    if (raw === "") return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) return undefined;
    return n;
  };
  const salary_min = parseSalary("salary_min");
  const salary_max = parseSalary("salary_max");
  if (salary_min === undefined || salary_max === undefined) {
    return { error: "Salary must be a whole non-negative number." };
  }
  if (salary_min != null && salary_max != null && salary_min > salary_max) {
    return { error: "Minimum salary cannot exceed maximum salary." };
  }

  return {
    fields: { title, description, criteria, skills, requirements, job_type, workplace_type, salary_min, salary_max, currency },
  };
}

const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

// Returns undefined when no file was submitted (leave existing attachment alone).
function parseAttachment(formData: FormData): { file: File } | { error: string } | undefined {
  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (file.size > ATTACHMENT_MAX_BYTES) return { error: "Attachment must be 5MB or smaller." };
  if (!ATTACHMENT_TYPES.includes(file.type)) return { error: "Attachment must be a PDF or Word document." };
  return { file };
}

// Upload to {org_id}/{job_id}/{filename}, remove any previous object, and
// stamp attachment_path/name on the row. Errors are reported but non-fatal to
// the save itself — callers surface the message and the job stays saved.
async function saveAttachment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  jobId: string,
  file: File,
  previousPath: string | null,
): Promise<string | null> {
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-100) || "attachment";
  const path = `${orgId}/${jobId}/${safeName}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from("job-attachments").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return `Job saved, but the attachment failed to upload: ${error.message}`;

  if (previousPath && previousPath !== path) {
    await supabase.storage.from("job-attachments").remove([previousPath]);
  }

  const { error: rowError } = await supabase
    .from("job_openings")
    .update({ attachment_path: path, attachment_name: file.name })
    .eq("id", jobId)
    .eq("org_id", orgId);
  if (rowError) return `Job saved, but the attachment could not be linked: ${rowError.message}`;

  return null;
}

export async function createJobOpening(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canManageJobOpenings(ctx.role)) return { error: "Only org admins can create job openings." };

  const parsed = parseJobFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  const attachment = parseAttachment(formData);
  if (attachment && "error" in attachment) return { error: attachment.error };

  if (ctx.subscriptionTier === "free") {
    const usage = await getOrgUsage(ctx.orgId);
    if (usage.activeJobOpenings >= FREE_TIER_LIMITS.maxActiveJobOpenings) {
      return { error: `Free plan limit reached (${FREE_TIER_LIMITS.maxActiveJobOpenings} active job openings). Upgrade to Pro for unlimited.` };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_openings")
    .insert({ org_id: ctx.orgId, ...parsed.fields })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (attachment) {
    const attachError = await saveAttachment(supabase, ctx.orgId, data.id, attachment.file, null);
    if (attachError) return { error: attachError };
  }

  revalidatePath("/admin/jobs");
  redirect(`/admin/jobs/${data.id}`);
}

export async function updateJobOpening(jobId: string, _prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canManageJobOpenings(ctx.role)) return { error: "Only org admins can edit job openings." };

  const parsed = parseJobFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  const attachment = parseAttachment(formData);
  if (attachment && "error" in attachment) return { error: attachment.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_openings")
    .update(parsed.fields)
    .eq("id", jobId)
    .eq("org_id", ctx.orgId)
    .select("id, attachment_path")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Job opening not found in your organization." };

  if (attachment) {
    const attachError = await saveAttachment(supabase, ctx.orgId, jobId, attachment.file, data.attachment_path);
    if (attachError) return { error: attachError };
  }

  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  redirect(`/admin/jobs/${jobId}`);
}

export async function setJobStatus(jobId: string, status: "active" | "closed"): Promise<JobFormState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not signed in." };
  if (ctx.suspended) return { error: "Your organization is suspended." };
  if (!canManageJobOpenings(ctx.role)) return { error: "Only org admins can change job status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_openings")
    .update({ status })
    .eq("id", jobId)
    .eq("org_id", ctx.orgId);

  if (error) return { error: error.message };

  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  return null;
}

// Void wrapper for use as a <form action> (form actions must return void).
export async function toggleJobStatus(jobId: string, status: "active" | "closed"): Promise<void> {
  await setJobStatus(jobId, status);
}
