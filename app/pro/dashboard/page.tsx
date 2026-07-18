import { Building2, Users, Briefcase, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformStats } from "@/lib/data/platform";

export default async function ProDashboardPage() {
  const stats = await getPlatformStats();

  const tiles = [
    { label: "Organizations", value: stats.orgs, icon: Building2 },
    { label: "Users", value: stats.users, icon: Users },
    { label: "Job Openings", value: stats.jobs, icon: Briefcase },
    { label: "Candidates", value: stats.candidates, icon: FileText },
  ];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide overview across all organizations.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon }, i) => (
          <Card
            key={label}
            className={`rounded-3xl border-transparent ${i === 0 ? "bg-primary" : "bg-primary-surface"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${i === 0 ? "text-primary-foreground/80" : "text-muted-foreground"}`}
              >
                {label}
              </CardTitle>
              <span
                className={`flex size-8 items-center justify-center rounded-xl ${
                  i === 0 ? "bg-primary-emphasis text-primary-foreground" : "bg-primary-fill text-primary-ink"
                }`}
              >
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-extrabold tracking-tight ${i === 0 ? "text-primary-foreground" : ""}`}>
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
