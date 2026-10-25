import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { allows, getResource, RESOURCES, type Resource } from "@/lib/resources";
import { Card, LoadingCard, PageHeader } from "@/components/ui";
import { createRow } from "../actions";
import { ResourceForm } from "../resource-form";

export function generateStaticParams() {
  return Object.entries(RESOURCES)
    .filter(([, r]) => allows(r, "create"))
    .map(([resource]) => ({ resource }));
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/[resource]/new">): Promise<Metadata> {
  const resource = getResource((await params).resource);
  return { title: `New ${resource?.singular ?? "entry"} · Humor Admin` };
}

export default async function NewResourcePage({
  params,
}: PageProps<"/admin/[resource]/new">) {
  const { resource: slug } = await params;
  const resource = getResource(slug);
  if (!resource || !allows(resource, "create")) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader title={`New ${resource.singular}`} />
      <Suspense fallback={<LoadingCard rows={2} />}>
        <NewForm slug={slug} resource={resource} />
      </Suspense>
    </div>
  );
}

// createRow re-checks superadmin access on submit; this check keeps the form
// itself behind the same gate as every other admin page.
async function NewForm({ slug, resource }: { slug: string; resource: Resource }) {
  await requireAdmin();
  return (
    <Card>
      <ResourceForm
        action={createRow.bind(null, slug)}
        fields={resource.fields}
        cancelHref={`/admin/${slug}`}
        submitLabel={`Create ${resource.singular}`}
      />
    </Card>
  );
}
