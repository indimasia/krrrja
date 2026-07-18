import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Code,
  FileText,
  Headphones,
  LineChart,
  PenTool,
  Search,
  Send,
  ShieldCheck,
  Truck,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/hero-visual";
import { CvScoreCard } from "@/components/cv-score-card";
import { BatchUploadCard } from "@/components/batch-upload-card";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { Reveal } from "@/components/marketing/reveal";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

const STEPS = [
  { icon: UserPlus, title: "Create your org", body: "Sign up and set up your hiring team in minutes." },
  { icon: FileText, title: "Upload CV batch", body: "Drop as many PDFs as you need and define your screening criteria." },
  { icon: Send, title: "Get ranked shortlist", body: "AI scores and ranks — you review and decide." },
];

const CATEGORIES = [
  { icon: Code, name: "Engineering", count: "58 roles screened" },
  { icon: PenTool, name: "Design", count: "49 roles screened" },
  { icon: Briefcase, name: "Product", count: "33 roles screened" },
  { icon: LineChart, name: "Data & Analytics", count: "29 roles screened" },
  { icon: Wallet, name: "Finance", count: "38 roles screened" },
  { icon: Truck, name: "Operations", count: "85 roles screened" },
  { icon: Headphones, name: "Support", count: "48 roles screened" },
  { icon: ShieldCheck, name: "Security", count: "15 roles screened" },
];

const FEATURES = [
  { title: "Batch upload", body: "Drop any number of CV PDFs at once. Originals stored, text extracted automatically." },
  { title: "AI scoring", body: "Each CV scored 0–100 against your criteria, with a 3-point summary and red flags." },
  { title: "You decide", body: "AI ranks and triages. Add notes, set status, shortlist — the call stays human." },
  { title: "Ranked dashboard", body: "See candidates sorted by match score, filter and act in one view." },
  { title: "CSV export", body: "Export shortlists and scores for your existing hiring workflow." },
  { title: "Team roles", body: "Admins manage openings and billing; recruiters upload and review." },
];

const WHY = ["Screen in minutes", "Consistent scoring", "No card to start", "Human stays in control"];

