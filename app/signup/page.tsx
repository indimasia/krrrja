"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordInput } from "@/components/password-input";
import { joinOrg, signUpCreateOrg } from "@/lib/auth-actions";

export default function SignupPage() {
  const [createState, createAction, createPending] = useActionState(signUpCreateOrg, null);
  const [joinState, joinAction, joinPending] = useActionState(joinOrg, null);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm duration-500 animate-in fade-in slide-in-from-bottom-4 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div className="flex items-center gap-2">
            <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" priority />
            <span className="text-lg font-bold tracking-tight">Krrrja</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
              Start screening with AI in minutes.
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              3 job openings and 20 CVs a month, free. No card required.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">© 2026 Krrrja</p>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Screen CVs with AI-assisted ranking.</p>
          </div>

          <Tabs defaultValue="create">
            <TabsList className="w-full">
              <TabsTrigger value="create" className="flex-1">Create org</TabsTrigger>
              <TabsTrigger value="join" className="flex-1">Join org</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-4 space-y-4">
              <form action={createAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input id="org-name" name="org-name" placeholder="Acme Hiring Co" className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@company.com" className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" name="password" className="h-11 rounded-xl" required />
                </div>
                {createState?.error && <p className="text-sm text-destructive">{createState.error}</p>}
                <Button type="submit" disabled={createPending} className="h-11 w-full rounded-full text-base">
                  {createPending ? "Creating…" : "Create organization"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="mt-4 space-y-4">
              <form action={joinAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite code</Label>
                  <Input id="invite-code" name="invite-code" placeholder="Paste invite code" className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join-email">Email</Label>
                  <Input id="join-email" name="email" type="email" placeholder="you@company.com" className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join-password">Password</Label>
                  <PasswordInput id="join-password" name="password" className="h-11 rounded-xl" required />
                </div>
                {joinState?.error && <p className="text-sm text-destructive">{joinState.error}</p>}
                <Button type="submit" disabled={joinPending} className="h-11 w-full rounded-full text-base">
                  {joinPending ? "Joining…" : "Join organization"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
