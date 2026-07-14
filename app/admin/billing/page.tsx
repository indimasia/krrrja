import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { FREE_TIER_LIMITS, getOrgContext, getOrgUsage } from "@/lib/data/org";

const FREE_FEATURES = [
  `${FREE_TIER_LIMITS.maxActiveJobOpenings} active job openings`,
  `${FREE_TIER_LIMITS.maxCvPerMonth} CVs processed per month`,
  "AI scoring, summaries & red flags",
];

const PRO_FEATURES = [
  "Unlimited job openings",
  "Unlimited CV processing",
  "AI scoring, summaries & red flags",
  "CSV export",
];

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {used}
          {limit ? ` / ${limit}` : " · unlimited"}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : "bg-primary"}`}
          style={{ width: limit ? `${pct}%` : "4%" }}
        />
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (ctx.role !== "admin") redirect("/admin/dashboard");

  const usage = await getOrgUsage(ctx.orgId);
  const isPro = ctx.subscriptionTier === "pro";

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Billing"
        description="Your plan, usage, and upgrade options."
        titleAccessory={<Badge variant={isPro ? "default" : "outline"}>{isPro ? "Pro" : "Free"}</Badge>}
      />

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-bold">Usage this month</CardTitle>
          <CardDescription>Counted org-wide, resets on the 1st.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <UsageBar
            label="Active job openings"
            used={usage.activeJobOpenings}
            limit={isPro ? null : FREE_TIER_LIMITS.maxActiveJobOpenings}
          />
          <UsageBar
            label="CVs processed"
            used={usage.cvProcessedThisMonth}
            limit={isPro ? null : FREE_TIER_LIMITS.maxCvPerMonth}
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className={`rounded-3xl ${!isPro ? "border-primary" : ""}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-bold">Free</CardTitle>
              {!isPro && <Badge>Current plan</Badge>}
            </div>
            <CardDescription>For trying out AI screening.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight">
              $0<span className="text-sm font-medium text-muted-foreground"> / month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {FREE_FEATURES.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className={`rounded-3xl ${isPro ? "border-primary" : ""}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-bold">Pro</CardTitle>
              {isPro && <Badge>Current plan</Badge>}
            </div>
            <CardDescription>For teams screening at volume.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pro pricing is an open product decision — see CLAUDE.md open questions. */}
            <p className="text-3xl font-extrabold tracking-tight">
              Coming soon
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {PRO_FEATURES.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            {!isPro && (
              <Button className="mt-5 w-full rounded-full" disabled>
                Upgrade to Pro
              </Button>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Stripe checkout lands with the billing build step.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
