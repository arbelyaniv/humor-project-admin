"use client";

import { useTransition } from "react";
import { deleteGeneration } from "./actions";

export function DeleteGenerationButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (
      !window.confirm(
        "Delete this generation permanently? This cannot be undone.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteGeneration(id);
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
