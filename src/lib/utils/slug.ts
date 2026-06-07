import { customAlphabet } from "nanoid";

const slugAlphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const randomSuffix = customAlphabet(slugAlphabet, 6);

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Generate a unique slug, querying the existence predicate up to N times before
 * appending a short random suffix as a last resort.
 */
export async function generateSlug(
  input: string,
  exists: (slug: string) => Promise<boolean>,
  maxAttempts = 5,
): Promise<string> {
  const base = toSlug(input) || "org";
  let candidate = base;
  for (let i = 0; i < maxAttempts; i++) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${base}-${randomSuffix()}`;
  }
  return `${base}-${randomSuffix()}`;
}
