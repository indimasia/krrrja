"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

// Animated "Batch upload" mock for the Why-teams split. Files march through the
// real pipeline states — queued → processing → scored — with the score counting
// up as each lands, echoing the hero preview. Runs while it's in view.

type Row = { file: string; score: number };
const ROWS: Row[] = [
  { file: "backend_dev_cv.pdf", score: 92 },
  { file: "j_smith_resume.pdf", score: 74 },
  { file: "cv_alex_lee.pdf", score: 85 },
];

function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BatchUploadCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // active = index currently "processing"; rows before it are scored, after it queued.
  // Runs 0..ROWS.length, then pauses and restarts.
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries[0]?.isIntersecting ?? false), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (prefersReduced()) {
      setActive(ROWS.length); // show everything scored, no motion
      return;
    }
    const loop = setInterval(() => {
      setActive((a) => (a > ROWS.length ? 0 : a + 1));
    }, 1300);
    return () => clearInterval(loop);
  }, [inView]);

  const extracting = active === 0;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-sm">
      <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-primary/50" aria-hidden />
      <div className="relative flex aspect-[4/5] w-full flex-col gap-4 rounded-[2rem] bg-card p-7 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Batch upload</p>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-border">
          {!prefersReduced() && <span className="hero-scan pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/15 to-transparent" aria-hidden />}
          <FileText className="size-8 text-muted-foreground" />
          <p className="text-sm font-semibold">10 PDFs dropped</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`hero-pulse-dot inline-block size-1.5 rounded-full ${extracting ? "bg-primary" : "bg-secondary"}`} />
            {extracting ? "Extracting text…" : "Scoring against criteria…"}
          </p>
        </div>
        <ul className="space-y-2 text-xs">
          {ROWS.map((row, i) => {
            const scored = i < active;
            const processing = i === active;
            return (
              <li key={row.file} className="flex items-center justify-between rounded-xl bg-muted px-4 py-2.5">
                <span className="truncate font-medium">{row.file}</span>
                <span className="ml-2 shrink-0 text-muted-foreground tabular-nums">
                  {scored ? <ScoredLabel score={row.score} /> : processing ? "Processing…" : "Queued"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ScoredLabel({ score }: { score: number }) {
  const value = useCountUp(score);
  return <span className="text-secondary-foreground">Scored — {value}</span>;
}

// Count 0 → target over ~700ms, once, on mount. Respects reduced-motion.
function useCountUp(target: number) {
  const [value, setValue] = useState(prefersReduced() ? target : 0);
  useEffect(() => {
    if (prefersReduced()) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}
