// Config for the simple tables managed under app/admin/[resource]. Each table
// has a uuid `id` plus the text columns listed in `fields`; the list, new and
// edit pages and the Server Actions are all driven from this map.

export type ResourceField = {
  name: string;
  label: string;
  multiline?: boolean;
};

export type Access = "read" | "update" | "crud";

export type Resource = {
  table: string;
  title: string;
  singular: string;
  description: string;
  icon: string;
  access: Access;
  fields: ResourceField[];
};

export const RESOURCES: Record<string, Resource> = {
  "prompt-chains": {
    table: "prompt_chains",
    title: "Prompt chains",
    singular: "prompt chain",
    description: "Prompt chains (read only).",
    icon: "≡",
    access: "read",
    fields: [{ name: "name", label: "Name" }],
  },
  "prompt-chain-steps": {
    table: "prompt_chain_steps",
    title: "Prompt chain steps",
    singular: "prompt chain step",
    description: "Steps used in prompt chains (read only).",
    icon: "↳",
    access: "read",
    fields: [{ name: "name", label: "Name" }],
  },
  "prompt-chain-mix": {
    table: "prompt_chain_mix",
    title: "Prompt chain mix",
    singular: "prompt chain mix entry",
    description: "Prompt chain mix settings. Existing entries can be edited.",
    icon: "⊕",
    access: "update",
    fields: [
      { name: "name", label: "Name" },
      { name: "value", label: "Value", multiline: true },
    ],
  },
  terms: {
    table: "terms",
    title: "Terms",
    singular: "term",
    description: "Humor terms. Create, edit, or delete entries.",
    icon: "¶",
    access: "crud",
    fields: [{ name: "term", label: "Term" }],
  },
  "generation-requests": {
    table: "generation_requests",
    title: "Generation requests",
    singular: "generation request",
    description: "Requests made for AI generations (read only).",
    icon: "⇢",
    access: "read",
    fields: [{ name: "request", label: "Request", multiline: true }],
  },
  "generation-examples": {
    table: "generation_examples",
    title: "Generation examples",
    singular: "generation example",
    description: "Example generations. Create, edit, or delete entries.",
    icon: "❝",
    access: "crud",
    fields: [{ name: "example", label: "Example", multiline: true }],
  },
  "llm-models": {
    table: "llm_models",
    title: "LLM models",
    singular: "LLM model",
    description: "Language models. Create, edit, or delete entries.",
    icon: "◇",
    access: "crud",
    fields: [{ name: "name", label: "Name" }],
  },
  "llm-providers": {
    table: "llm_providers",
    title: "LLM providers",
    singular: "LLM provider",
    description: "Language model providers. Create, edit, or delete entries.",
    icon: "◈",
    access: "crud",
    fields: [{ name: "name", label: "Name" }],
  },
  "llm-responses": {
    table: "llm_responses",
    title: "LLM responses",
    singular: "LLM response",
    description: "Raw responses returned by language models (read only).",
    icon: "↩",
    access: "read",
    fields: [{ name: "response", label: "Response", multiline: true }],
  },
  "allowed-signup-domains": {
    table: "allowed_signup_domains",
    title: "Allowed signup domains",
    singular: "allowed signup domain",
    description: "Email domains allowed to sign up. Create, edit, or delete entries.",
    icon: "@",
    access: "crud",
    fields: [{ name: "domain", label: "Domain" }],
  },
  "whitelisted-emails": {
    table: "whitelisted_emails",
    title: "Whitelisted emails",
    singular: "whitelisted email",
    description: "Individual emails allowed to sign up. Create, edit, or delete entries.",
    icon: "✓",
    access: "crud",
    fields: [{ name: "email", label: "Email" }],
  },
};

// Slugs come from the URL or from Server Action arguments, so only accept
// the map's own keys (never inherited ones like "constructor").
export function getResource(slug: string): Resource | undefined {
  return Object.hasOwn(RESOURCES, slug) ? RESOURCES[slug] : undefined;
}

export function allows(resource: Resource, op: "create" | "update" | "delete") {
  if (op === "update") return resource.access !== "read";
  return resource.access === "crud";
}

export function columnsOf(resource: Resource) {
  return ["id", ...resource.fields.map((f) => f.name)].join(", ");
}

export type ResourceRow = { id: string } & Record<string, string | null>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(id: string) {
  return UUID.test(id);
}
