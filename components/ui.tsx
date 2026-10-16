import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Avatar({
  url,
  name,
  size = 32,
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external avatar hosts vary
      <img
        src={url}
        alt=""
        style={style}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full bg-slate-200 object-cover"
      />
    );
  }
  return (
    <span
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
    >
      {name.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export function VoteBadge({ value }: { value: number }) {
  return value > 0 ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
      ▲ Upvote
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-600/20">
      ▼ Downvote
    </span>
  );
}

export function VoteCounts({ up, down }: { up: number; down: number }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium whitespace-nowrap">
      <span className="text-emerald-700" title="Upvotes">
        ▲ {up}
      </span>
      <span className="text-rose-700" title="Downvotes">
        ▼ {down}
      </span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p className="font-medium">Could not load data</p>
      <p className="mt-1">{message}</p>
    </Card>
  );
}

export function Pagination({
  basePath,
  page,
  total,
  pageSize,
}: {
  basePath: string;
  page: number;
  total: number;
  pageSize: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const link =
    "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
  const disabled =
    "rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-300";
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
      <p className="text-sm text-slate-500">
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={`${basePath}?page=${page - 1}`} className={link}>
            Previous
          </Link>
        ) : (
          <span className={disabled}>Previous</span>
        )}
        {page < pages ? (
          <Link href={`${basePath}?page=${page + 1}`} className={link}>
            Next
          </Link>
        ) : (
          <span className={disabled}>Next</span>
        )}
      </div>
    </div>
  );
}

export function LoadingCard({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 flex-1 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </Card>
  );
}

export const th =
  "px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase";
export const td = "px-4 py-3 align-top text-sm text-slate-700";
