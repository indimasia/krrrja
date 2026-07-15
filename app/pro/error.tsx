"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ProError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[pro] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-extrabold tracking-tight">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while loading this page. Try again, and check the server logs if it keeps
        happening.
      </p>
      {error.digest && <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <Button onClick={reset} className="rounded-full px-5">
        Try again
      </Button>
    </div>
  );
}
