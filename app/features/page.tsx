import Link from "next/link";
import type { Metadata } from "next";
import {
  Bot,
  Download,
  Gauge,
  ListOrdered,
  Lock,
  StickyNote,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Features — Krrrja",
  description: "Batch CV upload, AI scoring with summaries and red flags, ranked dashboards, team roles, CSV export — everything an SMB hiring team needs to screen faster.",
};

const FEATURES = [
  {
    icon: Upload,
    title: "Batch upload",
    body: "Drop up to 10 CV PDFs at once. Originals are stored privately, text is extracted automatically, and scoring runs in the background so you never wait on a spinner.",
  },
  {
    icon: Bot,
    title: "AI scoring",
    body: "Every CV gets a 0–100 score against your job description and free-text criteria, plus a 3-bullet summary and explicit red flags. Same rubric for every candidate.",
  },
  {
    icon: ListOrdered,
    title: "Ranked dashboard",
    body: "Candidates arrive sorted by match score. See the summary and red flags at a glance and spend your reading time on the top of the pile.",
  },
  {
    icon: StickyNote,
    title: "Notes & status",
    body: "Move candidates through New → Reviewed → Shortlisted → Rejected and leave notes for your team. The processing state is separate, so you always know what's still scoring.",
  },
  {
    icon: Users,
    title: "Team roles",
    body: "Admins create openings, manage members, billing and export. Recruiters upload CVs and work the candidate list. Enforced in the UI and at the database layer.",
  },
  {
    icon: Download,
    title: "CSV export",
    body: "Export the ranked list — scores, summaries, statuses — to CSV and plug it into whatever workflow your team already runs.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "CV files and extracted text are isolated per organization with database-level tenant isolation. No file is ever publicly accessible by default.",
  },
  {
    icon: Gauge,
    title: "Fast, honest AI",
    body: "Median scoring under 5 seconds per CV. The AI only reports what's in the CV — no invented facts, no sensitive inference, neutral language throughout.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex-1 bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-14 text-center">
        <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
          Features
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
          Everything to screen faster, nothing to slow you down
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Built for SMB hiring teams: upload, score, decide. No enterprise bloat, no
          rainbow of dashboards.
        </p>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-7 transition-colors hover:border-primary">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/40">
                <f.icon className="size-5" />
              </span>
              <h2 className="text-lg font-bold tracking-tight">{f.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="flex flex-col items-center gap-6 rounded-[2rem] bg-secondary px-8 py-14 text-center">
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-secondary-foreground">
            See it on your own CV pile
          </h2>
          <p className="max-w-md text-secondary-foreground/80">Start free — 3 job openings, 20 CVs a month, no card required.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 rounded-full px-7" render={<Link href="/signup">Start free</Link>} />
            <Button size="lg" variant="outline" className="h-12 rounded-full px-7" render={<Link href="/how-it-works">How it works</Link>} />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
