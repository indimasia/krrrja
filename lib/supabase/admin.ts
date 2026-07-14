import { createClient } from "@supabase/supabase-js";

// Service-role client — BYPASSES RLS. Use ONLY in server code already gated by
// a platform-admin check (see lib/data/platform.ts). Never import in client
// components or expose the service key to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
