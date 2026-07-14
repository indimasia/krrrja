"use client";

import { useEffect, useState } from "react";

export type Stat = { value: string; label: string };

// Split "afternoons back" cases: "10x" → x10, "<5s" → <5 s, "0–100" → 0– 100, "100%" → 100 %.
// Animate the LAST integer in the string, keep prefix/suffix static.
function parse(value: string) {
  const m = value.match(/^(.*?)(\d+)(\D*)$/);
  if (!m) return { prefix: value, target: null as number | null, suffix: "" };
  return { prefix: m[1], target: parseInt(m[2], 10), suffix: m[3] };
}

function useCountUp(target: number | null) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target === null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

function StatValue({ value }: { value: string }) {
  const { prefix, target, suffix } = parse(value);
  const n = useCountUp(target);
  return (
    <span className="text-3xl font-extrabold tracking-tight text-brand-strong tabular-nums sm:text-4xl">
      {prefix}
      {target === null ? "" : n}
      {suffix}
    </span>
  );
}

export function StatCounter({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-[2rem] border border-border bg-card p-8 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-1 text-center">
          <StatValue value={s.value} />
          <span className="text-sm leading-snug text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
