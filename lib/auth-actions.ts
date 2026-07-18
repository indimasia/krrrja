"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/data/platform";

export type AuthState = { error: string } | null;

// Signup stashes the intended org name in user_metadata (pending_org_name).
// When email confirmation is enabled, signUp has no session, so create_org
// can't run at signup time — this backfill runs it on the user's first
// authenticated entry instead. No-op for everyone else.
export async function ensureOrgFromSignup(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pendingOrgName = user?.user_metadata?.pending_org_name as string | undefined;
  if (!user || !pendingOrgName) return;

  // Already in an org (e.g. accepted an invite while unconfirmed)? Just clear
  // the marker — never create a second org (single-org model).
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    const { error } = await supabase.rpc("create_org", { p_name: pendingOrgName });
    if (error) {
      // Leave the marker so the next login retries; surfacing here would block login.
      console.error("[auth] deferred create_org failed:", error.message);
      return;
    }
  }

  await supabase.auth.updateUser({ data: { pending_org_name: null } });
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  // Super admins have no org — route them to the platform console. Must run
  // before the deferred-org backfill so a stale marker can never create a
  // tenant org for a platform admin.
  if (await isPlatformAdmin()) {
    revalidatePath("/", "layout");
    redirect("/pro/dashboard");
  }

  await ensureOrgFromSignup();

  // Explicit post-login destination (e.g. an invite consent page).
  // Same-site paths only — never redirect to an external URL.
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//")) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function signUpCreateOrg(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const orgName = String(formData.get("org-name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm-password") ?? "");

  if (!name) return { error: "Name is required." };
  if (!orgName) return { error: "Organization name is required." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const supabase = await createClient();
  // pending_org_name survives the email-confirmation detour: if there's no
  // session now, ensureOrgFromSignup() creates the org on first login/callback.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { pending_org_name: orgName, display_name: name } },
  });
  if (error) return { error: error.message };

  // Email confirmation enabled → no session yet; org creation is deferred.
  if (!data.session) {
    redirect("/login?checkEmail=1");
  }

  // create_org RPC atomically inserts the org + makes this user its admin.
  const { error: rpcError } = await supabase.rpc("create_org", { p_name: orgName });
  if (rpcError) return { error: rpcError.message };

  await supabase.auth.updateUser({ data: { pending_org_name: null } });

  // create_org makes this user an admin, so always land in the admin section.
  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function joinOrg(_prev: AuthState): Promise<AuthState> {
  // Joining happens via emailed invite links (/invite/[token]) — there is no
  // manual invite-code entry.
  return { error: "Ask your org admin to invite you by email — the invite link will let you join." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
