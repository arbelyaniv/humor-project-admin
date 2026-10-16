import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import {
  displayName,
  fetchAll,
  formatDate,
  PAGE_SIZE,
  parsePage,
  tallyVotes,
  type Generation,
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
  VoteCounts,
  td,
  th,
} from "@/components/ui";
import { DeleteGenerationButton } from "./delete-button";

export const metadata: Metadata = { title: "Generations · Humor Admin" };

export default function GenerationsPage({
  searchParams,
}: PageProps<"/admin/generations">) {
  return (
    <>
      <PageHeader
        title="Generations"
        description="AI-generated content. Create, edit, or delete entries."
        action={
          <Link
            href="/admin/generations/new"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            + New generation
          </Link>
        }
      />
      <Suspense fallback={<LoadingCard />}>
        <GenerationsTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function GenerationsTable({
  searchParams,
}: {
  searchParams: PageProps<"/admin/generations">["searchParams"];
}) {
  const { supabase } = await requireAdmin();
  const page = parsePage((await searchParams).page);
  const from = (page - 1) * PAGE_SIZE;

  const { data, count, error } = await supabase
    .from("generations")
    .select("id, user_id, prompt, content, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) return <ErrorState message={error.message} />;

  const generations = (data ?? []) as Generation[];
  const genIds = generations.map((g) => g.id);
  const userIds = [
    ...new Set(generations.map((g) => g.user_id).filter((id) => id !== null)),
  ];

  let votes: { generation_id: string | null; vote: number }[] = [];
  let profiles: Profile[] = [];
  try {
    [votes, profiles] = await Promise.all([
      genIds.length
        ? fetchAll((f, t) =>
            supabase
              .from("votes")
              .select("generation_id, vote")
              .in("generation_id", genIds)
              .order("id")
              .range(f, t),
          )
        : [],
      userIds.length
        ? supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .in("id", userIds)
            .then(({ data }) => (data ?? []) as Profile[])
        : [],
    ]);
  } catch (e) {
    return <ErrorState message={(e as Error).message} />;
  }

  const tallies = tallyVotes(votes);
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return (
    <Card className="overflow-hidden">
      {generations.length === 0 ? (
        <EmptyState message="No generations yet. Create the first one." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>Prompt &amp; content</th>
                <th className={th}>Creator</th>
                <th className={th}>Votes</th>
                <th className={th}>Created</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {generations.map((g) => {
                const p = g.user_id ? profileById.get(g.user_id) : undefined;
                const name = p ? displayName(p) : "Unknown user";
                const t = tallies.get(g.id) ?? { up: 0, down: 0 };
                return (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className={`${td} min-w-72 max-w-xl`}>
                      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                        Prompt
                      </p>
                      <p className="mb-2 text-slate-600">{g.prompt || "—"}</p>
                      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                        Content
                      </p>
                      <p className="whitespace-pre-line text-slate-900 line-clamp-4">
                        {g.content || "—"}
                      </p>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <Avatar url={p?.avatar_url} name={name} size={28} />
                        <span className="whitespace-nowrap">{name}</span>
                      </div>
                    </td>
                    <td className={td}>
                      <VoteCounts up={t.up} down={t.down} />
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {formatDate(g.created_at, true)}
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/generations/${g.id}/edit`}
                          className="rounded-md px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          Edit
                        </Link>
                        <DeleteGenerationButton id={g.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        basePath="/admin/generations"
        page={page}
        total={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </Card>
  );
}
