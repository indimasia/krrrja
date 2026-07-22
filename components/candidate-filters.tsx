"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandInput } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Search + date-range controls for the candidates table. All state lives in
// the URL (?q, ?from, ?to) so the server component re-filters on navigation
// and the Export CSV link can carry the same params.
//
// Search is the shadcn CommandInput alone (no list/autocomplete), debounced
// 500ms. Dates are a single shadcn range Calendar in a popover with
// month/year dropdowns, years limited to 2000 → today.

const YEAR_MIN = new Date(2000, 0, 1);

// yyyy-mm-dd in LOCAL time — toISOString would shift the day across timezones.
function toParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromParam(s: string | null): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function CandidateFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const range: DateRange | undefined = (() => {
    const from = fromParam(searchParams.get("from"));
    const to = fromParam(searchParams.get("to"));
    return from || to ? { from: from ?? to, to } : undefined;
  })();

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
    const t = setTimeout(() => updateParams({ q: q.trim() || null }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const rangeLabel = range?.from
    ? range.to
      ? `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`
      : format(range.from, "MMM d, yyyy")
    : "Filter by date";

  const hasFilters = Boolean(q || range);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Command shouldFilter={false} className="w-64 rounded-full border border-border bg-card p-0">
        <CommandInput
          value={q}
          onValueChange={setQ}
          placeholder="Search name or score…"
          aria-label="Search candidates by name or score"
        />
      </Command>

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" className="rounded-full font-normal">
              <CalendarIcon className="size-4 text-muted-foreground" />
              {rangeLabel}
            </Button>
          }
        />
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={range}
            onSelect={(r) =>
              updateParams({
                from: r?.from ? toParam(r.from) : null,
                to: r?.to ? toParam(r.to) : null,
              })
            }
            captionLayout="dropdown"
            startMonth={YEAR_MIN}
            endMonth={new Date()}
            disabled={{ before: YEAR_MIN, after: new Date() }}
            defaultMonth={range?.from ?? new Date()}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>

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
