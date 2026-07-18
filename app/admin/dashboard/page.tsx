import { redirect } from "next/navigation";
import { Briefcase, FileText, Star, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { getOrgContext } from "@/lib/data/org";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { scoreTint } from "@/lib/candidate-score";

export default async function SummaryDashboardPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const summary = await getDashboardSummary(ctx.orgId);

  const stats = [
    { label: "Total job openings", value: summary.totalJobs, icon: Briefcase },
    { label: "Total candidates", value: summary.totalCandidates, icon: FileText },
    { label: "Total members", value: summary.totalMembers, icon: Users },
    { label: "Average candidate score", value: summary.avgScore ?? "—", icon: Star },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Summary of your organization's screening activity." />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
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

      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Candidate ranking by job</h2>
        {summary.jobRankings.length === 0 ? (
          <Card className="rounded-3xl">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No candidates yet. Upload CVs against a job opening to see rankings here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {summary.jobRankings.map((job) => (
              <Card key={job.jobId} className="rounded-3xl">
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold">{job.jobTitle}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {job.candidateCount} candidate{job.candidateCount === 1 ? "" : "s"}
                      {job.avgScore !== null && ` · avg ${job.avgScore}`}
                    </span>
                  </div>
                  {job.topCandidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No scored candidates yet.</p>
                  ) : (
                    <ol className="space-y-2">
                      {job.topCandidates.map((c, i) => (
                        <li key={c.id} className="flex items-center gap-3 text-sm">
                          <span className="w-5 shrink-0 text-xs font-medium text-muted-foreground">{i + 1}.</span>
                          <span className="min-w-0 flex-1 truncate">{c.name}</span>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreTint(c.score)}`}>
                            {c.score}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
