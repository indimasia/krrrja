"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext, listOrgMembers } from "@/lib/data/org";
import { canManageOrgSettings, canManageTeam } from "@/lib/permissions";

export type OrgActionState = { error?: string; success?: string; duplicate?: boolean } | null;

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function updateOrgName(_prev: OrgActionState, formData: FormData): Promise<OrgActionState> {
  const ctx = await getOrgContext();
  if (!ctx || !canManageOrgSettings(ctx.role)) return { error: "Only org admins can rename the organization." };
  if (ctx.suspended) return { error: "Your organization is suspended." };

  const name = String(formData.get("org-name") ?? "").trim();
  if (!name) return { error: "Organization name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("orgs").update({ name }).eq("id", ctx.orgId);
  if (error) return { error: error.message };

  revalidatePath("/admin", "layout");
  return { success: "Organization name updated." };
}

export async function inviteMember(_prev: OrgActionState, formData: FormData): Promise<OrgActionState> {
  const ctx = await getOrgContext();
  if (!ctx || !canManageTeam(ctx.role)) return { error: "Only org admins can invite members." };
  if (ctx.suspended) return { error: "Your organization is suspended." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member");
  if (!email || !email.includes("@")) return { error: "A valid email is required." };
  if (role !== "admin" && role !== "member") return { error: "Invalid role." };

  const supabase = await createClient();

  // Already a member? Re-inviting is a no-op — surface as duplicate.
  const members = await listOrgMembers(ctx.orgId);
  if (members.some((m) => m.email.toLowerCase() === email)) {
    return { error: `${email} is already a member of this organization.`, duplicate: true };
  }

  // Pending invite already outstanding for this email? Block the duplicate.
  const { data: existing } = await supabase
    .from("invites")
    .select("id")
    .eq("org_id", ctx.orgId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { error: `${email} already has a pending invite.`, duplicate: true };
  }

  // Invite row is the source of truth; RLS insert policy re-checks admin.
  const { data: invite, error } = await supabase
    .from("invites")
    .insert({ org_id: ctx.orgId, email, role, invited_by: ctx.userId })
    .select("token")
    .single();
  if (error) return { error: error.message };

  const origin = await siteOrigin();
  const consentPath = `/invite/${invite.token}`;
  const admin = createAdminClient();

  // New account: Supabase Auth sends its invite email; the CTA link signs the
  // invitee in (when the exchange succeeds) and lands on the consent page in
  // "welcome" mode, where they set a password and auto-join the org.
  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`${consentPath}?welcome=1`)}`,
  });

  if (inviteErr) {
    const alreadyRegistered =
      inviteErr.status === 422 || /already/i.test(inviteErr.message ?? "");
    if (!alreadyRegistered) {
      return { error: `Invite saved, but the email could not be sent: ${inviteErr.message}` };
    }
    // Existing account: send a magic link that lands on the consent page.
    // If the link's code exchange fails on their device, the consent page
    // falls back to a normal login that returns them there.
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(consentPath)}`,
        shouldCreateUser: false,
      },
    });
    if (otpErr) {
      return { error: `Invite saved, but the email could not be sent: ${otpErr.message}` };
    }
  }

  revalidatePath("/admin/settings");
  return { success: `Invite sent to ${email}.` };
}

export async function revokeInvite(inviteId: string) {
  const ctx = await getOrgContext();
  if (!ctx || !canManageTeam(ctx.role) || ctx.suspended) return;

  const supabase = await createClient();
  // RLS restricts the update to this admin's own org.
  await supabase.from("invites").update({ status: "revoked" }).eq("id", inviteId);
  revalidatePath("/admin/settings");
}
