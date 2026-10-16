"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LENGTH = 10_000;

// Server Actions are public HTTP endpoints, so each one re-checks
// superadmin status itself instead of trusting the page that rendered the form.

function readFields(formData: FormData) {
  const prompt = String(formData.get("prompt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!prompt || !content) return { error: "Prompt and content are both required." };
  if (prompt.length > MAX_LENGTH || content.length > MAX_LENGTH) {
    return { error: `Fields must be under ${MAX_LENGTH.toLocaleString()} characters.` };
  }
  return { prompt, content };
}

const RLS_HINT =
  "No rows were changed. Your Supabase RLS policies may not allow superadmins to modify generations (see supabase/admin-policies.sql).";

export async function createGeneration(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, admin } = await requireAdmin();
  const fields = readFields(formData);
  if ("error" in fields) return fields;

  const { data, error } = await supabase
    .from("generations")
    .insert({ ...fields, user_id: admin.id })
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: RLS_HINT };

  revalidatePath("/admin", "layout");
  redirect("/admin/generations");
}

export async function updateGeneration(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!UUID.test(id)) return { error: "Invalid generation id." };
  const fields = readFields(formData);
  if ("error" in fields) return fields;

  const { data, error } = await supabase
    .from("generations")
    .update(fields)
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: RLS_HINT };

  revalidatePath("/admin", "layout");
  redirect("/admin/generations");
}

export async function deleteGeneration(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!UUID.test(id)) return { error: "Invalid generation id." };

  const { data, error } = await supabase
    .from("generations")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: RLS_HINT };

  revalidatePath("/admin", "layout");
}
