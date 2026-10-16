import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

/**
 * Server-side authorization gate. Call this before reading or writing any
 * admin data (Server Components, Server Actions, Route Handlers).
 *
 * Verifies the session JWT, then requires profiles.is_superadmin = true for
 * profiles.id = the authenticated user's id. Redirects otherwise.
 * Wrapped in React cache() so it runs once per request.
 */
export const requireAdmin = cache(async () => {
  // Authorization must run against a real request, never a prerender or
  // prefetch. Supabase's getClaims() also compares the token expiry with
  // Date.now(), which Cache Components rejects while prerendering.
  await connection();

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, is_superadmin")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.is_superadmin !== true) {
    redirect("/unauthorized");
  }

  const admin: AdminProfile = {
    id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    avatar_url: profile.avatar_url,
  };
  return { supabase, admin, email: data.claims.email as string | undefined };
});
