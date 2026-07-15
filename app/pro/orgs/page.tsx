import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listOrgs } from "@/lib/data/platform";
import { toggleOrgSuspended } from "@/lib/actions/platform";
import { NewOrgButton, OrgRowActions } from "@/components/pro/org-crud";

export default async function ProOrgsPage() {
  const orgs = await listOrgs();

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every tenant with subscription state and usage. Suspending blocks the org&apos;s staff from the app without
            deleting data.
          </p>
        </div>
        <NewOrgButton />
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Active jobs</TableHead>
              <TableHead>CVs this month</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No organizations yet.
                </TableCell>
              </TableRow>
            )}
            {orgs.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell>
                  <Badge variant={o.subscriptionTier === "pro" ? "default" : "outline"}>{o.subscriptionTier}</Badge>
                </TableCell>
                <TableCell>{o.memberCount}</TableCell>
                <TableCell>{o.activeJobCount}</TableCell>
                <TableCell>{o.cvThisMonth}</TableCell>
                <TableCell>
                  {o.suspendedAt ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <form action={toggleOrgSuspended.bind(null, o.id, !o.suspendedAt)}>
                      <Button type="submit" variant={o.suspendedAt ? "outline" : "destructive"} size="sm" className="rounded-full">
                        {o.suspendedAt ? "Unsuspend" : "Suspend"}
                      </Button>
                    </form>
                    <OrgRowActions org={o} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
