import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InviteMemberForm, OrgSettingsShell } from "@/components/org-settings-forms";
import { getOrgContext, listOrgMembers, listPendingInvites } from "@/lib/data/org";
import { revokeInvite } from "@/lib/actions/org";
import { canManageTeam } from "@/lib/permissions";

export default async function OrgSettingsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const canInvite = canManageTeam(ctx.role);

  const [members, invites] = await Promise.all([
    listOrgMembers(ctx.orgId),
    canInvite ? listPendingInvites(ctx.orgId) : Promise.resolve([]),
  ]);

  return (
    <OrgSettingsShell orgName={ctx.orgName} isOwner={ctx.isOwner}>
      {canInvite && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="font-bold">Invite a teammate</CardTitle>
            <CardDescription>
              They&apos;ll get an email with a link to review and accept the invitation. Invites
              expire after 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm />
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-bold">Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "person" : "people"} in {ctx.orgName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.userId}>
                  <TableCell>
                    <Avatar size="sm">
                      <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name ?? m.email} />
                      <AvatarFallback>{(m.name ?? m.email).charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {m.name ?? "—"}
                    {m.userId === ctx.userId && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === "admin" ? "default" : "outline"} className="capitalize">
                      {m.role}
                    </Badge>
                    {m.userId === ctx.ownerId && (
                      <Badge variant="outline" className="ml-1.5">Owner</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="font-bold">Pending invites</CardTitle>
            <CardDescription>Sent but not yet accepted.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{i.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(i.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <form action={revokeInvite.bind(null, i.id)}>
                        <Button type="submit" variant="outline" size="sm" className="rounded-full">
                          Revoke
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </OrgSettingsShell>
  );
}