export default function Home() {
  return (
    <div className="flex-1 bg-background">
      <SiteNav />

      {/* Hero — full-bleed primary blue band, copy left, live product preview right */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-primary sm:rounded-b-[3rem]">
        {/* Decorative same-hue shapes (blue shade steps only — see DESIGN_GUIDE.md) */}
        <div aria-hidden className="absolute -right-28 -top-28 size-[24rem] rounded-full bg-primary-fill" />
        <div aria-hidden className="absolute -bottom-36 -left-24 size-[22rem] rounded-full bg-primary-emphasis" />
        <div aria-hidden className="absolute right-1/3 top-10 size-16 rounded-full bg-primary-surface" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <Reveal>
            <div className="flex flex-col gap-6">
              <span className="w-fit rounded-full bg-primary-surface px-4 py-1.5 text-sm font-semibold text-primary-ink transition-colors duration-200">
                AI-assisted CV screening
              </span>
              <h1 className="text-[2rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Screen more CVs<br />in less time.
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-foreground/70">
                Upload a batch of resumes, set your criteria, and get a ranked shortlist with
                summaries and red flags in minutes — not hours.
              </p>

              {/* Faux search bar → CTA */}
              <div className="glass glass-flash flex w-full max-w-md flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 px-2">
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Paste a role title to screen…</span>
                </div>
                <Button variant="onPrimary" className="rounded-xl px-6" render={<Link href="/signup">Start screening</Link>} />
              </div>
              <p className="text-sm text-foreground/60">Free plan — 3 job openings, 1 CV / month. No card required.</p>
            </div>
          </Reveal>

          {/* Live ranking preview with interactive tilt + floating cards */}
          <Reveal delay={150}>
            <HeroVisual />
          </Reveal>
        </div>
      </section>

      {/* Steps band — blue */}
      <section id="how" className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid gap-6 rounded-[2rem] bg-primary px-6 py-8 sm:grid-cols-3 sm:px-10">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 100} className="h-full">
              <div className="glass glass-flash flex h-full flex-col items-center gap-2 rounded-2xl p-5 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-surface text-primary-ink transition-colors duration-200">
                  <s.icon className="size-5" />
                </div>
                <p className="text-sm font-bold">
                  {i + 1}. {s.title}
                </p>
                <p className="text-xs text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Category grid */}
      <section id="categories" className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <Reveal>
          <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Screen across every role
          </h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.name} delay={(i % 4) * 75}>
              <div className="glass glass-flash flex h-full items-start gap-3 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary-surface transition-colors duration-200">
                  <c.icon className="size-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Trusted split — score-card mock left, copy right */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <CvScoreCard />
          </Reveal>
          <Reveal delay={150}>
            <div className="flex flex-col gap-5">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Trusted, fast CV triage</h2>
              <p className="max-w-md leading-relaxed text-muted-foreground">
                Stop reading every resume from zero. Krrrja ranks candidates against your criteria so
                your team spends time on the shortlist that matters.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="h-12 rounded-full px-7" render={<Link href="/signup">Start screening free</Link>} />
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7" render={<Link href="/login">Log in</Link>} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features band — blue, full-bleed with same-hue decorative shapes */}
      <section id="features" className="relative overflow-hidden bg-primary py-16">
        <div aria-hidden className="absolute -left-24 -top-24 size-80 rounded-full bg-primary-fill" />
        <div aria-hidden className="absolute -bottom-28 -right-20 size-72 rounded-full bg-primary-emphasis" />
        <div aria-hidden className="absolute right-1/4 top-8 size-12 rounded-full bg-primary-surface" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              Everything to screen faster
            </h2>
            <p className="mb-10 text-center text-sm text-primary-foreground/80">
              Built for SMB hiring teams — upload, score, decide.
            </p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 100}>
                <div className="glass glass-flash h-full rounded-3xl p-7">
                  <h3 className="mb-2 text-lg font-bold tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-10 flex justify-center">
              <Button size="lg" variant="onPrimary" className="h-12 rounded-full px-7" render={<Link href="/signup">Create your account <ArrowRight className="size-4" /></Link>} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why popular split — copy left, upload-pipeline mock right */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="flex flex-col gap-5">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Why teams pick Krrrja</h2>
              <p className="max-w-md leading-relaxed text-muted-foreground">
                Consistent, criteria-first scoring that keeps humans in control. No rainbow of dashboards —
                just a ranked list you can act on.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {WHY.map((w) => (
                  <div key={w} className="glass glass-flash flex items-center gap-2 rounded-xl px-4 py-3">
                    <ShieldCheck className="size-4 shrink-0 text-primary-ink" />
                    <span className="text-sm font-medium">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <BatchUploadCard />
          </Reveal>
        </div>
      </section>

      {/* Testimonial carousel — auto-slide + progress + prev/next */}
      <Reveal>
        <TestimonialCarousel />
      </Reveal>

      {/* Final CTA — full-bleed blue band, mirrors the hero */}
      <section className="relative mt-16 overflow-hidden rounded-t-[2.5rem] bg-primary sm:rounded-t-[3rem]">
        <div aria-hidden className="absolute -left-28 -bottom-28 size-[20rem] rounded-full bg-primary-fill" />
        <div aria-hidden className="absolute -right-20 -top-24 size-72 rounded-full bg-primary-emphasis" />
        <div aria-hidden className="absolute left-1/4 bottom-10 size-14 rounded-full bg-primary-surface" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <Reveal>
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to read the top of the pile?
              </h2>
              <p className="max-w-md text-foreground/70">
                Free plan — 3 job openings, 1 CV / month. No card required.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="onPrimary" className="h-12 rounded-full px-7" render={<Link href="/signup">Start screening free</Link>} />
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7" render={<Link href="/how-it-works">See how it works</Link>} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
