"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/data/platform";

export type PlatformActionState = { error: string } | null;

// Suspend/unsuspend a tenant org. Service-role write — the orgs trigger
// (migration 20260715120000) blocks suspended_at changes from any other role.
export async function setOrgSuspended(orgId: string, suspend: boolean): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orgs")
    .update({ suspended_at: suspend ? new Date().toISOString() : null })
    .eq("id", orgId)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Organization not found." };

  revalidatePath("/pro/orgs");
  return null;
}

// Void wrapper for <form action>.
export async function toggleOrgSuspended(orgId: string, suspend: boolean): Promise<void> {
  await setOrgSuspended(orgId, suspend);
}

// ── Orgs CRUD (service role) ─────────────────────────────────────────────

type OrgTier = "free" | "pro";

export async function createOrg(_prev: PlatformActionState, fd: FormData): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };
  const name = String(fd.get("name") ?? "").trim();
  const tier: OrgTier = fd.get("tier") === "pro" ? "pro" : "free";
  if (!name) return { error: "Name is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("orgs").insert({ name, subscription_tier: tier });
  if (error) return { error: error.message };

  revalidatePath("/pro/orgs");
  return null;
}

export async function updateOrg(orgId: string, _prev: PlatformActionState, fd: FormData): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };
  const name = String(fd.get("name") ?? "").trim();
  const tier: OrgTier = fd.get("tier") === "pro" ? "pro" : "free";
  if (!name) return { error: "Name is required." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orgs")
    .update({ name, subscription_tier: tier })
    .eq("id", orgId)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Organization not found." };

  revalidatePath("/pro/orgs");
  return null;
}

// Hard-delete a tenant. FK cascade removes org_members, job_openings,
// candidates, processing_jobs. Irreversible — the UI confirms first.
export async function deleteOrg(orgId: string): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { error } = await admin.from("orgs").delete().eq("id", orgId);
  if (error) return { error: error.message };

  revalidatePath("/pro/orgs");
  return null;
}

// ── Jobs CRUD (cross-org, service role) ──────────────────────────────────

type JobStatus = "active" | "closed";

function parseJobInput(fd: FormData): { orgId: string; title: string; description: string; criteria: string; status: JobStatus } | { error: string } {
  const orgId = String(fd.get("orgId") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const criteria = String(fd.get("criteria") ?? "").trim();
  const status = fd.get("status") === "closed" ? "closed" : "active";
  if (!title) return { error: "Title is required." };
  return { orgId, title, description, criteria, status };
}

export async function createJob(_prev: PlatformActionState, fd: FormData): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };
  const input = parseJobInput(fd);
  if ("error" in input) return input;
  if (!input.orgId) return { error: "Select an organization." };

  const admin = createAdminClient();
  const { error } = await admin.from("job_openings").insert({
    org_id: input.orgId,
    title: input.title,
    description: input.description,
    criteria: input.criteria,
    status: input.status,
  });
  if (error) return { error: error.message };

  revalidatePath("/pro/jobs");
  return null;
}

export async function updateJob(jobId: string, _prev: PlatformActionState, fd: FormData): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };
  const input = parseJobInput(fd);
  if ("error" in input) return input;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_openings")
    .update({ title: input.title, description: input.description, criteria: input.criteria, status: input.status })
    .eq("id", jobId)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Job opening not found." };

  revalidatePath("/pro/jobs");
  return null;
}

export async function deleteJob(jobId: string): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };

  const admin = createAdminClient();
  // FK cascade removes candidates + processing_jobs for this job.
  const { error } = await admin.from("job_openings").delete().eq("id", jobId);
  if (error) return { error: error.message };

  revalidatePath("/pro/jobs");
  return null;
}

// ── User CRUD (cross-org, service role) ──────────────────────────────────

type MemberRole = "admin" | "member";

// Create an auth account (email + password, confirmed) and attach it to an org
// with a role. Single-org model: an existing user already in an org is rejected.
export async function createUser(_prev: PlatformActionState, fd: FormData): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const orgId = String(fd.get("orgId") ?? "").trim();
  const role: MemberRole = fd.get("role") === "admin" ? "admin" : "member";
  if (!email) return { error: "Email is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!orgId) return { error: "Select an organization." };

  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created?.user) return { error: createErr?.message ?? "Failed to create user." };

  const { error: memberErr } = await admin
    .from("org_members")
    .insert({ org_id: orgId, user_id: created.user.id, role });
  if (memberErr) {
    // Roll back the orphaned auth account so a retry can reuse the email.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: memberErr.message };
  }

  revalidatePath("/pro/users");
  return null;
}

export async function updateMemberRole(memberId: string, role: MemberRole): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("org_members")
    .update({ role })
    .eq("id", memberId)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Member not found." };

  revalidatePath("/pro/users");
  return null;
}

// Detach a user from their org (removes the org_members row, keeps the account).
export async function removeMember(memberId: string): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { error } = await admin.from("org_members").delete().eq("id", memberId);
  if (error) return { error: error.message };

  revalidatePath("/pro/users");
  return null;
}

// Hard-delete the auth account. FK cascade (org_members.user_id → auth.users)
// removes all their memberships. Refuses to delete a platform admin.
export async function deleteUser(userId: string): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { data: isPa } = await admin.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (isPa) return { error: "Cannot delete a platform admin account." };

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/pro/users");
  return null;
}
