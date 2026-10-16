import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import {
  displayName,
  fetchAll,
  formatDate,
  PAGE_SIZE,
  parsePage,
  type Profile,
} from "@/lib/data";
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  LoadingCard,
  PageHeader,
  Pagination,
  td,
  th,
} from "@/components/ui";

export const metadata: Metadata = { title: "Users · Humor Admin" };

export default function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <>
      <PageHeader title="Users" description="All user profiles (read only)." />
      <Suspense fallback={<LoadingCard />}>
        <UsersTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UsersTable({
  searchParams,
}: {
  searchParams: PageProps<"/admin/users">["searchParams"];
}) {
  const { supabase } = await requireAdmin();
  const page = parsePage((await searchParams).page);
  const from = (page - 1) * PAGE_SIZE;

  const { data, count, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, created_at, is_superadmin", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) return <ErrorState message={error.message} />;
  const users = (data ?? []) as Profile[];

  // Per-user activity for the rows on this page.
  const ids = users.map((u) => u.id);
  const userIdsIn = (table: "generations" | "votes") =>
    fetchAll((from, to) =>
      supabase.from(table).select("user_id").in("user_id", ids).order("id").range(from, to),
    );
  let gens: { user_id: string | null }[] = [];
  let votes: { user_id: string | null }[] = [];
  if (ids.length) {
    try {
      [gens, votes] = await Promise.all([userIdsIn("generations"), userIdsIn("votes")]);
    } catch (e) {
      return <ErrorState message={(e as Error).message} />;
    }
  }
  const countBy = (rows: { user_id: string | null }[]) => {
    const m = new Map<string, number>();
    for (const { user_id } of rows) {
      if (user_id) m.set(user_id, (m.get(user_id) ?? 0) + 1);
    }
    return m;
  };
  const genCounts = countBy(gens);
  const voteCounts = countBy(votes);

  return (
    <Card className="overflow-hidden">
      {users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Role</th>
                <th className={th}>Generations</th>
                <th className={th}>Votes cast</th>
                <th className={th}>Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const name = displayName(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar url={u.avatar_url} name={name} size={36} />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{name}</p>
                          <p className="font-mono text-xs text-slate-400">
                            {u.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      {u.is_superadmin ? (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/20">
                          Superadmin
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          User
                        </span>
                      )}
                    </td>
                    <td className={`${td} tabular-nums`}>{genCounts.get(u.id) ?? 0}</td>
                    <td className={`${td} tabular-nums`}>{voteCounts.get(u.id) ?? 0}</td>
                    <td className={`${td} whitespace-nowrap`}>{formatDate(u.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        basePath="/admin/users"
        page={page}
        total={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </Card>
  );
}
