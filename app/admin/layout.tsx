import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogoutDialog } from "@/components/logout-dialog";
import { SidebarNav } from "@/components/sidebar-nav";
import { createClient } from "@/lib/supabase/server";

type NavItem = { href: string; label: string; roles: Array<"admin" | "member"> };

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Job Openings", roles: ["admin", "member"] },
  { href: "/admin/settings", label: "Org Settings", roles: ["admin"] },
  { href: "/admin/billing", label: "Billing", roles: ["admin"] },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve the caller's org + role (RLS returns only their own membership row).
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, orgs(name, subscription_tier, suspended_at)")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const role = (membership?.role as "admin" | "member") ?? "member";
  const org = membership?.orgs as
    | { name: string; subscription_tier: string; suspended_at: string | null }
    | undefined;
  const email = user?.email ?? "";
  const displayName = (user?.user_metadata?.display_name as string) || "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || null;

  // Suspended org: block the whole section (server actions re-check via
  // getOrgContext().suspended — this is the UI half of that enforcement).
  if (org?.suspended_at) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Organization suspended</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {org.name} has been suspended by the platform. Your data is retained. Contact support to resolve this.
        </p>
        <LogoutDialog className="rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full bg-background">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5">
          <div className="flex items-center gap-2">
            <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" priority />
            <span className="text-lg font-bold tracking-tight">Krrrja</span>
          </div>
        </div>

        <div className="mx-3 mb-3 rounded-2xl bg-muted px-4 py-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Organization</p>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">{org?.name ?? "No organization"}</span>
            <Badge variant={org?.subscription_tier === "pro" ? "default" : "outline"}>
              {org?.subscription_tier === "pro" ? "Pro" : "Free"}
            </Badge>
          </div>
        </div>

        <SidebarNav items={NAV_ITEMS.filter((item) => item.roles.includes(role))} />

        <div className="m-3 space-y-2 rounded-2xl border border-border px-3 py-3">
          <Link
            href="/admin/profile"
            className="flex items-center gap-3 rounded-xl px-1 py-1 -mx-1 -my-1 transition-colors hover:bg-muted"
            title="Edit profile"
          >
            <Avatar className="size-9">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
              <AvatarFallback className="bg-muted text-foreground">
                {(displayName || email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium leading-none">{displayName || email || "—"}</p>
              <p className="text-xs capitalize text-muted-foreground">{role}</p>
            </div>
          </Link>
          <LogoutDialog className="w-full rounded-full justify-start" />
        </div>
      </aside>

      {/* Shared main-section frame: every menu page renders inside the same
          width, padding, and vertical rhythm — pages must not re-add p-8. */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
