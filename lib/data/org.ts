import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const FREE_TIER_LIMITS = {
  maxActiveJobOpenings: 3,
  maxCvPerMonth: 1,
};

export type OrgContext = {
  userId: string;
  orgId: string;
  role: "admin" | "member";
  isOwner: boolean;
  ownerId: string | null;
  orgName: string;
  subscriptionTier: "free" | "pro";
  subscriptionStatus: string | null;
  graceExpiresAt: string | null;
  suspended: boolean;
};

// Resolves the caller's org + role. RLS on org_members returns only their own row.
export async function getOrgContext(): Promise<OrgContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, orgs(name, subscription_tier, subscription_status, grace_expires_at, suspended_at, owner_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;
  const org = membership.orgs as unknown as {
    name: string;
    subscription_tier: string;
    subscription_status: string | null;
    grace_expires_at: string | null;
    suspended_at: string | null;
    owner_id: string | null;
  };

  // Pro is a monthly subscription. The tier column is the source of truth —
  // the webhook flips it to 'free' when the subscription is cancelled.
  const tier = (org.subscription_tier as "free" | "pro") ?? "free";

  return {
    userId: user.id,
    orgId: membership.org_id,
    role: membership.role as "admin" | "member",
    isOwner: org.owner_id === user.id,
    ownerId: org.owner_id,
    orgName: org.name,
    subscriptionTier: tier,
    subscriptionStatus: org.subscription_status ?? null,
    graceExpiresAt: org.grace_expires_at ?? null,
    suspended: org.suspended_at !== null,
  };
}

export type OrgMember = {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "admin" | "member";
  joinedAt: string;
};

// Roster with emails. org_members has no email column — resolve from
// auth.users via the service-role client, so callers MUST already be gated
// by getOrgContext (page/action checks membership before calling this).
export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const admin = createAdminClient();
  const [{ data: members }, { data: authList }] = await Promise.all([
    admin
      .from("org_members")
      .select("user_id, role, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const userById = new Map((authList?.users ?? []).map((u) => [u.id, u]));

  return (members ?? []).map((m) => {
    const u = userById.get(m.user_id);
    return {
      userId: m.user_id,
      email: u?.email ?? "—",
      name: (u?.user_metadata?.display_name as string | undefined) ?? null,
      avatarUrl: (u?.user_metadata?.avatar_url as string | undefined) ?? null,
      role: m.role as OrgMember["role"],
      joinedAt: m.created_at,
    };
  });
}

export type PendingInvite = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
};

// RLS on invites is admin-only, so this returns rows only for org admins.
export async function listPendingInvites(orgId: string): Promise<PendingInvite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invites")
    .select("id, email, role, created_at, expires_at")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    createdAt: i.created_at,
    expiresAt: i.expires_at,
  }));
}

export async function getOrgUsage(orgId: string) {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: activeJobOpenings }, { count: cvProcessedThisMonth }] = await Promise.all([
    supabase
      .from("job_openings")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active"),
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  return {
    activeJobOpenings: activeJobOpenings ?? 0,
    cvProcessedThisMonth: cvProcessedThisMonth ?? 0,
  };
}
