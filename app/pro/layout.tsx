import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogoutDialog } from "@/components/logout-dialog";
import { SidebarNav, type SidebarNavItem } from "@/components/sidebar-nav";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/data/platform";

const NAV_ITEMS: SidebarNavItem[] = [
  { href: "/pro/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/pro/orgs", label: "Organizations", icon: "building" },
  { href: "/pro/jobs", label: "Jobs", icon: "briefcase" },
  { href: "/pro/resume-upload", label: "Resume Upload", icon: "upload" },
  { href: "/pro/users", label: "User", icon: "users" },
  { href: "/pro/roles", label: "Role", icon: "shield" },
];

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  // Defense-in-depth: proxy.ts also guards /pro, but never trust it alone.
  if (!(await isPlatformAdmin())) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const displayName = (user?.user_metadata?.display_name as string) || "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || null;

  return (
    <div className="flex min-h-full bg-background">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5">
          <div className="flex items-center gap-2">
            <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" priority />
            <span className="text-lg font-bold tracking-tight">Krrrja</span>
          </div>
        </div>

        <div className="mx-3 mb-3 rounded-2xl bg-primary-surface px-4 py-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Console</p>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">Super Admin</span>
            <Badge>Platform</Badge>
          </div>
        </div>

        <SidebarNav items={NAV_ITEMS} />

        <div className="mx-3 mt-auto mb-3 space-y-2 rounded-2xl border border-border px-3 py-3">
          <Link
            href="/pro/profile"
            className="flex items-center gap-3 rounded-xl px-1 py-1 -mx-1 -my-1 transition-colors hover:bg-muted"
            title="Edit profile"
          >
            <Avatar className="size-9">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
              <AvatarFallback className="bg-primary-fill text-primary-ink">
                {(displayName || email || "S")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium leading-none">{displayName || email || "—"}</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </Link>
          <LogoutDialog className="w-full rounded-full justify-start" />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
