import type { Metadata } from "next";

export const metadata: Metadata = { title: "Access denied · Humor Admin" };

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-xl text-rose-600">
          !
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your account is signed in but is not a superadmin. Ask an existing
          admin to grant access.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
