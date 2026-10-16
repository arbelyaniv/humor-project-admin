import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import {
  displayName,
  formatDate,
  PAGE_SIZE,
  parsePage,
  truncate,
  type Generation,
  type Profile,
  type Vote,
} from "@/lib/data";
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  LoadingCard,
  PageHeader,
  Pagination,
  VoteBadge,
  td,
  th,
} from "@/components/ui";

export const metadata: Metadata = { title: "Votes · Humor Admin" };

export default function VotesPage({ searchParams }: PageProps<"/admin/votes">) {
  return (
    <>
      <PageHeader
        title="Votes"
        description="Every upvote and downvote cast on generations (read only)."
      />
      <Suspense fallback={<LoadingCard />}>
        <VotesTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function VotesTable({
  searchParams,
}: {
  searchParams: PageProps<"/admin/votes">["searchParams"];
}) {
  const { supabase } = await requireAdmin();
  const page = parsePage((await searchParams).page);
  const from = (page - 1) * PAGE_SIZE;

  const { data, count, error } = await supabase
    .from("votes")
    .select("id, user_id, generation_id, vote, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) return <ErrorState message={error.message} />;

  const votes = (data ?? []) as Vote[];
  const unique = (ids: (string | null)[]) =>
    [...new Set(ids)].filter((id) => id !== null);
  const genIds = unique(votes.map((v) => v.generation_id));
  const userIds = unique(votes.map((v) => v.user_id));

  const [gens, users] = await Promise.all([
    genIds.length
      ? supabase.from("generations").select("id, prompt, content").in("id", genIds)
      : { data: [] },
    userIds.length
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds)
      : { data: [] },
  ]);
  const genById = new Map(
    ((gens.data ?? []) as Pick<Generation, "id" | "prompt" | "content">[]).map(
      (g) => [g.id, g],
    ),
  );
  const userById = new Map(
    ((users.data ?? []) as Profile[]).map((u) => [u.id, u]),
  );

  return (
    <Card className="overflow-hidden">
      {votes.length === 0 ? (
        <EmptyState message="No votes yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>Vote</th>
                <th className={th}>Generation</th>
                <th className={th}>Voter</th>
                <th className={th}>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {votes.map((v) => {
                const g = v.generation_id ? genById.get(v.generation_id) : undefined;
                const u = v.user_id ? userById.get(v.user_id) : undefined;
                const name = u ? displayName(u) : "Unknown user";
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className={td}>
                      <VoteBadge value={v.vote} />
                    </td>
                    <td className={`${td} min-w-64 max-w-lg`}>
                      {g ? (
                        <>
                          <p className="text-slate-900">{truncate(g.content, 140)}</p>
                          {g.prompt && (
                            <p className="mt-1 truncate text-xs text-slate-500">
                              Prompt: {g.prompt}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 italic">
                          Generation unavailable
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <Avatar url={u?.avatar_url} name={name} size={28} />
                        <span className="whitespace-nowrap">{name}</span>
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {formatDate(v.created_at, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        basePath="/admin/votes"
        page={page}
        total={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </Card>
  );
}
