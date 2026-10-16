import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_NEXT_COOKIE } from "@/lib/auth-next";
import { createClient } from "@/lib/supabase/server";

// OAuth redirect target: exchanges the ?code from Google/Supabase for a
// session (the PKCE verifier cookie was set by the browser client at sign-in),
// then sends the user on to the admin area.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  const cookieStore = await cookies();
  const next = safeNext(
    decodeCookie(cookieStore.get(AUTH_NEXT_COOKIE)?.value),
  );
  cookieStore.delete(AUTH_NEXT_COOKIE);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}

function decodeCookie(value: string | undefined) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

// Only allow paths inside this app's /admin area, never another host.
function safeNext(next: string | null) {
  if (!next) return "/admin";
  try {
    const base = "http://localhost";
    const url = new URL(next, base);
    const inAdmin =
      url.pathname === "/admin" || url.pathname.startsWith("/admin/");
    return url.origin === base && inAdmin
      ? `${url.pathname}${url.search}`
      : "/admin";
  } catch {
    return "/admin";
  }
}
