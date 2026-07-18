import Link from "next/link";
import type { Metadata } from "next";
import { Ban, Scale, Search, ShieldCheck, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCounter } from "@/components/stat-counter";
import { Reveal } from "@/components/marketing/reveal";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "About — Krrrja",
  description:
    "Why we built Krrrja: screen more CVs in less time. Let AI rank, you decide.",
};

const STATS = [
  { value: "10x", label: "Faster first-pass screening" },
  { value: "0–100", label: "Score per CV vs your criteria" },
  { value: "<5s", label: "Median AI scoring per CV" },
  { value: "100%", label: "Final call stays human" },
];

const VALUES = [
  {
    icon: Scale,
    title: "Human decides",
    body: "AI ranks and triages. It never rejects a candidate for you. The hire call is yours.",
  },
  {
    icon: Search,
    title: "No hidden inference",
    body: "We score only what's in the CV against your stated criteria. No guessing facts that aren't there.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by default",
    body: "CV files are private per org, tenant-isolated at the database, never public by default.",
  },
  {
    icon: Target,
    title: "Criteria first",
    body: "Your free-text criteria is the primary constraint. Not a generic resume beauty contest.",
  },
  {
    icon: Ban,
    title: "Neutral language",
    body: "Summaries and red flags avoid sensitive inference. Fair, plain, defensible.",
  },
  {
    icon: Zap,
    title: "Built for SMB",
    body: "No enterprise bloat. A hiring team of three ships a shortlist before lunch.",
  },
];

const TIMELINE = [
  {
    year: "The problem",
    title: "200 CVs, one afternoon",
    body: "SMB hiring teams drown in resumes. No ATS budget, no recruiter army — just a founder and a spreadsheet at midnight.",
  },
  {
    year: "The bet",
    title: "Rank, don't replace",
    body: "After 7 AI SaaS pitches that missed, one lesson stuck: teams don't want AI to decide. They want it to triage.",
  },
  {
    year: "The build",
    title: "Score, summary, red flags",
    body: "One strict JSON contract per CV — a 0–100 score, 3 bullets, and honest red flags. Nothing fancier. Nothing sneakier.",
  },
  {
    year: "Today",
    title: "Screen more, in less time",
    body: "Upload a batch, set criteria, get a ranked shortlist in minutes. You read the top of the pile, not the whole pile.",
  },
];

// One hue, three shade steps — these sit side by side, so a per-item hue swap
// would put three chromas in a single row.
const TEAM = [
  { initials: "BM", name: "Bill M.", role: "Design partner", tint: "bg-primary-surface" },
  { initials: "AI", name: "gpt-4o", role: "Scoring engine", tint: "bg-primary" },
  { initials: "HR", name: "Your team", role: "The decision", tint: "bg-primary-emphasis" },
];

const PRINCIPLES = [
  "AI ranks, humans decide.",
  "Score against criteria, not vibes.",
  "Private by default, always.",
  "Say what's in the CV — nothing more.",
];

