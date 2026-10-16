import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { createGeneration } from "../actions";
import { GenerationForm } from "../generation-form";

export const metadata: Metadata = { title: "New generation · Humor Admin" };

// The form is static UI; createGeneration verifies superadmin access on submit,
// and proxy.ts already blocks non-admins from loading this route.
export default function NewGenerationPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New generation"
        description="The generation will be attributed to your account."
      />
      <Card>
        <GenerationForm action={createGeneration} submitLabel="Create generation" />
      </Card>
    </div>
  );
}
