import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Lands Supabase Auth email links (invites, magic links). Exchanges the
// one-time credential for a session, then forwards to `next`. Exchange
// failures still forward — the destination page falls back to a login prompt.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) next = "/"; // no open redirects

  const supabase = await createClient();
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
