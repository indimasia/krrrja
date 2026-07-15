import Link from "next/link";
import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Pricing — Krrrja",
  description: "Start free with 3 job openings and 20 CVs a month. Upgrade to Pro for unlimited screening.",
};

const FREE = [
  { label: "3 active job openings", included: true },
  { label: "20 CVs processed / month", included: true },
  { label: "AI scoring, summaries & red flags", included: true },
  { label: "Ranked candidate dashboard", included: true },
  { label: "Notes & candidate status", included: true },
  { label: "Team roles (admin & recruiter)", included: true },
  { label: "Unlimited job openings", included: false },
  { label: "Unlimited CV processing", included: false },
];

const PRO = [
  { label: "Unlimited job openings", included: true },
  { label: "Unlimited CV processing", included: true },
  { label: "AI scoring, summaries & red flags", included: true },
  { label: "Ranked candidate dashboard", included: true },
  { label: "Notes & candidate status", included: true },
  { label: "Team roles (admin & recruiter)", included: true },
  { label: "CSV export", included: true },
  { label: "Self-serve billing portal", included: true },
];

const FAQ = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan needs no card at all — sign up, create an opening, and screen your first batch.",
  },
  {
    q: "What happens when I hit the Free limit?",
    a: "Nothing breaks. The action that would exceed the limit is blocked with an upgrade prompt; everything you've already screened stays available.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Yes, self-serve from the billing portal. Pro features stay active for a 3-day grace period, then your org returns to the Free plan.",
  },
  {
    q: "Who sees my candidates' CVs?",
    a: "Only your organization. Files and extracted text are tenant-isolated at the database level and never publicly accessible.",
  },
];

function PlanList({ items }: { items: { label: string; included: boolean }[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((f) => (
        <li key={f.label} className="flex items-start gap-3 text-sm">
          {f.included ? (
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
              <Check className="size-3 text-primary-foreground" strokeWidth={3} />
            </span>
          ) : (
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
              <Minus className="size-3 text-muted-foreground" strokeWidth={3} />
            </span>
          )}
          <span className={f.included ? "font-medium" : "text-muted-foreground"}>{f.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <div className="flex-1 bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-14 text-center sm:px-6">
        <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
          Pricing
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
          Start free. Upgrade when the pile grows.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Two plans, no surprises. Every plan keeps the hiring decision human.
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-[2rem] border border-border bg-card p-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Free</h2>
              <p className="mt-1 text-sm text-muted-foreground">For your first openings</p>
              <p className="mt-4 text-4xl font-extrabold tracking-tight">$0<span className="text-base font-medium text-muted-foreground"> / month</span></p>
            </div>
            <PlanList items={FREE} />
            <Button size="lg" variant="outline" className="mt-auto h-12 rounded-full" render={<Link href="/signup">Start free</Link>} />
          </div>

          <div className="relative flex flex-col gap-6 rounded-[2rem] bg-primary/70 p-8">
            <span className="absolute right-6 top-6 rounded-full bg-background/70 px-3 py-1 text-xs font-bold">
              Most popular
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Pro</h2>
              <p className="mt-1 text-sm text-foreground/70">For teams hiring every month</p>
              <p className="mt-4 text-4xl font-extrabold tracking-tight">Early access<span className="block text-base font-medium text-foreground/70">pricing announced at launch</span></p>
            </div>
            <PlanList items={PRO} />
            <Button size="lg" className="mt-auto h-12 rounded-full" render={<Link href="/signup">Start free, upgrade in-app</Link>} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-20">
        <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight">Common questions</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-3xl border border-border bg-card p-7">
              <h3 className="mb-2 text-base font-bold tracking-tight">{f.q}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
