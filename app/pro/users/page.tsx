import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAllMembers, listOrgOptions } from "@/lib/data/platform";
import { NewUserButton, UserRowActions } from "@/components/pro/user-crud";

export default async function ProUsersPage() {
  const [members, orgs] = await Promise.all([listAllMembers(), listOrgOptions()]);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">User</h1>
          <p className="mt-1 text-sm text-muted-foreground">All members across every organization.</p>
        </div>
        <NewUserButton orgs={orgs} />
      </div>

      <Card className="overflow-hidden rounded-3xl p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.memberId}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell className="text-muted-foreground">{m.orgName}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === "admin" ? "default" : "outline"} className="capitalize">
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <UserRowActions user={m} />
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
