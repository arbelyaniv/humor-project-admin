// Shared types and helpers for admin data. All queries go through the
// Supabase client returned by requireAdmin(), so they run as the admin user.

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_superadmin: boolean | null;
};

export type Generation = {
  id: string;
  user_id: string | null;
  prompt: string | null;
  content: string | null;
  created_at: string;
};

export type Vote = {
  id: string;
  user_id: string | null;
  generation_id: string | null;
  vote: number;
  created_at: string;
};

export type VoteTally = { up: number; down: number };

export const PAGE_SIZE = 25;

// PostgREST caps responses (1000 rows by default), so read in chunks.
const CHUNK = 1000;

type RangeQuery<T> = (
  from: number,
  to: number,
) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function fetchAll<T>(query: RangeQuery<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await query(from, from + CHUNK - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < CHUNK) return rows;
  }
}

export function tallyVotes(
  votes: Pick<Vote, "generation_id" | "vote">[],
): Map<string, VoteTally> {
  const tallies = new Map<string, VoteTally>();
  for (const { generation_id, vote } of votes) {
    if (!generation_id) continue;
    const t = tallies.get(generation_id) ?? { up: 0, down: 0 };
    if (vote > 0) t.up++;
    else if (vote < 0) t.down++;
    tallies.set(generation_id, t);
  }
  return tallies;
}

export function displayName(
  p: Pick<Profile, "first_name" | "last_name"> | null | undefined,
) {
  const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return name || "Unnamed user";
}

export function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "UTC",
  });
}

export function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function parsePage(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function truncate(text: string | null | undefined, max = 120) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
