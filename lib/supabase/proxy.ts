import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and gates /admin at the edge:
 *  - no session          -> /login
 *  - not a superadmin    -> /unauthorized
 *
 * This is a first line of defence only. Every admin page and Server Action
 * re-checks authorization with requireAdmin() (lib/auth.ts) before touching data.
 */
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
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims():
  // getClaims() verifies the JWT and triggers a token refresh when needed.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return response;
  }

  if (!userId) {
    return redirectWithCookies(request, response, "/login", pathname);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.is_superadmin !== true) {
    return redirectWithCookies(request, response, "/unauthorized");
  }

  return response;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  path: string,
  next?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = next ? `?next=${encodeURIComponent(next)}` : "";
  const redirect = NextResponse.redirect(url);
  // Carry over any refreshed session cookies.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
