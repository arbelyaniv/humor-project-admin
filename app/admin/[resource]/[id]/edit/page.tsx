import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import {
  allows,
  columnsOf,
  getResource,
  isUuid,
  type ResourceRow,
} from "@/lib/resources";
import { Card, ErrorState, LoadingCard, PageHeader } from "@/components/ui";
import { updateRow } from "../../actions";
import { ResourceForm } from "../../resource-form";

export const metadata: Metadata = { title: "Edit · Humor Admin" };

export default function EditResourcePage({
  params,
}: PageProps<"/admin/[resource]/[id]/edit">) {
  return (
    <div className="max-w-3xl">
      <Suspense fallback={<LoadingCard rows={3} />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditForm({
  params,
}: {
  params: PageProps<"/admin/[resource]/[id]/edit">["params"];
}) {
  const { supabase } = await requireAdmin();
  const { resource: slug, id } = await params;
  const resource = getResource(slug);
  if (!resource || !allows(resource, "update") || !isUuid(id)) notFound();

  const { data, error } = await supabase
    .from(resource.table)
    .select(columnsOf(resource))
    .eq("id", id)
    .maybeSingle();
  if (error) return <ErrorState message={error.message} />;
  if (!data) notFound();

  const row = data as unknown as ResourceRow;
  const defaultValues = Object.fromEntries(
    resource.fields.map((f) => [f.name, row[f.name] ?? ""]),
  );

  return (
    <>
      <PageHeader title={`Edit ${resource.singular}`} />
      <Card>
        <p className="border-b border-slate-200 px-5 py-3 text-xs text-slate-500 sm:px-6">
          ID <span className="font-mono">{row.id}</span>
        </p>
        <ResourceForm
          action={updateRow.bind(null, slug, row.id)}
          fields={resource.fields}
          defaultValues={defaultValues}
          cancelHref={`/admin/${slug}`}
          submitLabel="Save changes"
        />
      </Card>
    </>
  );
}
