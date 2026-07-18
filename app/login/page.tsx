"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { login } from "@/lib/auth-actions";

export default function LoginPage() {
  // useSearchParams requires a Suspense boundary for prerendering.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const next = useSearchParams().get("next") ?? "";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm duration-500 animate-in fade-in slide-in-from-bottom-4 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <Link href="/" className="flex w-fit items-center gap-2 rounded-xl transition-opacity hover:opacity-80">
            <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" priority />
            <span className="text-lg font-bold tracking-tight">Krrrja</span>
          </Link>
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
              Screen more CVs in less time.
            </h2>
            <p className="mt-3 text-primary-foreground/80">Let AI rank, you decide.</p>
          </div>
          <p className="text-sm text-primary-foreground/60">© 2026 Krrrja</p>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Log in to your Krrrja account.</p>
          </div>
          <form action={formAction} className="space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@company.com" className="h-11 rounded-xl" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" name="password" className="h-11 rounded-xl" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending} className="h-11 w-full rounded-full text-base">
              {pending ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
