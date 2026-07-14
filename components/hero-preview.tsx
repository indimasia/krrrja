"use client";

import { useEffect, useMemo, useState } from "react";

type Candidate = { name: string; role: string; score: number };

// Fixed pool. A 3-row window rotates through it — state is only an offset,
// so the rendered list can NEVER grow beyond INITIAL_COUNT.
const POOL: Candidate[] = [
  { name: "Jane Doe", role: "Senior Backend Engineer", score: 92 },
  { name: "John Smith", role: "Backend Engineer", score: 74 },
  { name: "Alex Lee", role: "Platform Engineer", score: 61 },
  { name: "Priya Patel", role: "Staff Engineer", score: 88 },
  { name: "Marco Rossi", role: "Backend Engineer", score: 69 },
];

const INITIAL_COUNT = 3;

function scoreTint(score: number) {
  if (score >= 85) return "bg-secondary text-secondary-foreground";
  if (score >= 60) return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

// Count 0 → target over ~900ms with easing, respects reduced-motion.
function useCountUp(target: number, key: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // re-run count-up whenever the row is re-keyed (new cycle)
  }, [target, key]);
  return value;
}

function ScoreBadge({ score, cycle }: { score: number; cycle: number }) {
  const value = useCountUp(score, cycle);
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${scoreTint(score)}`}>
      {value}
    </span>
  );
}

export function HeroPreview() {
  const [offset, setOffset] = useState(0);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let scoreTimer: ReturnType<typeof setTimeout>;
    const loop = setInterval(() => {
      setScoring(true);
      scoreTimer = setTimeout(() => {
        setOffset((o) => (o + 1) % POOL.length);
        setScoring(false);
      }, 1100);
    }, 3800);

    return () => {
      clearInterval(loop);
      clearTimeout(scoreTimer);
    };
  }, []);

  // Window of 3 consecutive pool entries, ranked score desc. Always length 3.
  const rows = useMemo(() => {
    const w: Candidate[] = [];
    for (let i = 0; i < INITIAL_COUNT; i++) {
      w.push(POOL[(offset + i) % POOL.length]);
    }
    return [...w].sort((a, b) => b.score - a.score);
  }, [offset]);

  return (
    <div className="relative">
      <div className="hero-float rounded-[2rem] bg-secondary p-6 sm:p-8">
        <div className="rounded-3xl bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold tracking-tight">Senior Backend Engineer</p>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              8 candidates
            </span>
          </div>

          <ul className="space-y-3">
            {rows.map((c, i) => (
              <li
                key={`${c.name}-${offset}`}
                className="hero-row-in flex items-center gap-3 rounded-2xl border border-border p-3"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.role}</p>
                </div>
                <ScoreBadge score={c.score} cycle={offset} />
              </li>
            ))}
          </ul>

          {/* Live "AI scoring" indicator */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <span
              className={`hero-pulse-dot inline-block size-2 rounded-full ${scoring ? "bg-primary" : "bg-muted-foreground/40"}`}
            />
            <span>{scoring ? "AI scoring new candidate…" : "Ranked by match score"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
