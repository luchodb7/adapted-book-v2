import { nanoid } from "nanoid";

let counter = 0;

export function unique(prefix: string): string {
  counter += 1;
  return `${prefix}_${nanoid(6)}_${counter}`;
}

export function makeOrg(overrides: Partial<{ id: string; name: string; slug: string; status: string }> = {}) {
  return {
    id: overrides.id ?? unique("org"),
    name: overrides.name ?? "Acme Ed.",
    slug: overrides.slug ?? `acme-${counter}`,
    status: overrides.status ?? "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function makeUser(overrides: Partial<{ id: string; email: string; name: string; emailVerified: Date | null }> = {}) {
  return {
    id: overrides.id ?? unique("usr"),
    email: overrides.email ?? `u${counter}@x.io`,
    name: overrides.name ?? "User",
    emailVerified: overrides.emailVerified ?? new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function makeMembership(
  userId: string,
  organizationId: string,
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" = "OWNER",
) {
  return {
    id: unique("mem"),
    userId,
    organizationId,
    role,
    status: "ACTIVE" as const,
    joinedAt: new Date(),
    updatedAt: new Date(),
  };
}

export function makeStory(organizationId: string, createdById: string, overrides: Partial<{ id: string; title: string; status: string }> = {}) {
  return {
    id: overrides.id ?? unique("st"),
    organizationId,
    createdById,
    title: overrides.title ?? "Untitled",
    originalText: "",
    adaptedText: null,
    status: overrides.status ?? "DRAFT",
    language: "en",
    targetAge: null,
    visibility: "PRIVATE",
    version: 1,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
  };
}
