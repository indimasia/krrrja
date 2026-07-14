import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// True when the caller is a platform super admin. Uses the user-scoped client:
// platform_admins RLS lets a user read only their own row, so this is safe.
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data;
}

// ── Cross-org reads (service role, RLS bypassed) — callers MUST already be
//    gated by isPlatformAdmin() / the /pro layout guard. ──────────────────

export async function getPlatformStats() {
  const admin = createAdminClient();
  const [orgs, users, jobs, candidates] = await Promise.all([
    admin.from("orgs").select("id", { count: "exact", head: true }),
    admin.from("org_members").select("id", { count: "exact", head: true }),
    admin.from("job_openings").select("id", { count: "exact", head: true }),
    admin.from("candidates").select("id", { count: "exact", head: true }),
  ]);

  return {
    orgs: orgs.count ?? 0,
    users: users.count ?? 0,
    jobs: jobs.count ?? 0,
    candidates: candidates.count ?? 0,
  };
}

export type PlatformJob = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  orgName: string;
};

export async function listAllJobOpenings(): Promise<PlatformJob[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("job_openings")
    .select("id, title, status, created_at, orgs(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((j) => ({
    id: j.id,
    title: j.title,
    status: j.status,
    createdAt: j.created_at,
    orgName: (j.orgs as unknown as { name: string } | null)?.name ?? "—",
  }));
}

export type PlatformUser = {
  userId: string;
  name: string;
  role: string;
  orgName: string;
  createdAt: string;
};

export async function listAllMembers(): Promise<PlatformUser[]> {
  const admin = createAdminClient();
  const [{ data }, { data: authList }] = await Promise.all([
    admin
      .from("org_members")
      .select("user_id, role, created_at, orgs(name)")
      .order("created_at", { ascending: false })
      .limit(200),
    // org_members has no name/email — resolve display names from auth.users.
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const nameById = new Map(
    (authList?.users ?? []).map((u) => [
      u.id,
      (u.user_metadata?.full_name as string | undefined) ?? u.email ?? u.id,
    ]),
  );

  return (data ?? []).map((m) => ({
    userId: m.user_id,
    name: nameById.get(m.user_id) ?? m.user_id.slice(0, 8) + "…",
    role: m.role,
    orgName: (m.orgs as unknown as { name: string } | null)?.name ?? "—",
    createdAt: m.created_at,
  }));
}
