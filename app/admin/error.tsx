"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Error boundary for /admin/* — shows a generic message (never the raw error,
// which may contain internals) and offers a retry via reset().
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-extrabold tracking-tight">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while loading this page. Your data is safe — try again, and contact support if it
        keeps happening.
      </p>
      {error.digest && <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <Button onClick={reset} className="rounded-full px-5">
        Try again
      </Button>
    </div>
  );
}
