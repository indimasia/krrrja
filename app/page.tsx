import Link from "next/link";
import Image from "next/image";
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

const STEPS = [
  { icon: UserPlus, title: "Create your org", body: "Sign up and set up your hiring team in minutes." },
  { icon: FileText, title: "Upload CV batch", body: "Drop up to 10 PDFs and define your screening criteria." },
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
  { title: "Batch upload", body: "Drop up to 10 CV PDFs at once. Originals stored, text extracted automatically." },
  { title: "AI scoring", body: "Each CV scored 0–100 against your criteria, with a 3-point summary and red flags." },
  { title: "You decide", body: "AI ranks and triages. Add notes, set status, shortlist — the call stays human." },
  { title: "Ranked dashboard", body: "See candidates sorted by match score, filter and act in one view." },
  { title: "CSV export", body: "Export shortlists and scores for your existing hiring workflow." },
  { title: "Team roles", body: "Admins manage openings and billing; recruiters upload and review." },
];

const WHY = ["Screen in minutes", "Consistent scoring", "No card to start", "Human stays in control"];

// Decorative accent dot
function Dot({ className }: { className: string }) {
  return <span className={`absolute size-3 rounded-full ${className}`} aria-hidden />;
}

export default function Home() {
  return (
    <div className="flex-1 bg-background">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" priority />
          <span className="text-lg font-bold tracking-tight">Krrrja</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#categories" className="transition-colors hover:text-foreground">Find Jobs</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          <Link href="/about" className="transition-colors hover:text-foreground">About</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="rounded-full" render={<Link href="/login">Sign in</Link>} />
          <Button className="rounded-full px-5" render={<Link href="/signup">Start free</Link>} />
        </div>
      </header>

      {/* Hero — blue block, copy left, photo + floating cards right */}
      <section className="mx-auto max-w-6xl px-6 pt-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary/70 px-6 py-12 sm:px-12 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <span className="w-fit rounded-full bg-background/70 px-4 py-1.5 text-sm font-semibold text-foreground">
                AI-assisted CV screening
              </span>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Screen more CVs<br />in less time.
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-foreground/70">
                Upload a batch of resumes, set your criteria, and get a ranked shortlist with
                summaries and red flags in minutes — not hours.
              </p>

              {/* Faux search bar → CTA */}
              <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-card p-3 shadow-sm sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 px-2">
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Paste a role title to screen…</span>
                </div>
                <Button className="rounded-xl px-6" render={<Link href="/signup">Start screening</Link>} />
              </div>
              <p className="text-sm text-foreground/60">Free plan — 3 job openings, 20 CVs / month. No card required.</p>
            </div>

            {/* Photo + floating stat cards */}
            <div className="relative mx-auto w-full max-w-sm">
              <Dot className="left-2 top-2 bg-destructive" />
              <Dot className="right-6 top-10 size-4 bg-secondary" />
              <Dot className="bottom-8 left-0 bg-foreground" />
              <img
                src="https://i.pravatar.cc/560?img=13"
                alt="Hiring manager reviewing candidates"
                loading="lazy"
                className="aspect-[4/5] w-full rounded-[2rem] object-cover"
              />
              <div className="absolute -left-4 top-10 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-md">
                <LineChart className="size-5 text-primary-foreground" />
                <div>
                  <p className="text-sm font-bold leading-none">20K+</p>
                  <p className="text-xs text-muted-foreground">CVs screened</p>
                </div>
              </div>
              <div className="absolute -right-3 bottom-12 rounded-2xl bg-card px-4 py-3 shadow-md">
                <p className="text-sm font-bold leading-none">140+</p>
                <p className="text-xs text-muted-foreground">Teams hiring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps band — peach */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 rounded-[2rem] bg-secondary px-6 py-8 sm:grid-cols-3 sm:px-10">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-card text-secondary-foreground">
                <s.icon className="size-5" />
              </div>
              <p className="text-sm font-bold text-secondary-foreground">
                {i + 1}. {s.title}
              </p>
              <p className="text-xs text-secondary-foreground/80">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category grid */}
      <section id="categories" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Screen across every role
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div
              key={c.name}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/40">
                <c.icon className="size-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted split — photo left, copy right */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-0 -translate-x-4 translate-y-4 rounded-[2rem] bg-secondary" aria-hidden />
            <img
              src="https://i.pravatar.cc/560?img=52"
              alt="Recruiter using Krrrja"
              loading="lazy"
              className="relative aspect-[4/5] w-full rounded-[2rem] object-cover"
            />
            <div className="absolute bottom-6 left-2 flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-md">
              <ShieldCheck className="size-4 text-primary-foreground" />
              <span className="text-xs font-semibold">100% human-decided</span>
            </div>
          </div>
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
        </div>
      </section>

      {/* Features band — peach */}
      <section id="features" className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-secondary-foreground sm:text-4xl">
            Everything to screen faster
          </h2>
          <p className="mb-10 text-center text-sm text-secondary-foreground/80">
            Built for SMB hiring teams — upload, score, decide.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-3xl bg-card p-7">
                <h3 className="mb-2 text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button size="lg" className="h-12 rounded-full px-7" render={<Link href="/signup">Create your account <ArrowRight className="size-4" /></Link>} />
          </div>
        </div>
      </section>

      {/* Why popular split — copy left, photo right */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Why teams pick Krrrja</h2>
            <p className="max-w-md leading-relaxed text-muted-foreground">
              Consistent, criteria-first scoring that keeps humans in control. No rainbow of dashboards —
              just a ranked list you can act on.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WHY.map((w) => (
                <div key={w} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
                  <ShieldCheck className="size-4 shrink-0 text-primary-foreground" />
                  <span className="text-sm font-medium">{w}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-primary/50" aria-hidden />
            <img
              src="https://i.pravatar.cc/560?img=33"
              alt="Hiring lead reviewing a shortlist"
              loading="lazy"
              className="relative aspect-[4/5] w-full rounded-[2rem] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-[2rem] bg-primary/60 px-6 py-14 text-center sm:px-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">What teams say</p>
          <p className="mx-auto max-w-2xl text-xl font-semibold leading-relaxed text-foreground sm:text-2xl">
            &ldquo;We went from a full day of resume reading to a ranked shortlist before lunch. Krrrja does
            the triage, we make the call.&rdquo;
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <img
              src="https://i.pravatar.cc/80?img=45"
              alt="Customer"
              loading="lazy"
              className="size-11 rounded-full object-cover"
            />
            <div className="text-left">
              <p className="text-sm font-bold">Tufayel Khan</p>
              <p className="text-xs text-foreground/60">Head of Talent</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — dark */}
      <footer className="bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" priority />
              <span className="text-lg font-bold tracking-tight">Krrrja</span>
            </div>
            <p className="max-w-xs text-sm text-background/60">Screen more CVs in less time. Let AI rank, you decide.</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">Product</p>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#features" className="hover:text-background">Features</a></li>
              <li><a href="#how" className="hover:text-background">How it works</a></li>
              <li><a href="#pricing" className="hover:text-background">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">Company</p>
            <ul className="space-y-2 text-sm text-background/60">
              <li><Link href="/about" className="hover:text-background">About</Link></li>
              <li><a href="#" className="hover:text-background">Careers</a></li>
              <li><a href="#" className="hover:text-background">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">Get started</p>
            <div className="flex overflow-hidden rounded-full bg-background/10">
              <input
                type="email"
                placeholder="Your email"
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-background placeholder:text-background/50 focus:outline-none"
              />
              <Link href="/signup" className="flex items-center justify-center bg-primary px-4 text-primary-foreground">
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10">
          <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-background/50">
            © 2026 Krrrja. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
