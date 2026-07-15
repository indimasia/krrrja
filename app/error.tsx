"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Root error boundary — catches errors on marketing/auth/invite pages that
// don't have a closer segment boundary.
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-extrabold tracking-tight">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Try again, and contact support if it keeps happening.
      </p>
      {error.digest && <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <Button onClick={reset} className="rounded-full px-5">
        Try again
      </Button>
    </div>
  );
}
