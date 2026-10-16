import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleSignInButton } from "./google-sign-in-button";

export const metadata: Metadata = { title: "Sign in · Humor Admin" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            H
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Humor Project Admin
            </h1>
            <p className="text-sm text-slate-500">Superadmins only</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-600">
          Sign in with the Google account linked to your Humor Project profile.
        </p>
        <Suspense
          fallback={
            <div className="h-11 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
          }
        >
          <GoogleSignInButton />
        </Suspense>
      </div>
    </main>
  );
}
