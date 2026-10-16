"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_NEXT_COOKIE } from "@/lib/auth-next";

export function GoogleSignInButton() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(
    searchParams.get("error") ? "Sign-in failed. Please try again." : null,
  );

  async function signIn() {
    setPending(true);
    setError(null);
    // redirectTo must exactly match an entry in Supabase's Redirect URLs
    // allow-list; any query string makes it fall back to the Site URL (the
    // main app). So the post-login destination travels in a short-lived
    // cookie that /auth/callback reads, validates, and clears.
    const next = searchParams.get("next") ?? "/admin";
    document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=600; samesite=lax`;

    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setPending(false);
    }
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"
          />
        </svg>
        {pending ? "Redirecting…" : "Continue with Google"}
      </button>
    </>
  );
}
