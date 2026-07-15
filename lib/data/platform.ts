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

export type PlatformOrg = {
  id: string;
  name: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  suspendedAt: string | null;
  memberCount: number;
  activeJobCount: number;
  cvThisMonth: number;
  createdAt: string;
};

// MVP tradeoff: three org_id-only selects aggregated in JS. Fine at demo scale;
// replace with a SQL group-by view when org count grows.
export async function listOrgs(): Promise<PlatformOrg[]> {
  const admin = createAdminClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: orgs }, { data: members }, { data: jobs }, { data: cvs }] = await Promise.all([
    admin
      .from("orgs")
      .select("id, name, subscription_tier, subscription_status, suspended_at, created_at")
      .order("created_at", { ascending: false }),
    admin.from("org_members").select("org_id"),
    admin.from("job_openings").select("org_id").eq("status", "active"),
    admin.from("candidates").select("org_id").gte("created_at", startOfMonth.toISOString()),
  ]);

  const countBy = (rows: { org_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.org_id, (m.get(r.org_id) ?? 0) + 1);
    return m;
  };
  const memberCounts = countBy(members);
  const jobCounts = countBy(jobs);
  const cvCounts = countBy(cvs);

  return (orgs ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    subscriptionTier: o.subscription_tier ?? "free",
    subscriptionStatus: o.subscription_status,
    suspendedAt: o.suspended_at,
    memberCount: memberCounts.get(o.id) ?? 0,
    activeJobCount: jobCounts.get(o.id) ?? 0,
    cvThisMonth: cvCounts.get(o.id) ?? 0,
    createdAt: o.created_at,
  }));
}

export type OrgOption = { id: string; name: string };

// Lightweight org list for CRUD pickers (create job / create user).
export async function listOrgOptions(): Promise<OrgOption[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("orgs").select("id, name").order("name", { ascending: true });
  return (data ?? []).map((o) => ({ id: o.id, name: o.name }));
}

export type PlatformJob = {
  id: string;
  title: string;
  description: string;
  criteria: string;
  status: string;
  createdAt: string;
  orgId: string;
  orgName: string;
};

export async function listAllJobOpenings(): Promise<PlatformJob[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("job_openings")
    .select("id, title, description, criteria, status, created_at, org_id, orgs(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description ?? "",
    criteria: j.criteria ?? "",
    status: j.status,
    createdAt: j.created_at,
    orgId: j.org_id,
    orgName: (j.orgs as unknown as { name: string } | null)?.name ?? "—",
  }));
}

export type PlatformUser = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
  orgName: string;
  createdAt: string;
};

export async function listAllMembers(): Promise<PlatformUser[]> {
  const admin = createAdminClient();
  const [{ data }, { data: authList }] = await Promise.all([
    admin
      .from("org_members")
      .select("id, user_id, role, created_at, org_id, orgs(name)")
      .order("created_at", { ascending: false })
      .limit(200),
    // org_members has no name/email — resolve display names from auth.users.
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const authById = new Map((authList?.users ?? []).map((u) => [u.id, u]));

  return (data ?? []).map((m) => {
    const u = authById.get(m.user_id);
    return {
      memberId: m.id,
      userId: m.user_id,
      name: (u?.user_metadata?.full_name as string | undefined) ?? u?.email ?? m.user_id.slice(0, 8) + "…",
      email: u?.email ?? "—",
      role: m.role,
      orgId: m.org_id,
      orgName: (m.orgs as unknown as { name: string } | null)?.name ?? "—",
      createdAt: m.created_at,
    };
  });
}
