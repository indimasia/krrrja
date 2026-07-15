import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JobForm } from "@/components/job-form";
import { PageHeader } from "@/components/page-header";
import { getOrgContext } from "@/lib/data/org";
import { canManageJobOpenings } from "@/lib/permissions";

export default async function NewJobOpeningPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!canManageJobOpenings(ctx.role)) redirect("/admin/dashboard");

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="New job opening"
        description="Define the role and screening criteria — AI will rank candidates against this."
      />

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Role details</CardTitle>
          <CardDescription>Title and description shown to your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm />
        </CardContent>
      </Card>
    </div>
  );
}
