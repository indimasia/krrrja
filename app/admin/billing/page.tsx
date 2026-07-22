import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { CancelSubscriptionButton, UpgradeButton } from "@/components/billing-buttons";
import { FREE_TIER_LIMITS, getOrgContext, getOrgUsage } from "@/lib/data/org";
import { canManageBilling } from "@/lib/permissions";

const FREE_FEATURES = [
  `${FREE_TIER_LIMITS.maxActiveJobOpenings} active job openings`,
  `${FREE_TIER_LIMITS.maxCvPerMonth} CV${FREE_TIER_LIMITS.maxCvPerMonth === 1 ? "" : "s"} processed per month`,
  "AI scoring, summaries & red flags",
];

// CSV export is deliberately NOT listed as Pro-only: it ships on every tier,
// gated by role (org admin), not by plan.
const PRO_FEATURES = [
  "Unlimited job openings",
  "Unlimited daily CV uploads",
  "AI scoring, summaries & red flags",
  "Cancel anytime — no lock-in",
  "Priority support",
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
      <div className="h-2.5 overflow-hidden rounded-full bg-primary-fill">
        <div
          className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : "bg-primary-ink"}`}
          style={{ width: limit ? `${pct}%` : "4%" }}
        />
      </div>
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!canManageBilling(ctx.role)) redirect("/admin/dashboard");

  const [usage, { checkout }] = await Promise.all([getOrgUsage(ctx.orgId), searchParams]);
  const isPro = ctx.subscriptionTier === "pro";
  const canceling = ctx.subscriptionStatus === "canceling";
  const graceDate = ctx.graceExpiresAt
    ? new Date(ctx.graceExpiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Billing"
        description="Your plan, usage, and upgrade options."
        titleAccessory={<Badge variant={isPro ? "default" : "outline"}>{isPro ? "Pro" : "Free"}</Badge>}
      />

      {/* Checkout return states. Pro may still read "Free" for a beat here —
          the tier flips when Stripe's webhook lands, not on redirect. */}
      {checkout === "success" && (
        <Card className="rounded-3xl border-transparent bg-primary">
          <CardContent className="text-sm text-primary-foreground">
            <p className="font-semibold">Subscription started — welcome to Pro.</p>
            <p className="mt-1 text-primary-foreground/80">
              Pro unlocks as soon as Stripe confirms the payment. Refresh in a moment if this page still shows Free.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Cancel state — the one place peach is allowed in the app. */}
      {checkout === "cancelled" && (
        <Card className="rounded-3xl border-transparent bg-secondary-surface">
          <CardContent className="text-sm text-secondary-ink">
            Checkout cancelled — you have not been charged.
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-transparent bg-primary-surface">
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
            <p className="text-3xl font-extrabold tracking-tight">
              $40<span className="text-sm font-medium text-muted-foreground"> / month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {PRO_FEATURES.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            {isPro ? (
              canceling ? (
                <p className="mt-5 rounded-full bg-secondary-surface px-4 py-2 text-center text-sm font-medium text-secondary-ink">
                  Cancelled — Pro stays active until {graceDate ?? "the end of the period"}, then reverts to Free. No further charges.
                </p>
              ) : (
                <>
                  <p className="mt-5 rounded-full bg-primary-surface px-4 py-2 text-center text-sm font-medium text-primary-ink">
                    Pro active — renews monthly.
                  </p>
                  <CancelSubscriptionButton />
                </>
              )
            ) : (
              <UpgradeButton />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