export default function AboutPage() {
  return (
    <div className="flex-1 bg-background">
      <SiteNav />

      {/* Hero — full-bleed blue band, offset circle + ring design */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-primary sm:rounded-b-[3rem]">
        <div aria-hidden className="absolute -right-32 top-1/2 size-[24rem] -translate-y-1/2 rounded-full bg-primary-surface" />
        <div aria-hidden className="absolute -left-20 -bottom-24 size-64 rounded-full border-[1.5rem] border-primary-fill" />
        <div aria-hidden className="absolute left-1/3 top-8 size-10 rounded-full bg-primary-emphasis" />
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-16 lg:pt-20 lg:pb-20">
          <Reveal>
            <div className="flex flex-col items-center gap-6 text-center">
              <span className="w-fit rounded-full bg-primary-surface px-4 py-1.5 text-sm font-semibold text-primary-ink transition-colors duration-200">
                About Krrrja
              </span>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                We give hiring teams their
                <span className="text-primary-ink"> afternoons back.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-foreground/70">
                Krrrja is an AI-assisted CV screening tool for small hiring teams. We rank and
                summarize the pile so a human reads the top of it — not all of it.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="onPrimary" className="h-12 rounded-full px-7 text-base" render={<Link href="/signup">Start screening free</Link>} />
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base" render={<Link href="/how-it-works">See how it works</Link>} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats band — numbers count up from 0 on load */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <StatCounter stats={STATS} />
      </section>

      {/* Mission split */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Our mission</span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Screen more CVs in less time. Let AI rank, you decide.
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Hiring is a human judgement. But the first pass — reading 200 resumes to find the 20
              worth a call — is a grind that burns out the very people who should be interviewing.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              So we automate the grind, not the judgement. Krrrja scores every CV against
              <em> your </em> criteria, hands you a ranked shortlist with a 3-point summary and red
              flags, and then gets out of the way.
            </p>
          </div>
          <div className="glass glass-flash flex flex-col gap-4 rounded-[2rem] p-8">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">What we believe</span>
            <ul className="flex flex-col gap-4">
              {PRINCIPLES.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">✓</span>
                  <span className="text-base font-medium">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Values grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">The rules we build by</h2>
          <p className="max-w-lg text-muted-foreground">Six principles baked into every score Krrrja returns.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="glass glass-flash flex flex-col gap-3 rounded-3xl p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-surface text-primary-ink transition-colors duration-200">
                <v.icon className="size-5" strokeWidth={2} />
              </span>
              <h3 className="text-lg font-bold tracking-tight">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline / story */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-3">
          <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Our story</span>
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            From midnight spreadsheet to ranked shortlist
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIMELINE.map((t, i) => (
            <div key={t.title} className="glass glass-flash flex flex-col gap-3 rounded-3xl p-7">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.year}</span>
              <h3 className="text-lg font-bold leading-tight tracking-tight">{t.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Who does the work</h2>
          <p className="max-w-lg text-muted-foreground">Three parties, one shortlist. Each has exactly one job.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {TEAM.map((m) => (
            <div key={m.name} className="glass glass-flash flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
              <span className={`flex size-16 items-center justify-center rounded-full ${m.tint} text-lg font-bold text-primary-foreground`}>{m.initials}</span>
              <h3 className="text-lg font-bold tracking-tight">{m.name}</h3>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{m.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <figure className="flex flex-col items-center gap-6 rounded-[2rem] bg-primary px-8 py-14 text-center">
          <span className="text-5xl leading-none text-primary-foreground/40">“</span>
          <blockquote className="max-w-2xl text-2xl font-bold leading-snug tracking-tight text-primary-foreground sm:text-3xl">
            We don&apos;t want AI to pick our people. We want it to hand us the ten resumes worth reading.
          </blockquote>
          <figcaption className="text-sm font-medium text-primary-foreground/70">
            — Every SMB hiring manager, basically
          </figcaption>
        </figure>
      </section>

      {/* CTA — full-bleed blue band above footer */}
      <section className="relative mt-8 overflow-hidden rounded-t-[2.5rem] bg-primary sm:rounded-t-[3rem]">
        <div aria-hidden className="absolute -left-24 -bottom-28 size-80 rounded-full bg-primary-fill" />
        <div aria-hidden className="absolute -right-16 -top-20 size-64 rounded-full bg-primary-emphasis" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <Reveal>
            <div className="flex flex-col items-center gap-6 text-center text-primary-foreground">
              <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to read the top of the pile?
              </h2>
              <p className="max-w-md text-primary-foreground/80">
                Start free — 3 job openings, 1 CV a month, no card required.
              </p>
              <Button size="lg" variant="onPrimary" className="h-12 rounded-full px-7 text-base" render={<Link href="/signup">Create your account</Link>} />
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
