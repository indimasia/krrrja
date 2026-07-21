"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FileText, LineChart, ShieldCheck } from "lucide-react";
import { HeroPreview } from "@/components/hero-preview";

/**
 * Interactive hero visual: the live ranking preview card wrapped in a
 * pointer-tracking 3D tilt, with floating stat cards and decorative dots
 * that parallax at different depths. Respects prefers-reduced-motion.
 */
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    return () => cancelAnimationFrame(raf.current);
  }, []);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType === "touch") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    // Normalize pointer position to [-1, 1] from card center
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setTilt({ x, y }));
  }

  function onPointerLeave() {
    cancelAnimationFrame(raf.current);
    setTilt({ x: 0, y: 0 });
    setHovering(false);
  }

  const active = hovering && !reduceMotion;

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={onPointerLeave}
      className="relative mx-auto w-full max-w-md"
      style={{ perspective: "1000px" }}
    >
      {/* Decorative orbiting dots — slowest depth layer */}
      <span
        className="hero-orbit absolute -left-3 top-4 size-3 rounded-full bg-primary-ink"
        aria-hidden
        style={{ transform: `translate(${tilt.x * -6}px, ${tilt.y * -6}px)` }}
      />
      <span
        className="hero-orbit-reverse absolute -right-2 top-16 size-4 rounded-full bg-primary-emphasis"
        aria-hidden
        style={{ transform: `translate(${tilt.x * -10}px, ${tilt.y * -10}px)` }}
      />
      <span
        className="hero-orbit absolute -bottom-2 left-8 size-3 rounded-full bg-foreground"
        aria-hidden
        style={{ transform: `translate(${tilt.x * -8}px, ${tilt.y * -8}px)` }}
      />

      {/* Tilting core: live ranking preview */}
      <div
        className="transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: active
            ? `rotateY(${tilt.x * 7}deg) rotateX(${tilt.y * -7}deg) scale(1.02)`
            : "rotateY(0deg) rotateX(0deg) scale(1)",
          transformStyle: "preserve-3d",
        }}
      >
        <HeroPreview />
      </div>

      {/* Floating stat cards — each beside its matching row, dashed connector toward the card.
          Outer div owns positioning (plain `absolute`, so `.glass`'s position:relative can't
          override it); inner `.glass` div owns the styling + pointer-parallax. */}
      {/* 140+ → right of Jane Doe (top row). left-full anchors it just past the
          card's right edge so it can never overlap; connector = dot + dashes. */}
      <div className="absolute top-[27%] left-full -ml-4 -translate-y-1/2 sm:-ml-6">
        <div
          className="glass flex items-center gap-2 rounded-2xl px-4 py-3 transition-transform duration-200 ease-out"
          style={{ transform: `translate(${tilt.x * 18}px, ${tilt.y * 18}px)` }}
        >
          <span aria-hidden className="absolute right-full top-1/2 hidden -translate-y-1/2 items-center gap-1 pr-1.5 sm:flex">
            <span className="size-1.5 rounded-full bg-primary-ink/60" />
            <span className="w-6 border-t-2 border-dashed border-primary-ink/40" />
          </span>
          <FileText className="size-5 text-primary-ink" />
          <div>
            <p className="text-sm font-bold leading-none">140+</p>
            <p className="text-xs text-muted-foreground">Teams hiring</p>
          </div>
        </div>
      </div>
      {/* 20K+ → left of John Smith (middle row) */}
      <div className="absolute top-[48%] right-full -mr-4 -translate-y-1/2 sm:-mr-6">
        <div
          className="glass flex items-center gap-2 rounded-2xl px-4 py-3 transition-transform duration-200 ease-out"
          style={{ transform: `translate(${tilt.x * 14}px, ${tilt.y * 14}px)` }}
        >
          <span aria-hidden className="absolute left-full top-1/2 hidden -translate-y-1/2 items-center gap-1 pl-1.5 sm:flex">
            <span className="w-6 border-t-2 border-dashed border-primary-ink/40" />
            <span className="size-1.5 rounded-full bg-primary-ink/60" />
          </span>
          <LineChart className="size-5 text-primary-ink" />
          <div>
            <p className="text-sm font-bold leading-none">20K+</p>
            <p className="text-xs text-muted-foreground">CVs screened</p>
          </div>
        </div>
      </div>
      {/* 100% human-decided → right of Marco Rossi (bottom row) */}
      <div className="absolute top-[68%] left-full -ml-6 -translate-y-1/2 sm:-ml-6">
        <div
          className="glass flex items-center gap-2 rounded-full px-4 py-2 transition-transform duration-200 ease-out"
          style={{ transform: `translate(${tilt.x * 10}px, ${tilt.y * 10}px)` }}
        >
          <span aria-hidden className="absolute right-full top-1/2 hidden -translate-y-1/2 items-center gap-1 pr-1.5 sm:flex">
            <span className="size-1.5 rounded-full bg-primary-ink/60" />
            <span className="w-6 border-t-2 border-dashed border-primary-ink/40" />
          </span>
          <ShieldCheck className="size-4 text-primary-ink" />
          <span className="text-xs font-semibold">100% human-decided</span>
        </div>
      </div>
    </div>
  );
}
