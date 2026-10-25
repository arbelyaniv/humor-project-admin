"use client";

import { useTransition } from "react";
import type { FormState } from "../generations/actions";

// `action` is deleteRow bound to a slug and id on the server.
export function DeleteRowButton({
  action,
  label,
}: {
  action: () => Promise<FormState>;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(`Delete this ${label} permanently? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const result = await action();
      if (result?.error) window.alert(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="rounded-md px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
