"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Search + date-range controls for the candidates table. Committed state lives
// in the URL (?q, ?from, ?to) so the server re-filters and the Export CSV link
// matches the table — but the widgets are driven by LOCAL state so they react
// instantly. Deriving the calendar selection from the URL made every click
// wait a full server round-trip, which both delayed the marks by seconds and
// made react-day-picker compute the next range against a stale selection
// (clicking 1 then 2 produced 2–2, etc.).
//
// Search: plain Input with a search icon, debounced 500ms.
// Dates: single range Calendar, month/year dropdowns, years 2000 → today.
// URL is only touched when a range is COMPLETE (both ends picked) or cleared,
// and always inside startTransition so typing/clicking never blocks.

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
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = fromParam(searchParams.get("from"));
    const to = fromParam(searchParams.get("to"));
    return from || to ? { from: from ?? to, to } : undefined;
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
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

  function onRangeSelect(selected: DateRange | undefined, day: Date) {
    // Third click on a completed range starts a fresh one from that day
    // instead of react-day-picker's default extend/shrink behavior.
    const next: DateRange | undefined =
      range?.from && range?.to ? { from: day, to: undefined } : selected;
    setRange(next);
    if (next?.from && next?.to) {
      updateParams({ from: toParam(next.from), to: toParam(next.to) });
      setCalendarOpen(false);
    }
  }

  const rangeLabel = range?.from
    ? range.to
      ? `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`
      : `${format(range.from, "MMM d, yyyy")} – …`
    : "Filter by date";

  const hasFilters = Boolean(q || range);

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

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
            onSelect={onRangeSelect}
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
            setRange(undefined);
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
