import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { displayName } from "@/lib/data";
import { Avatar } from "@/components/ui";
import { NavLinks } from "./nav-links";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen md:flex">
      <aside className="flex flex-col gap-4 bg-slate-900 p-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
        <div className="flex items-center justify-between gap-3 px-1 md:block">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 font-bold text-white">
              H
            </div>
            <span className="font-semibold text-white">Humor Admin</span>
          </div>
          <form action="/auth/signout" method="post" className="md:hidden">
            <button className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
              Logout
            </button>
          </form>
        </div>

        <Suspense>
          <NavLinks />
        </Suspense>

        <div className="mt-auto hidden border-t border-slate-800 pt-4 md:block">
          <Suspense
            fallback={<div className="h-9 animate-pulse rounded bg-slate-800" />}
          >
            <CurrentAdmin />
          </Suspense>
          <form action="/auth/signout" method="post" className="mt-3">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-white">
              <span aria-hidden className="w-4 text-center">
                ⎋
              </span>
              Logout
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

async function CurrentAdmin() {
  const { admin, email } = await requireAdmin();
  const name = displayName(admin);
  return (
    <div className="flex items-center gap-3 px-1">
      <Avatar url={admin.avatar_url} name={name} size={36} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        <p className="truncate text-xs text-slate-400">{email ?? "Superadmin"}</p>
      </div>
    </div>
  );
}
