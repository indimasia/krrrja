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
      className="relative mx-auto w-full max-w-sm"
      style={{ perspective: "1000px" }}
    >
      {/* Decorative orbiting dots — slowest depth layer */}
      <span
        className="hero-orbit absolute -left-3 top-4 size-3 rounded-full bg-destructive"
        aria-hidden
        style={{ transform: `translate(${tilt.x * -6}px, ${tilt.y * -6}px)` }}
      />
      <span
        className="hero-orbit-reverse absolute -right-2 top-16 size-4 rounded-full bg-secondary"
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

      {/* Floating stat cards — nearest depth layer, drift opposite the pointer */}
      <div
        className="absolute left-1 top-6 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-md transition-transform duration-200 ease-out sm:-left-6 sm:top-8"
        style={{ transform: `translate(${tilt.x * 14}px, ${tilt.y * 14}px)` }}
      >
        <LineChart className="size-5 text-primary-foreground" />
        <div>
          <p className="text-sm font-bold leading-none">20K+</p>
          <p className="text-xs text-muted-foreground">CVs screened</p>
        </div>
      </div>
      <div
        className="absolute right-1 bottom-16 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-md transition-transform duration-200 ease-out sm:-right-5"
        style={{ transform: `translate(${tilt.x * 18}px, ${tilt.y * 18}px)` }}
      >
        <FileText className="size-5 text-primary-foreground" />
        <div>
          <p className="text-sm font-bold leading-none">140+</p>
          <p className="text-xs text-muted-foreground">Teams hiring</p>
        </div>
      </div>
      <div
        className="absolute bottom-1 right-8 flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-md transition-transform duration-200 ease-out sm:-bottom-4 sm:right-10"
        style={{ transform: `translate(${tilt.x * 10}px, ${tilt.y * 10}px)` }}
      >
        <ShieldCheck className="size-4 text-primary-foreground" />
        <span className="text-xs font-semibold">100% human-decided</span>
      </div>
    </div>
  );
}
