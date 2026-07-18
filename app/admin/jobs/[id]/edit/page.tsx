import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { JobForm } from "@/components/job-form";
import { PageHeader } from "@/components/page-header";
import { getJobOpening } from "@/lib/data/jobs";
import { getOrgContext } from "@/lib/data/org";
import { canManageJobOpenings } from "@/lib/permissions";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!canManageJobOpenings(ctx.role)) redirect(`/admin/jobs/${id}`);

  const job = await getJobOpening(id);
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit job opening" description="Changes apply to future CV scoring — existing scores are not re-computed." />
      <Card className="rounded-3xl">
        <CardContent>
          <JobForm
            job={{
              id: job.id,
              title: job.title,
              description: job.description,
              criteria: job.criteria,
              skills: job.skills,
              requirements: job.requirements,
              jobType: job.jobType,
              workplaceType: job.workplaceType,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              currency: job.currency,
              attachmentName: job.attachmentName,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
