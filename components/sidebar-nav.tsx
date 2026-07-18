"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  CreditCard,
  FileUp,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Server layouts pass icon *names* (components aren't serializable across the
// RSC boundary); the client resolves them here.
const ICONS = {
  briefcase: Briefcase,
  building: Building2,
  card: CreditCard,
  dashboard: LayoutDashboard,
  settings: Settings,
  shield: ShieldCheck,
  upload: FileUp,
  users: Users,
} satisfies Record<string, LucideIcon>;

export type SidebarNavItem = { href: string; label: string; icon?: keyof typeof ICONS };

export function SidebarNav({ items }: { items: SidebarNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon ? ICONS[item.icon] : null;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-primary-surface hover:text-foreground",
            )}
          >
            {Icon && <Icon className={cn("size-4 shrink-0", active ? "text-primary-foreground" : "text-primary-ink")} />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
