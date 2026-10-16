import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/data";
import { Card, ErrorState, LoadingCard, PageHeader } from "@/components/ui";
import { updateGeneration } from "../../actions";
import { GenerationForm } from "../../generation-form";

export const metadata: Metadata = { title: "Edit generation · Humor Admin" };

export default function EditGenerationPage({
  params,
}: PageProps<"/admin/generations/[id]/edit">) {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Edit generation" />
      <Suspense fallback={<LoadingCard rows={3} />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditForm({
  params,
}: {
  params: PageProps<"/admin/generations/[id]/edit">["params"];
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const { data, error } = await supabase
    .from("generations")
    .select("id, prompt, content, created_at")
    .eq("id", id)
    .maybeSingle();

  // An invalid uuid surfaces as a Postgres cast error; treat it as not found.
  if (error?.code === "22P02") notFound();
  if (error) return <ErrorState message={error.message} />;
  if (!data) notFound();

  return (
    <Card>
      <p className="border-b border-slate-200 px-5 py-3 text-xs text-slate-500 sm:px-6">
        Created {formatDate(data.created_at, true)} · ID{" "}
        <span className="font-mono">{data.id}</span>
      </p>
      <GenerationForm
        action={updateGeneration.bind(null, data.id)}
        defaultValues={{ prompt: data.prompt ?? "", content: data.content ?? "" }}
        submitLabel="Save changes"
      />
    </Card>
  );
}
