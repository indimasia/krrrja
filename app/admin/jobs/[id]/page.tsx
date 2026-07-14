import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CvUpload } from "@/components/cv-upload";
import { PageHeader } from "@/components/page-header";
import { getJobOpening } from "@/lib/data/jobs";
import { getOrgContext } from "@/lib/data/org";
import { toggleJobStatus } from "@/lib/actions/jobs";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const job = await getJobOpening(id);
  if (!job) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={job.title}
        titleAccessory={<Badge variant={job.status === "active" ? "default" : "outline"}>{job.status}</Badge>}
        description={`${job.candidateCount} candidates · created ${new Date(job.createdAt).toLocaleDateString()}`}
        action={
          <>
            {ctx.role === "admin" && (
              <form action={toggleJobStatus.bind(null, job.id, job.status === "active" ? "closed" : "active")}>
                <Button type="submit" variant="outline" className="rounded-full">
                  {job.status === "active" ? "Close opening" : "Reopen"}
                </Button>
              </form>
            )}
            <Button
              variant="outline"
              className="rounded-full"
              render={<Link href={`/admin/jobs/${job.id}/candidates`}>View candidates</Link>}
            />
          </>
        }
      />

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-bold">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{job.description}</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-bold">Screening criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{job.criteria}</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-bold">Upload CVs</CardTitle>
          <CardDescription>AI will score each candidate against the criteria above.</CardDescription>
        </CardHeader>
        <CardContent>
          <CvUpload jobOpeningId={job.id} />
        </CardContent>
      </Card>
    </div>
  );
}
