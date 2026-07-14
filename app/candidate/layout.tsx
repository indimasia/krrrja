import Image from "next/image";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutDialog } from "@/components/logout-dialog";
import { getOrgContext } from "@/lib/data/org";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getOrgContext();

  // Defense in depth: only candidates belong here (proxy also guards this).
  if (!ctx) redirect("/login");
  if (ctx.role !== "candidate") redirect("/admin/dashboard");

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" priority />
          <span className="text-lg font-bold tracking-tight">Krrrja</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-muted text-foreground">
              {ctx.userId ? "C" : "U"}
            </AvatarFallback>
          </Avatar>
          <LogoutDialog className="rounded-full" />
        </div>
      </header>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
