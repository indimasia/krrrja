"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

// Animated "CV score" mock for the Trusted-triage split. Same vocabulary as the
// hero preview: a count-up score, criteria rows that stagger in, a red-flag
// reveal, and a floating trust pill. Replays each time it scrolls into view.

const CRITERIA = ["6 yrs backend, led team of 4", "Scaled service to 50k users", "Strong match on all criteria"];
const TARGET = 92;

function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CvScoreCard() {
  const ref = useRef<HTMLDivElement>(null);
  // cycle bumps on each in-view entry; re-keys the reveal so it replays.
  const [cycle, setCycle] = useState(0);
  const score = useCountUp(TARGET, cycle);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) {
      setCycle(1);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCycle((c) => c + 1);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const started = cycle > 0;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-sm">
      <div className="absolute inset-0 -translate-x-4 translate-y-4 rounded-[2rem] bg-primary-emphasis" aria-hidden />
      <div className="relative flex aspect-[4/5] w-full flex-col justify-between rounded-[2rem] bg-card p-7 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CV score</p>
          <p className="mt-2 text-6xl font-extrabold tracking-tight tabular-nums">
            {score}
            <span className="text-2xl text-muted-foreground">/100</span>
          </p>
        </div>
        <ul className="space-y-3 text-sm" key={cycle}>
          {CRITERIA.map((c, i) => (
            <li
              key={c}
              className={started ? "hero-row-in rounded-xl bg-muted px-4 py-3" : "rounded-xl bg-muted px-4 py-3 opacity-0"}
              style={{ animationDelay: `${200 + i * 120}ms` }}
            >
              {c}
            </li>
          ))}
        </ul>
        <div
          key={`flag-${cycle}`}
          className={
            started
              ? "hero-row-in rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive"
              : "rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive opacity-0"
          }
          style={{ animationDelay: "680ms" }}
        >
          Red flag: 8-month gap in 2024, unexplained
        </div>
      </div>
      <div className="hero-float absolute -bottom-5 left-4 flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-md">
        <ShieldCheck className="size-4 text-primary-ink" />
        <span className="text-xs font-semibold">100% human-decided</span>
      </div>
    </div>
  );
}

// Count 0 → target over ~900ms with cubic ease-out, respects reduced-motion.
// Re-runs whenever `key` changes (new in-view cycle).
function useCountUp(target: number, key: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (key === 0) return; // not started yet
    if (prefersReduced()) {
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
    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, key]);
  return value;
}
