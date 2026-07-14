import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InviteAccept } from "@/components/invite-accept";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/lib/auth-actions";

// OAuth-consent-style invite acceptance page (modeled on GitHub/Google app
// authorization screens): org identity up top, what the role grants, then an
// explicit accept action.

const ROLE_GRANTS: Record<string, string[]> = {
  admin: [
    "Create and manage job openings",
    "Upload CVs and view ranked candidates",
    "Manage organization members and billing",
    "Export candidate data",
  ],
  member: [
    "View the organization's job openings",
    "Upload CVs and view ranked candidates",
    "Update candidate status and notes",
  ],
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm duration-500 animate-in fade-in slide-in-from-bottom-4 sm:p-10">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Image src="/logo_2.png" alt="Krrrja" width={32} height={32} className="size-8 rounded-lg" priority />
          <span className="font-bold tracking-tight">Krrrja</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { token } = await params;
  const { welcome } = await searchParams;

  // Token is the capability — resolve the invite server-side (service role;
  // the invitee has no org membership, so RLS can't serve this read).
  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("email, role, status, expires_at, orgs(name)")
    .eq("token", token)
    .maybeSingle();

  const orgName = (invite?.orgs as unknown as { name: string } | null)?.name ?? "";
  const invalid =
    !invite || invite.status !== "pending" || new Date(invite.expires_at) < new Date();

  if (invalid) {
    return (
      <Shell>
        <h1 className="text-xl font-bold tracking-tight">This invite is no longer valid</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have expired, been revoked, or already been used. Ask your organization admin to
          send a new one.
        </p>
        <Button className="mt-6 h-11 w-full rounded-full" render={<Link href="/login">Go to login</Link>} />
      </Shell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const emailMatches = user?.email?.toLowerCase() === invite.email.toLowerCase();

  // Signed in as someone else — this invite belongs to a different address.
  if (user && !emailMatches) {
    return (
      <Shell>
        <h1 className="text-xl font-bold tracking-tight">Wrong account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite was sent to <span className="font-semibold text-foreground">{invite.email}</span>,
          but you are signed in as <span className="font-semibold text-foreground">{user.email}</span>.
        </p>
        <form action={logout} className="mt-6">
          <Button type="submit" variant="outline" className="h-11 w-full rounded-full">
            Log out and switch accounts
          </Button>
        </form>
      </Shell>
    );
  }

  // Not signed in and not a fresh invite-created account → normal login,
  // then bounce back here.
  if (!user && !welcome) {
    return (
      <Shell>
        <ConsentHeader orgName={orgName} email={invite.email} role={invite.role} />
        <p className="mt-6 text-sm text-muted-foreground">
          Log in as <span className="font-semibold text-foreground">{invite.email}</span> to accept
          this invitation.
        </p>
        <Button
          className="mt-4 h-11 w-full rounded-full text-base"
          render={<Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Log in to continue</Link>}
        />
      </Shell>
    );
  }

  const mode = !user ? "activate" : welcome ? "accept-set-password" : "accept";

  return (
    <Shell>
      <ConsentHeader orgName={orgName} email={invite.email} role={invite.role} />

      <ul className="mt-6 space-y-2.5 rounded-2xl bg-muted p-5 text-left">
        {(ROLE_GRANTS[invite.role] ?? ROLE_GRANTS.member).map((grant) => (
          <li key={grant} className="flex items-start gap-2.5 text-sm">
            <svg
              className="mt-0.5 size-4 shrink-0 text-primary-foreground"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="8" cy="8" r="7" className="fill-primary stroke-none" />
              <path d="M5 8.2 7.2 10.4 11 6" />
            </svg>
            {grant}
          </li>
        ))}
      </ul>

      {user && (
        <p className="mt-4 text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </p>
      )}

      <div className="mt-6">
        <InviteAccept token={token} mode={mode} orgName={orgName} />
      </div>
    </Shell>
  );
}

function ConsentHeader({ orgName, email, role }: { orgName: string; email: string; role: string }) {
  return (
    <div>
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-secondary text-2xl font-extrabold text-secondary-foreground">
        {orgName ? orgName[0].toUpperCase() : "?"}
      </div>
      <h1 className="mt-4 text-xl font-bold tracking-tight">
        {orgName} invites you to join
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {email} · <Badge variant="outline" className="align-middle capitalize">{role}</Badge>
      </p>
    </div>
  );
}
