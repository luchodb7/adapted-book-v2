import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { ValidationError } from "@/core/errors/app-error";

/**
 * Parse + validate untrusted input with a Zod schema, throwing a domain-shaped
 * ValidationError on failure (never raw ZodError leaking out of the app layer).
 */
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "_";
      (fieldErrors[path] ??= []).push(issue.message);
    }
    throw new ValidationError("Invalid input", { fieldErrors });
  }
  return result.data;
}

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

/**
 * Strict text sanitiser: strips ALL HTML, collapses whitespace.
 * Use for fields meant to be plain text (titles, page text, etc.).
 */
export function sanitizeText(input: string, maxLength = 10_000): string {
  const stripped = input.replace(/<[^>]*>/g, "");
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, maxLength);
}

export const idSchema = z.string().min(1).max(128);
export const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, dashes only");
