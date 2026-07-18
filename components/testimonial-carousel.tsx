"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Testimonial = { quote: string; name: string; role: string; initials: string };

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "We went from a full day of resume reading to a ranked shortlist before lunch. Krrrja does the triage, we make the call.",
    name: "Tufayel Khan",
    role: "Head of Talent",
    initials: "TK",
  },
  {
    quote: "First 20 CVs scored before my coffee went cold. The red flags it surfaces are the ones I'd have missed on a fast skim.",
    name: "Sofia Almeida",
    role: "Recruiting Lead",
    initials: "SA",
  },
  {
    quote: "Consistent scoring across the whole team. No more one recruiter's 8 being another's 5 — everyone works off the same ranking.",
    name: "Daniel Osei",
    role: "Engineering Manager",
    initials: "DO",
  },
];

const SLIDE_MS = 2000;

function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function TestimonialCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(prefersReduced()), []);

  const go = useCallback((next: number) => {
    setIndex((i) => (next + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  // Auto-advance: a fresh timeout per index so manual nav resyncs the clock.
  // Paused on hover/focus and when reduced-motion is set.
  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduced, go]);

  const current = TESTIMONIALS[index];

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
      <div
        className="relative overflow-hidden rounded-[2rem] bg-primary-fill px-6 py-14 text-center transition-colors duration-200 sm:px-16"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {/* Livewire-style progress bar — restarts each slide (re-keyed by index). */}
        <div className="absolute inset-x-0 top-0 h-1 bg-foreground/10">
          {!reduced && (
            <div
              key={index}
              className="carousel-progress h-full bg-foreground/40"
              style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
            />
          )}
        </div>

        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">What teams say</p>

        {/* key re-fades the quote on each change */}
        <div key={index} className="hero-row-in">
          <p className="mx-auto max-w-2xl text-xl font-semibold leading-relaxed text-foreground sm:text-2xl">
            &ldquo;{current.quote}&rdquo;
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-card text-sm font-bold">
              {current.initials}
            </span>
            <div className="text-left">
              <p className="text-sm font-bold">{current.name}</p>
              <p className="text-xs text-foreground/60">{current.role}</p>
            </div>
          </div>
        </div>

        {/* Prev / next controls */}
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => go(index - 1)}
          className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-sm transition hover:bg-card sm:left-5"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => go(index + 1)}
          className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-sm transition hover:bg-card sm:right-5"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Position dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-foreground/70" : "w-2 bg-foreground/25 hover:bg-foreground/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
