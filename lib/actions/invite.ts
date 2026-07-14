"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteActionState = { error: string } | null;

// Accept while already authenticated. Invite-created accounts (welcome mode)
// pass a password to set before joining — they never chose one.
export async function acceptInvite(
  token: string,
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to accept this invite." };

  const password = String(formData.get("password") ?? "");
  if (password) {
    if (password.length < 8) return { error: "Password must be at least 8 characters." };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
  }

  // accept_invite validates token, expiry, and that the caller's email
  // matches the invited address, then inserts the membership.
  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

// New-user path when the invite email's sign-in link didn't carry a session
// (e.g. opened on another device). The emailed token itself proves control of
// the invited address, so we activate the account with the chosen password —
// but ONLY for accounts that have never signed in, so an invite link can
// never be used to reset an established user's password.
export async function activateAndAcceptInvite(
  token: string,
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm-password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("email, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
    return { error: "This invite is invalid or has expired." };
  }

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const target = (authList?.users ?? []).find(
    (u) => u.email?.toLowerCase() === invite.email.toLowerCase(),
  );
  if (!target) return { error: "No account found for this invite — ask your admin to re-send it." };
  if (target.last_sign_in_at) {
    return { error: "This account is already active — log in instead, then reopen the invite link." };
  }

  const { error: updateErr } = await admin.auth.admin.updateUserById(target.id, {
    password,
    email_confirm: true,
  });
  if (updateErr) return { error: updateErr.message };

  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password,
  });
  if (signInErr) return { error: signInErr.message };

  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}
