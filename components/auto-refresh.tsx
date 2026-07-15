"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-fetches server-component data on an interval while `active` — used by the
// candidates page to surface scores as the async pipeline finishes. Renders
// nothing; unmounts cleanly stop the timer.
export function AutoRefresh({ active, intervalMs = 4000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
