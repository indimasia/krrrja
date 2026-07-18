import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Image src="/logo_2.png" alt="Krrrja" width={36} height={36} className="size-9 rounded-xl" />
            <span className="text-lg font-bold tracking-tight">Krrrja</span>
          </div>
          <p className="max-w-xs text-sm text-background/60">Screen more CVs in less time. Let AI rank, you decide.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold">Product</p>
          <ul className="space-y-2 text-sm text-background/60">
            <li><Link href="/features" className="hover:text-background">Features</Link></li>
            <li><Link href="/how-it-works" className="hover:text-background">How it works</Link></li>
            <li><Link href="/pricing" className="hover:text-background">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold">Company</p>
          <ul className="space-y-2 text-sm text-background/60">
            <li><Link href="/about" className="hover:text-background">About</Link></li>
            <li><a href="#" className="hover:text-background">Careers</a></li>
            <li><a href="#" className="hover:text-background">Contact</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold">Get started</p>
          <div className="flex overflow-hidden rounded-full bg-background/10">
            <input
              type="email"
              placeholder="Your email"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-background placeholder:text-background/50 focus:outline-none"
            />
            <Link href="/signup" className="flex items-center justify-center bg-primary px-4 text-primary-foreground">
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-background/50">
          © 2026 Krrrja. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
