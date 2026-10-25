import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { PAGE_SIZE, parsePage } from "@/lib/data";
import {
  allows,
  columnsOf,
  getResource,
  RESOURCES,
  type Resource,
  type ResourceRow,
} from "@/lib/resources";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingCard,
  PageHeader,
  Pagination,
  td,
  th,
} from "@/components/ui";
import { deleteRow } from "./actions";
import { DeleteRowButton } from "./delete-button";

// Static routes (users, generations, votes) take precedence over this segment.
export function generateStaticParams() {
  return Object.keys(RESOURCES).map((resource) => ({ resource }));
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/[resource]">): Promise<Metadata> {
  const resource = getResource((await params).resource);
  return { title: `${resource?.title ?? "Not found"} · Humor Admin` };
}

export default async function ResourcePage({
  params,
  searchParams,
}: PageProps<"/admin/[resource]">) {
  const { resource: slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  return (
    <>
      <PageHeader
        title={resource.title}
        description={resource.description}
        action={
          allows(resource, "create") && (
            <Link
              href={`/admin/${slug}/new`}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              + New {resource.singular}
            </Link>
          )
        }
      />
      <Suspense fallback={<LoadingCard />}>
        <ResourceTable slug={slug} resource={resource} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ResourceTable({
  slug,
  resource,
  searchParams,
}: {
  slug: string;
  resource: Resource;
  searchParams: PageProps<"/admin/[resource]">["searchParams"];
}) {
  const { supabase } = await requireAdmin();
  const page = parsePage((await searchParams).page);
  const from = (page - 1) * PAGE_SIZE;

  // These tables have no timestamp column, so order by id for stable paging.
  const { data, count, error } = await supabase
    .from(resource.table)
    .select(columnsOf(resource), { count: "exact" })
    .order("id")
    .range(from, from + PAGE_SIZE - 1);
  if (error) return <ErrorState message={error.message} />;

  const rows = (data ?? []) as unknown as ResourceRow[];
  const canUpdate = allows(resource, "update");
  const canDelete = allows(resource, "delete");

  return (
    <Card className="overflow-hidden">
      {rows.length === 0 ? (
        <EmptyState
          message={
            allows(resource, "create")
              ? "This table is empty. Create the first entry."
              : "This table is empty."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>ID</th>
                {resource.fields.map((f) => (
                  <th key={f.name} className={th}>
                    {f.label}
                  </th>
                ))}
                {(canUpdate || canDelete) && (
                  <th className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className={`${td} font-mono text-xs whitespace-nowrap text-slate-400`}>
                    {String(row.id).slice(0, 8)}…
                  </td>
                  {resource.fields.map((f) => (
                    <td
                      key={f.name}
                      className={`${td} ${f.multiline ? "min-w-72 max-w-xl" : ""}`}
                    >
                      <p className="whitespace-pre-line text-slate-900 line-clamp-4">
                        {row[f.name] || "—"}
                      </p>
                    </td>
                  ))}
                  {(canUpdate || canDelete) && (
                    <td className={`${td} text-right`}>
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Link
                            href={`/admin/${slug}/${row.id}/edit`}
                            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                          >
                            Edit
                          </Link>
                        )}
                        {canDelete && (
                          <DeleteRowButton
                            action={deleteRow.bind(null, slug, row.id)}
                            label={resource.singular}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        basePath={`/admin/${slug}`}
        page={page}
        total={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </Card>
  );
}
