"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Search + date-range controls for the candidates table. All state lives in
// the URL (?q, ?from, ?to) so the server component re-filters on navigation
// and the Export CSV link can carry the same params. Search is debounced so
// typing doesn't fire a server round-trip per keystroke.

export function CandidateFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Debounced sync of the search box into the URL.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => updateParams({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = Boolean(q || from || to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or score…"
          className="w-56 pl-9"
          aria-label="Search candidates by name or score"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => updateParams({ from: e.target.value || null })}
          className="w-36"
          aria-label="Added from date"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => updateParams({ to: e.target.value || null })}
          className="w-36"
          aria-label="Added to date"
        />
      </div>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            updateParams({ q: null, from: null, to: null });
          }}
        >
          <X className="size-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
