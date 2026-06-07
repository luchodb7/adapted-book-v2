/**
 * Built-in prompt templates.
 *
 * Stored in code so they ship deterministically; the database `PromptTemplate`
 * / `PromptVersion` tables let an organization override or A/B-test versions
 * at runtime without redeploying.
 */

import type { TenantContext } from "@/shared/tenant/tenant-context";

export interface PromptVariable {
  key: string;
  required: boolean;
  default?: string;
  description?: string;
}

export interface PromptTemplateDefinition {
  key: string;
  name: string;
  category: "story" | "adaptation" | "simplification" | "pictogram" | "routine" | "comprehension";
  systemPrompt: string;
  userPrompt: string;
  variables: PromptVariable[];
  defaultModel?: string;
  defaultTemperature?: number;
}

export const BUILT_IN_PROMPTS: readonly PromptTemplateDefinition[] = [
  {
    key: "social-story.generate",
    name: "Generate Social Story",
    category: "story",
    systemPrompt: `You are an expert in special education and Augmentative & Alternative Communication (AAC).
You write social stories following Carol Gray's guidelines: short, descriptive, perspective-oriented,
present tense, first person, positive framing. Each sentence must stand alone on a page paired with a
single pictogram-friendly keyword.`,
    userPrompt: `Create a social story in {{language}} for {{name}} (age {{age}}).
Situation: {{situation}}
Context: {{context}}
Objective: {{objective}}
Cognitive level: {{cognitiveLevel}}
Reading level: {{readingLevel}}
Number of pages: {{numberOfPages}}

Return JSON: { "title": string, "description": string, "pages": [{ "text": string, "pictogramKeyword": string }] }`,
    variables: [
      { key: "language", required: true, default: "en" },
      { key: "name", required: false, default: "the child" },
      { key: "age", required: false, default: "8" },
      { key: "situation", required: true },
      { key: "context", required: false, default: "" },
      { key: "objective", required: false, default: "" },
      { key: "cognitiveLevel", required: false, default: "medium" },
      { key: "readingLevel", required: false, default: "beginner" },
      { key: "numberOfPages", required: false, default: "6" },
    ],
    defaultTemperature: 0.6,
  },
  {
    key: "text.adapt",
    name: "Adapt text for accessibility",
    category: "adaptation",
    systemPrompt: `You adapt texts for people with cognitive disabilities. Keep meaning, shorten sentences,
use everyday vocabulary, active voice, present tense, one idea per sentence.`,
    userPrompt: `Adapt the following text in {{language}}:\n\n{{text}}\n\nReturn the adapted text only.`,
    variables: [
      { key: "language", required: true, default: "en" },
      { key: "text", required: true },
    ],
    defaultTemperature: 0.3,
  },
  {
    key: "text.simplify",
    name: "Simplify text (Easy Read)",
    category: "simplification",
    systemPrompt: `You write in Easy-to-Read style. Sentences under 15 words, common words only, no idioms,
no metaphors, no abbreviations, no jargon.`,
    userPrompt: `Simplify the following text in {{language}} to "{{level}}" level:\n\n{{text}}`,
    variables: [
      { key: "language", required: true, default: "en" },
      { key: "text", required: true },
      { key: "level", required: false, default: "easy" },
    ],
    defaultTemperature: 0.2,
  },
];

/**
 * Render a prompt template by substituting `{{var}}` placeholders.
 * Unknown variables are kept as-is (so unfilled placeholders surface visibly).
 */
export function renderPrompt(
  template: PromptTemplateDefinition,
  values: Record<string, string | number | undefined>,
): { system: string; user: string; rendered: string } {
  const fill = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const v = values[key];
      if (v !== undefined && v !== "") return String(v);
      const def = template.variables.find((x) => x.key === key)?.default;
      return def ?? `{{${key}}}`;
    });

  const system = fill(template.systemPrompt);
  const user = fill(template.userPrompt);
  return { system, user, rendered: `[SYSTEM]\n${system}\n\n[USER]\n${user}` };
}

/**
 * Helper to compose a prompt audit record for `PromptExecution`.
 */
export function buildExecutionRecord(
  template: PromptTemplateDefinition,
  values: Record<string, string | number | undefined>,
  _ctx?: TenantContext,
): { variables: Record<string, unknown>; renderedPrompt: string } {
  const { rendered } = renderPrompt(template, values);
  return { variables: values, renderedPrompt: rendered };
}
