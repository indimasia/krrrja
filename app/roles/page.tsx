import Link from "next/link";
import type { Metadata } from "next";
import {
  Briefcase,
  Code,
  Headphones,
  LineChart,
  PenTool,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Roles — Krrrja",
  description: "Krrrja screens CVs for any role — engineering, design, product, finance, operations and more. Your criteria set the bar.",
};

const CATEGORIES = [
  { icon: Code, name: "Engineering", count: "58 roles screened", example: "min 3 yrs backend, has run a system with 10k+ users" },
  { icon: PenTool, name: "Design", count: "49 roles screened", example: "portfolio with shipped mobile work, Figma fluency" },
  { icon: Briefcase, name: "Product", count: "33 roles screened", example: "owned a B2B roadmap end-to-end, data-informed" },
  { icon: LineChart, name: "Data & Analytics", count: "29 roles screened", example: "SQL + Python, built dashboards execs actually used" },
  { icon: Wallet, name: "Finance", count: "38 roles screened", example: "closed monthly books solo, ERP migration experience" },
  { icon: Truck, name: "Operations", count: "85 roles screened", example: "managed 3PL vendors, cut fulfilment SLA misses" },
  { icon: Headphones, name: "Support", count: "48 roles screened", example: "led a support queue >500 tickets/wk, CSAT > 90%" },
  { icon: ShieldCheck, name: "Security", count: "15 roles screened", example: "incident response ownership, SOC 2 audit exposure" },
];

export default function RolesPage() {
  return (
    <div className="flex-1 bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-14 text-center">
        <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
          Roles
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
          Screen across every role
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Krrrja isn&apos;t tuned to one job family. Your free-text criteria set the bar —
          the AI scores every CV against exactly what you wrote.
        </p>
      </section>

      {/* Category grid with example criteria */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div
              key={c.name}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/40">
                <c.icon className="size-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.count}</p>
              </div>
              <div className="mt-auto rounded-xl bg-muted px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Example criteria</p>
                <p className="mt-1 text-xs leading-relaxed">&ldquo;{c.example}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="flex flex-col items-center gap-6 rounded-[2rem] bg-primary/70 px-8 py-14 text-center">
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight">Your role, your criteria</h2>
          <p className="max-w-md text-foreground/70">
            Write the bar in plain language and let the ranking do the first pass.
          </p>
          <Button size="lg" className="h-12 rounded-full px-7" render={<Link href="/signup">Start screening free</Link>} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
