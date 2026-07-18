import Link from "next/link";
import type { Metadata } from "next";
import { Bot, FileText, ListOrdered, Send, Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "How it works — Krrrja",
  description: "From CV pile to ranked shortlist in four steps: create a job opening, upload PDFs, AI scores each CV, you decide.",
};

const STEPS = [
  {
    icon: UserPlus,
    title: "Create a job opening",
    body: "Give it a title, a description, and your screening criteria in plain text — e.g. “min 3 years backend, has handled a system with 10k+ users”. The criteria is what every CV gets scored against.",
  },
  {
    icon: Upload,
    title: "Upload a CV batch",
    body: "Drop as many PDF resumes as you need at once. Originals are stored privately per organization; text is extracted automatically and queued for scoring — nothing blocks while it runs.",
  },
  {
    icon: Bot,
    title: "AI scores every CV",
    body: "Each CV is scored 0–100 against your job description and criteria, with a 3-point summary and any red flags. Only what's actually in the CV counts — no guessed facts, no sensitive inference.",
  },
  {
    icon: ListOrdered,
    title: "You review the ranked list",
    body: "Candidates land in a dashboard sorted by match score. Read the top of the pile, add notes, set status — New, Reviewed, Shortlisted, Rejected — and export the shortlist to CSV.",
  },
];

const PIPELINE = [
  { icon: Upload, label: "Upload PDFs" },
  { icon: FileText, label: "Extract text" },
  { icon: Bot, label: "AI scores vs criteria" },
  { icon: ListOrdered, label: "Ranked dashboard" },
  { icon: Send, label: "You decide" },
];

export default function HowItWorksPage() {
  return (
    <div className="flex-1 bg-background">
      <SiteNav />

      {/* Hero — full-bleed blue band, capsule design */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-primary sm:rounded-b-[3rem]">
        <div aria-hidden className="absolute -left-20 top-10 h-24 w-64 -rotate-12 rounded-full bg-primary-fill" />
        <div aria-hidden className="absolute -right-24 -bottom-16 h-28 w-80 rotate-12 rounded-full bg-primary-emphasis" />
        <div aria-hidden className="absolute left-1/4 -top-4 size-12 rounded-full bg-primary-surface" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 text-center sm:px-6 lg:pt-20 lg:pb-20">
          <Reveal>
            <span className="inline-block rounded-full bg-primary-surface px-4 py-1.5 text-sm font-semibold text-primary-ink transition-colors duration-200">
              How it works
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              From CV pile to shortlist in four steps
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-foreground/70">
              Krrrja automates the first-pass grind — reading, scoring, ranking — and leaves the
              hiring decision exactly where it belongs: with you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={(i % 2) * 100}>
              <div className="glass glass-flash flex h-full flex-col gap-4 rounded-3xl p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-surface text-primary-ink transition-colors duration-200">
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Step {i + 1}</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">{s.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pipeline band — blue, full-bleed with same-hue shapes */}
      <section className="relative overflow-hidden bg-primary py-14">
        <div aria-hidden className="absolute -right-24 -top-28 size-80 rounded-full bg-primary-fill" />
        <div aria-hidden className="absolute -left-16 -bottom-24 size-64 rounded-full bg-primary-emphasis" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight text-primary-foreground">
            What happens under the hood
          </h2>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-2">
            {PIPELINE.map((p, i) => (
              <div key={p.label} className="flex items-center gap-2">
                <div className="glass glass-flash flex flex-col items-center gap-2 rounded-2xl px-5 py-4">
                  <p.icon className="size-5 text-primary-ink" />
                  <span className="whitespace-nowrap text-xs font-semibold">{p.label}</span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <span className="hidden text-primary-foreground/50 sm:block">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-primary-foreground/80">
            Scoring runs asynchronously — upload a batch and keep working. Failed CVs retry
            automatically before they&apos;re marked failed, and every score follows one strict
            format: 0–100, three summary bullets, red flags.
          </p>
        </div>
      </section>

      {/* CTA — full-bleed blue band above footer */}
      <section className="relative mt-16 overflow-hidden rounded-t-[2.5rem] bg-primary sm:rounded-t-[3rem]">
        <div aria-hidden className="absolute -left-24 -top-24 size-72 rounded-full bg-primary-fill" />
        <div aria-hidden className="absolute -right-20 -bottom-28 size-80 rounded-full bg-primary-emphasis" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="max-w-xl text-3xl font-extrabold tracking-tight">Try it on your next opening</h2>
              <p className="max-w-md text-foreground/70">Free plan — 3 job openings, 1 CV a month. No card required.</p>
              <Button size="lg" variant="onPrimary" className="h-12 rounded-full px-7" render={<Link href="/signup">Start screening free</Link>} />
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
