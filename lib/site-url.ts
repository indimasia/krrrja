import { headers } from "next/headers";

// Canonical origin for links baked into emails and Stripe return URLs.
// Prefers NEXT_PUBLIC_SITE_URL (set on the production deploy) so email links
// never point at localhost. Falls back to the forwarded host header, which is
// correct for local dev and Vercel preview deploys where the env is unset.
export async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
