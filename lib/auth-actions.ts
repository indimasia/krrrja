"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/data/org";
import { isPlatformAdmin } from "@/lib/data/platform";

export type AuthState = { error: string } | null;

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  // Super admins have no org — route them to the platform console.
  if (await isPlatformAdmin()) {
    revalidatePath("/", "layout");
    redirect("/pro/dashboard");
  }

  // Explicit post-login destination (e.g. an invite consent page).
  // Same-site paths only — never redirect to an external URL.
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//")) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  const ctx = await getOrgContext();
  revalidatePath("/", "layout");
  redirect(ctx?.role === "candidate" ? "/candidate/dashboard" : "/admin/dashboard");
}

export async function signUpCreateOrg(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const orgName = String(formData.get("org-name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!orgName) return { error: "Organization name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // If email confirmation is enabled there's no session yet — user must confirm
  // before we can bootstrap their org (create_org needs auth.uid()).
  if (!data.session) {
    redirect("/login?checkEmail=1");
  }

  // create_org RPC atomically inserts the org + makes this user its admin.
  const { error: rpcError } = await supabase.rpc("create_org", { p_name: orgName });
  if (rpcError) return { error: rpcError.message };

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
