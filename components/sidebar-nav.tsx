"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SidebarNavItem = { href: string; label: string };

export function SidebarNav({ items }: { items: SidebarNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          // Job detail pages live under /admin/jobs but belong to the Job Openings menu.
          (item.href === "/admin/dashboard" && pathname.startsWith("/admin/jobs"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
