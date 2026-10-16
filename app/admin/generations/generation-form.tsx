"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "./actions";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: { prompt: string; content: string };
  submitLabel: string;
};

export function GenerationForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const input =
    "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none";

  return (
    <form action={formAction} className="space-y-5 p-5 sm:p-6">
      {state?.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Prompt</span>
        <textarea
          name="prompt"
          required
          rows={3}
          defaultValue={defaultValues?.prompt}
          className={input}
          placeholder="e.g. Write a joke about a cat who learns to code"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Generated content
        </span>
        <textarea
          name="content"
          required
          rows={8}
          defaultValue={defaultValues?.content}
          className={input}
        />
      </label>
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/generations"
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
