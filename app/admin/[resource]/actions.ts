"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { allows, getResource, isUuid, type Resource } from "@/lib/resources";
import type { FormState } from "../generations/actions";

const MAX_LENGTH = 10_000;

const RLS_HINT =
  "No rows were changed. Your Supabase RLS policies may not allow superadmins to modify this table.";

// Server Actions are public HTTP endpoints, so each one re-checks superadmin
// status itself, and the slug and id (which arrive from the client) are
// validated against lib/resources.ts before any query runs.

function resolve(slug: string, op: "create" | "update" | "delete") {
  const resource = getResource(slug);
  return resource && allows(resource, op) ? resource : undefined;
}

function readFields(resource: Resource, formData: FormData) {
  const values: Record<string, string> = {};
  for (const { name, label } of resource.fields) {
    const value = String(formData.get(name) ?? "").trim();
    if (!value) return { error: `${label} is required.` };
    if (value.length > MAX_LENGTH) {
      return { error: `${label} must be under ${MAX_LENGTH.toLocaleString()} characters.` };
    }
    values[name] = value;
  }
  return { values };
}

export async function createRow(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const resource = resolve(slug, "create");
  if (!resource) return { error: "Rows cannot be created in this table." };
  const fields = readFields(resource, formData);
  if ("error" in fields) return fields;

  const { data, error } = await supabase
    .from(resource.table)
    .insert(fields.values)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: RLS_HINT };

  revalidatePath(`/admin/${slug}`, "layout");
  redirect(`/admin/${slug}`);
}

export async function updateRow(
  slug: string,
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const resource = resolve(slug, "update");
  if (!resource) return { error: "Rows in this table cannot be edited." };
  if (!isUuid(id)) return { error: "Invalid id." };
  const fields = readFields(resource, formData);
  if ("error" in fields) return fields;

  const { data, error } = await supabase
    .from(resource.table)
    .update(fields.values)
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: RLS_HINT };

  revalidatePath(`/admin/${slug}`, "layout");
  redirect(`/admin/${slug}`);
}

export async function deleteRow(slug: string, id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const resource = resolve(slug, "delete");
  if (!resource) return { error: "Rows in this table cannot be deleted." };
  if (!isUuid(id)) return { error: "Invalid id." };

  const { data, error } = await supabase
    .from(resource.table)
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: RLS_HINT };

  revalidatePath(`/admin/${slug}`, "layout");
}
