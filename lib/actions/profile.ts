"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error: string } | { success: string } | null;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

const AVATAR_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function updateDisplayName(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  if (name.length > 80) return { error: "Name must be 80 characters or less." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: "Name updated." };
}

export async function updateEmail(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (email === user.email) return { error: "That is already your email." };

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };

  // Supabase sends confirmation link(s); the address only changes after the
  // user clicks them (both old and new inbox when secure email change is on).
  return { success: "Confirmation email sent — your email changes once you confirm it." };
}

export async function changePassword(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const oldPassword = String(formData.get("old-password") ?? "");
  const newPassword = String(formData.get("new-password") ?? "");

  if (!oldPassword || !newPassword) return { error: "Both current and new password are required." };
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };
  if (newPassword === oldPassword) return { error: "New password must be different from the current one." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not signed in." };

  // Supabase has no dedicated "verify current password" API — re-authenticate
  // with the current credentials to prove possession before updating.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: "Password changed." };
}

export async function updateAvatar(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };

  const ext = AVATAR_EXT[file.type];
  if (!ext) return { error: "Use a JPEG, PNG, WebP or GIF image." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Image must be 2MB or less." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Clear previous avatar files (extension may differ from the new upload).
  const { data: existing } = await supabase.storage.from("avatars").list(user.id);
  if (existing && existing.length > 0) {
    await supabase.storage.from("avatars").remove(existing.map((f) => `${user.id}/${f.name}`));
  }

  const path = `${user.id}/avatar.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return { error: uploadError.message };

  // Cache-buster: the path is stable across re-uploads, so browsers would
  // otherwise keep showing the old image.
  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: "Profile photo updated." };
}
