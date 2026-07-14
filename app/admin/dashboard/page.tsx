import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { FREE_TIER_LIMITS, getOrgContext, getOrgUsage } from "@/lib/data/org";
import { listJobOpenings } from "@/lib/data/jobs";

export default async function DashboardPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const [jobOpenings, usage] = await Promise.all([
    listJobOpenings(ctx.orgId),
    getOrgUsage(ctx.orgId),
  ]);

  const atJobLimit = ctx.subscriptionTier === "free" && usage.activeJobOpenings >= FREE_TIER_LIMITS.maxActiveJobOpenings;
  const cvUsagePct = Math.round((usage.cvProcessedThisMonth / FREE_TIER_LIMITS.maxCvPerMonth) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Openings"
        description="Manage your open roles and screen candidates."
        action={
          ctx.role === "admin" && (
            <Button
              className="rounded-full px-5"
              disabled={atJobLimit}
              render={<Link href="/admin/jobs/new">New job opening</Link>}
            />
          )
        }
      />

      {ctx.subscriptionTier === "free" && (
        <Card className="rounded-3xl border-transparent bg-secondary">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="text-sm text-secondary-foreground">
              <p className="font-semibold">
                Free plan: {usage.activeJobOpenings}/{FREE_TIER_LIMITS.maxActiveJobOpenings} job openings,{" "}
                {usage.cvProcessedThisMonth}/{FREE_TIER_LIMITS.maxCvPerMonth} CVs this month ({cvUsagePct}%).
              </p>
              {atJobLimit && (
                <p className="mt-1 text-secondary-foreground/80">
                  Job opening limit reached — upgrade to Pro for unlimited openings.
                </p>
              )}
            </div>
            <Button size="sm" className="shrink-0 rounded-full">
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      )}

      {jobOpenings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No job openings yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobOpenings.map((job) => (
            <Link key={job.id} href={`/admin/jobs/${job.id}`}>
              <Card className="h-full rounded-3xl transition-all hover:border-primary hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold">{job.title}</CardTitle>
                    <Badge variant={job.status === "active" ? "default" : "outline"}>{job.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {job.candidateCount} candidates · created {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
