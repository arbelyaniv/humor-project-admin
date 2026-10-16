import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import {
  displayName,
  daysAgoISO,
  fetchAll,
  tallyVotes,
  truncate,
  type Generation,
  type Profile,
} from "@/lib/data";
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  VoteCounts,
} from "@/components/ui";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of users, generated content and voting activity."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const { supabase } = await requireAdmin();

  const weekAgo = daysAgoISO(7);
  const count = { count: "exact" as const, head: true };

  const [users, admins, gens, gensThisWeek, votes, ups, downs] =
    await Promise.all([
      supabase.from("profiles").select("*", count),
      supabase.from("profiles").select("*", count).eq("is_superadmin", true),
      supabase.from("generations").select("*", count),
      supabase.from("generations").select("*", count).gte("created_at", weekAgo),
      supabase.from("votes").select("*", count),
      supabase.from("votes").select("*", count).gt("vote", 0),
      supabase.from("votes").select("*", count).lt("vote", 0),
    ]);

  const firstError = [users, admins, gens, gensThisWeek, votes, ups, downs]
    .map((r) => r.error)
    .find(Boolean);
  if (firstError) return <ErrorState message={firstError.message} />;

  let allVotes: { generation_id: string | null; vote: number }[];
  let allGens: { id: string; user_id: string | null }[];
  try {
    [allVotes, allGens] = await Promise.all([
      fetchAll((from, to) =>
        supabase
          .from("votes")
          .select("generation_id, vote")
          .order("id")
          .range(from, to),
      ),
      fetchAll((from, to) =>
        supabase.from("generations").select("id, user_id").order("id").range(from, to),
      ),
    ]);
  } catch (e) {
    return <ErrorState message={(e as Error).message} />;
  }

  const upCount = ups.count ?? 0;
  const downCount = downs.count ?? 0;
  const totalVotes = votes.count ?? 0;
  const upPct = upCount + downCount ? (upCount / (upCount + downCount)) * 100 : 0;

  // Top generations by upvotes (ties broken by net score).
  const tallies = tallyVotes(allVotes);
  const topIds = [...tallies.entries()]
    .sort(
      ([, a], [, b]) => b.up - a.up || b.up - b.down - (a.up - a.down),
    )
    .slice(0, 5)
    .map(([id]) => id);

  // Most active creators by number of generations.
  const perUser = new Map<string, number>();
  for (const g of allGens) {
    if (g.user_id) perUser.set(g.user_id, (perUser.get(g.user_id) ?? 0) + 1);
  }
  const topCreators = [...perUser.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const [topGensRes, creatorsRes] = await Promise.all([
    topIds.length
      ? supabase
          .from("generations")
          .select("id, user_id, prompt, content, created_at")
          .in("id", topIds)
      : Promise.resolve({ data: [] as Generation[], error: null }),
    topCreators.length
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", topCreators.map(([id]) => id))
      : Promise.resolve({ data: [] as Profile[], error: null }),
  ]);

  const genById = new Map(
    (topGensRes.data ?? []).map((g) => [g.id, g as Generation]),
  );
  const profileById = new Map(
    (creatorsRes.data ?? []).map((p) => [p.id, p as Profile]),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total users" value={users.count ?? 0} hint={`${admins.count ?? 0} superadmin(s)`} />
        <Stat label="Generations" value={gens.count ?? 0} hint={`${gensThisWeek.count ?? 0} in last 7 days`} />
        <Stat label="Total votes" value={totalVotes} />
        <Stat label="Upvotes" value={upCount} accent="text-emerald-700" />
        <Stat label="Downvotes" value={downCount} accent="text-rose-700" />
        <Stat
          label="Upvote rate"
          value={`${upPct.toFixed(1)}%`}
          hint={
            gens.count
              ? `${(totalVotes / gens.count).toFixed(1)} votes / generation`
              : undefined
          }
        />
      </div>

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-900">Vote split</span>
          <span className="text-slate-500">
            {upCount} up · {downCount} down
          </span>
        </div>
        <div
          className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`${upPct.toFixed(1)}% upvotes, ${(100 - upPct).toFixed(1)}% downvotes`}
        >
          {upCount > 0 && (
            <div className="bg-emerald-500" style={{ width: `${upPct}%` }} />
          )}
          {downCount > 0 && <div className="flex-1 bg-rose-500" />}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Most upvoted generations</h2>
          </div>
          {topIds.length === 0 ? (
            <EmptyState message="No votes yet." />
          ) : (
            <ol className="divide-y divide-slate-100">
              {topIds.map((id, i) => {
                const g = genById.get(id);
                const t = tallies.get(id)!;
                return (
                  <li key={id} className="flex gap-4 px-5 py-4">
                    <span className="mt-0.5 w-5 text-sm font-semibold text-slate-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">
                        {g ? truncate(g.content, 140) : "Deleted generation"}
                      </p>
                      {g?.prompt && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          Prompt: {g.prompt}
                        </p>
                      )}
                    </div>
                    <VoteCounts up={t.up} down={t.down} />
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Most active creators</h2>
          </div>
          {topCreators.length === 0 ? (
            <EmptyState message="No generations yet." />
          ) : (
            <ol className="divide-y divide-slate-100">
              {topCreators.map(([id, n]) => {
                const p = profileById.get(id);
                const name = p ? displayName(p) : "Unknown user";
                return (
                  <li key={id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar url={p?.avatar_url} name={name} />
                    <span className="flex-1 truncate text-sm text-slate-900">
                      {name}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      {n} generation{n === 1 ? "" : "s"}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="border-t border-slate-200 px-5 py-3 text-right">
            <Link
              href="/admin/generations"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all generations →
            </Link>
          </div>
        </Card>
      </div>

    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent = "text-slate-900",
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight tabular-nums ${accent}`}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="h-28 animate-pulse bg-slate-100" />
      ))}
    </div>
  );
}
