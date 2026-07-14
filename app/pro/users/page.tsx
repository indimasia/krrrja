import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAllMembers } from "@/lib/data/platform";

export default async function ProUsersPage() {
  const members = await listAllMembers();

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">User</h1>
        <p className="mt-1 text-sm text-muted-foreground">All members across every organization.</p>
      </div>

      <Card className="overflow-hidden rounded-3xl p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={`${m.orgName}-${m.userId}`}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.orgName}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === "admin" ? "default" : "outline"} className="capitalize">
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString()}
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
