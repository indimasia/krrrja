import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobOpeningsView } from "@/components/job-openings-view";
import { PageHeader } from "@/components/page-header";
import { UpgradeProCta } from "@/components/billing-buttons";
import { FREE_TIER_LIMITS, getOrgContext, getOrgUsage } from "@/lib/data/org";
import { listJobOpenings } from "@/lib/data/jobs";
import { canManageBilling, canManageJobOpenings } from "@/lib/permissions";

export default async function DashboardPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const [jobOpenings, usage] = await Promise.all([
    listJobOpenings(ctx.orgId),
    getOrgUsage(ctx.orgId),
  ]);

  const atJobLimit = ctx.subscriptionTier === "free" && usage.activeJobOpenings >= FREE_TIER_LIMITS.maxActiveJobOpenings;
  const atCvLimit = ctx.subscriptionTier === "free" && usage.cvProcessedThisMonth >= FREE_TIER_LIMITS.maxCvPerMonth;
  const cvUsagePct = Math.round((usage.cvProcessedThisMonth / FREE_TIER_LIMITS.maxCvPerMonth) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Openings"
        description="Manage your open roles and screen candidates."
        action={
          canManageJobOpenings(ctx.role) && (
            <Button
              className="rounded-full px-5"
              disabled={atJobLimit}
              render={<Link href="/admin/jobs/new">New job opening</Link>}
            />
          )
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        {[
          {
            label: "Active job openings",
            value: `${usage.activeJobOpenings}${ctx.subscriptionTier === "free" ? ` / ${FREE_TIER_LIMITS.maxActiveJobOpenings}` : ""}`,
            icon: Briefcase,
          },
          {
            label: "CVs processed this month",
            value: `${usage.cvProcessedThisMonth}${ctx.subscriptionTier === "free" ? ` / ${FREE_TIER_LIMITS.maxCvPerMonth}` : ""}`,
            icon: FileText,
          },
          {
            label: "Plan",
            value: ctx.subscriptionTier === "pro" ? "Pro" : "Free",
            icon: Sparkles,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-3xl border-transparent bg-primary-surface">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-fill text-primary-ink">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-2xl font-extrabold tracking-tight">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ctx.subscriptionTier === "free" && (
        <Card className="rounded-3xl border-transparent bg-primary transition-colors duration-200">
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-primary-foreground">
              <p className="font-semibold">
                Free plan: {usage.activeJobOpenings}/{FREE_TIER_LIMITS.maxActiveJobOpenings} job openings,{" "}
                {usage.cvProcessedThisMonth}/{FREE_TIER_LIMITS.maxCvPerMonth} CVs this month ({cvUsagePct}%).
              </p>
              {atJobLimit && (
                <p className="mt-1 text-primary-foreground/80">
                  Job opening limit reached — upgrade to Pro for unlimited openings.
                </p>
              )}
              {atCvLimit && (
                <p className="mt-1 text-primary-foreground/80">
                  Monthly CV limit reached — upgrade to Pro for unlimited screening.
                </p>
              )}
            </div>
            {canManageBilling(ctx.role) ? (
              <UpgradeProCta />
            ) : (
              // Members can't reach Checkout — say who can instead of showing a
              // button that would only 403.
              <p className="shrink-0 text-xs text-primary-foreground/80">Ask an org admin to upgrade.</p>
            )}
          </CardContent>
        </Card>
      )}

      <JobOpeningsView jobOpenings={jobOpenings} />
    </div>
  );
}
