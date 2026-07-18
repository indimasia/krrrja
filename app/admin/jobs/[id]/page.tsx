import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CvUploadDialog } from "@/components/cv-upload-dialog";
import { PageHeader } from "@/components/page-header";
import { getJobOpening } from "@/lib/data/jobs";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/data/org";
import { toggleJobStatus } from "@/lib/actions/jobs";
import { canManageJobOpenings, canUploadCV } from "@/lib/permissions";
import { JOB_TYPE_LABELS, WORKPLACE_TYPE_LABELS, formatSalaryRange } from "@/lib/job-fields";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const job = await getJobOpening(id);
  if (!job) notFound();

  // Private bucket — short-lived signed URL per page view.
  let attachmentUrl: string | null = null;
  if (job.attachmentPath) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("job-attachments").createSignedUrl(job.attachmentPath, 3600);
    attachmentUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        titleAccessory={<Badge variant={job.status === "active" ? "default" : "outline"}>{job.status}</Badge>}
        description={`${job.candidateCount} candidates · created ${new Date(job.createdAt).toLocaleDateString()}`}
        action={
          <>
            {canManageJobOpenings(ctx.role) && (
              <>
                <Button
                  variant="outline"
                  className="rounded-full"
                  render={<Link href={`/admin/jobs/${job.id}/edit`}>Edit</Link>}
                />
                <form action={toggleJobStatus.bind(null, job.id, job.status === "active" ? "closed" : "active")}>
                  <Button type="submit" variant="outline" className="rounded-full">
                    {job.status === "active" ? "Close opening" : "Reopen"}
                  </Button>
                </form>
              </>
            )}
            <Button
              variant="outline"
              className="rounded-full"
              render={<Link href={`/admin/jobs/${job.id}/candidates`}>View candidates</Link>}
            />
            {canUploadCV(ctx.role) && <CvUploadDialog jobOpeningId={job.id} />}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-full border-transparent bg-primary-surface text-primary-ink">
          {JOB_TYPE_LABELS[job.jobType]}
        </Badge>
        <Badge variant="outline" className="rounded-full border-transparent bg-primary-surface text-primary-ink">
          {WORKPLACE_TYPE_LABELS[job.workplaceType]}
        </Badge>
        {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency) && (
          <Badge variant="outline" className="rounded-full border-transparent bg-primary-surface text-primary-ink">
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
          </Badge>
        )}
        {attachmentUrl && (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {job.attachmentName ?? "Attachment"} ↗
          </a>
        )}
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-bold">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-line">{job.description}</p>
        </CardContent>
      </Card>

      {job.requirements && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="font-bold">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{job.requirements}</p>
          </CardContent>
        </Card>
      )}

      {job.skills.length > 0 && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="font-bold">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="rounded-full border-transparent bg-primary-surface text-primary-ink"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-bold">Screening criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{job.criteria}</p>
        </CardContent>
      </Card>
    </div>
  );
}
