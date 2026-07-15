import { ShieldCheck, UserCog, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ROLES = [
  {
    key: "super_admin",
    label: "Super Admin",
    icon: ShieldCheck,
    scope: "Platform",
    desc: "Operates the whole platform: all orgs, users, subscriptions. No tenant data ownership.",
  },
  {
    key: "admin",
    label: "Org Admin",
    icon: UserCog,
    scope: "Organization",
    desc: "HR manager: create job openings, manage members, billing, export CSV, view usage.",
  },
  {
    key: "member",
    label: "Org Member",
    icon: User,
    scope: "Organization",
    desc: "Recruiter: upload CVs, view candidates, update status/notes. No admin views.",
  },
];

export default function ProRolesPage() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Role</h1>
        <p className="mt-1 text-sm text-muted-foreground">RBAC roles enforced at UI + Supabase RLS.</p>
      </div>

      <Card className="overflow-hidden rounded-3xl p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Permissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROLES.map(({ key, label, icon: Icon, scope, desc }) => (
              <TableRow key={key}>
                <TableCell>
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="size-4 text-muted-foreground" />
                    {label}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{scope}</Badge>
                </TableCell>
                <TableCell className="max-w-xl whitespace-normal text-muted-foreground">{desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
