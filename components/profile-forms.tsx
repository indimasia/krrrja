"use client";

import { useActionState, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePassword,
  updateAvatar,
  updateDisplayName,
  updateEmail,
  type ProfileState,
} from "@/lib/actions/profile";

function FormStatus({ state }: { state: ProfileState }) {
  if (!state) return null;
  if ("error" in state) return <p className="w-full text-sm text-destructive">{state.error}</p>;
  return <p className="w-full text-sm text-muted-foreground">{state.success}</p>;
}

export function AvatarForm({ avatarUrl, fallback }: { avatarUrl: string | null; fallback: string }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateAvatar, null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <Avatar className="size-16">
        {(preview ?? avatarUrl) && <AvatarImage src={preview ?? avatarUrl ?? undefined} alt="Profile photo" />}
        <AvatarFallback className="bg-muted text-lg text-foreground">{fallback}</AvatarFallback>
      </Avatar>
      <div className="min-w-64 flex-1 space-y-2">
        <Label htmlFor="avatar">Profile photo</Label>
        <Input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="h-11 rounded-xl pt-2.5"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          required
        />
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF, max 2MB.</p>
      </div>
      <Button type="submit" disabled={pending} className="h-11 rounded-full px-6">
        {pending ? "Uploading…" : "Upload"}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}

export function DisplayNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateDisplayName, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="min-w-64 flex-1 space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          name="name"
          defaultValue={currentName}
          placeholder="Your name"
          className="h-11 rounded-xl"
          maxLength={80}
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="h-11 rounded-full px-6">
        {pending ? "Saving…" : "Save"}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateEmail, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="min-w-64 flex-1 space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          name="email"
          type="email"
          defaultValue={currentEmail}
          className="h-11 rounded-xl"
          required
        />
        <p className="text-xs text-muted-foreground">
          Changing your email sends a confirmation link — the change applies after you confirm.
        </p>
      </div>
      <Button type="submit" disabled={pending} className="h-11 rounded-full px-6">
        {pending ? "Sending…" : "Update email"}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(changePassword, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="old-password">Current password</Label>
          <Input
            id="old-password"
            name="old-password"
            type="password"
            autoComplete="current-password"
            className="h-11 rounded-xl"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="h-11 rounded-xl"
            required
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11 rounded-full px-6">
          {pending ? "Changing…" : "Change password"}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  );
}
