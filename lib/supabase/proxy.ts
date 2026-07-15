import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session on every request and guards app routes.
// Called from root proxy.ts (Next 16 renamed `middleware` → `proxy`).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token — do not run code between
  // createServerClient and this call, or sessions may randomly log out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isAdminRoute = pathname.startsWith("/admin");
  const isProRoute = pathname.startsWith("/pro");
  const isAppRoute = isAdminRoute || isProRoute;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  };

  // Not logged in, hitting a protected app route → send to login.
  if (!user && isAppRoute) return redirectTo("/login");

  // Resolve role only when it matters (logged-in user on a role-scoped route).
  if (user && (isAppRoute || isAuthRoute)) {
    // Platform super admins have NO org_members row — check that table first.
    // platform_admins RLS lets a user read only their own row.
    const { data: platformAdmin } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const isSuperAdmin = !!platformAdmin;

    if (isSuperAdmin) {
      // Super admin only belongs in /pro. Auth routes + tenant sections bounce there.
      if (isAuthRoute || isAdminRoute) return redirectTo("/pro/dashboard");
      return response;
    }

    // Org staff (admin | member) all live under /admin.
    const home = "/admin/dashboard";

    // Already logged in, hitting login/signup → send to their home.
    if (isAuthRoute) return redirectTo(home);

    // Non-super-admin hitting /pro → bounce to their own section.
    if (isProRoute) return redirectTo(home);
  }

  return response;
}
