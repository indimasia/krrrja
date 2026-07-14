import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAllJobOpenings } from "@/lib/data/platform";

export default async function ProJobsPage() {
  const jobs = await listAllJobOpenings();

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every job opening across all organizations.</p>
      </div>

      <Card className="overflow-hidden rounded-3xl p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No job openings yet.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell className="text-muted-foreground">{job.orgName}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === "active" ? "default" : "outline"}>{job.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
