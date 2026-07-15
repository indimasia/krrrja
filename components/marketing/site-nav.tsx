"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/roles", label: "Find Jobs" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Lock body scroll + close on Escape while drawer open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" priority />
        <span className="text-lg font-bold tracking-tight">Krrrja</span>
      </Link>

      <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              pathname === l.href
                ? "font-semibold text-foreground"
                : "transition-colors hover:text-foreground"
            }
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="hidden rounded-full sm:inline-flex"
          render={<Link href="/login">Sign in</Link>}
        />
        <Button className="rounded-full px-4 sm:px-5" render={<Link href="/signup">Start free</Link>} />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-foreground/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <aside
          role="dialog"
          aria-label="Menu"
          className={`absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-background shadow-xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-5 py-5">
            <div className="flex items-center gap-2">
              <Image src="/logo_2.png" alt="Krrrja" width={32} height={32} className="size-8 rounded-lg" />
              <span className="font-bold tracking-tight">Krrrja</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </div>

          <nav className="flex flex-col gap-1 px-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "bg-primary/30 font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2 border-t border-border px-5 py-5">
            <Button variant="outline" className="w-full rounded-full" render={<Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>} />
            <Button className="w-full rounded-full" render={<Link href="/signup" onClick={() => setOpen(false)}>Start free</Link>} />
          </div>
        </aside>
      </div>
    </header>
  );
}
