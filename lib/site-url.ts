/**
 * Canonical origin of this admin app, used to build the OAuth redirect URL.
 *
 * Supabase only honours a redirectTo that exactly matches its Redirect URLs
 * allow-list; anything else silently falls back to the project's Site URL
 * (the main Humor Project app). So OAuth must never start from an arbitrary
 * hostname such as a Vercel deployment URL.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL (set this in Vercel)
 *  2. Vercel production domain, when building for production on Vercel
 *  3. The current browser origin (local development)
 *
 * NEXT_PUBLIC_* values are inlined at build time, so they must be referenced
 * literally here.
 */
export function getSiteOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_ENV === "production" &&
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : "");

  return configured ? new URL(configured).origin : window.location.origin;
}
