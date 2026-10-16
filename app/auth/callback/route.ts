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
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

function decodeCookie(value: string | undefined) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

// Only allow same-origin admin paths to avoid open redirects.
function safeNext(next: string | null) {
  return next && next.startsWith("/admin") && !next.startsWith("//")
    ? next
    : "/admin";
}
