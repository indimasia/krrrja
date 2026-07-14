import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrgContext } from "@/lib/data/org";

export default async function CandidateDashboardPage() {
  const ctx = await getOrgContext();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Candidate dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome to {ctx?.orgName ?? "your organization"}.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Candidate views are not built yet. This is a placeholder shell.
        </CardContent>
      </Card>
    </div>
  );
}
