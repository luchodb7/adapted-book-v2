import { vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

/**
 * Lightweight in-memory Prisma stub. Only models used in integration tests are
 * implemented; calling an unimplemented method throws so tests fail loudly.
 *
 * For deeper coverage, use the official `@prisma/inmemory` adapter when needed.
 */
type AnyRecord = Record<string, unknown> & { id: string };

function makeTable<T extends AnyRecord>() {
  const rows: T[] = [];
  return {
    rows,
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
      rows.find((r) => r.id === where.id) ?? null,
    ),
    findFirst: vi.fn(async ({ where }: { where?: AnyRecord } = {}) => {
      if (!where) return rows[0] ?? null;
      return rows.find((r) => Object.entries(where).every(([k, v]) => r[k] === v)) ?? null;
    }),
    findMany: vi.fn(async ({ where }: { where?: AnyRecord } = {}) => {
      if (!where) return [...rows];
      return rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    }),
    create: vi.fn(async ({ data }: { data: T }) => {
      const created = { ...data } as T;
      rows.push(created);
      return created;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: AnyRecord }) => {
      const idx = rows.findIndex((r) => r.id === where.id);
      if (idx === -1) throw new Error("not found");
      const updated = { ...rows[idx]!, ...data } as T;
      rows[idx] = updated;
      return updated;
    }),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const idx = rows.findIndex((r) => r.id === where.id);
      if (idx === -1) throw new Error("not found");
      const [removed] = rows.splice(idx, 1);
      return removed!;
    }),
    deleteMany: vi.fn(async ({ where }: { where?: AnyRecord } = {}) => {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i--) {
        const r = rows[i]!;
        if (!where || Object.entries(where).every(([k, v]) => r[k] === v)) rows.splice(i, 1);
      }
      return { count: before - rows.length };
    }),
  };
}

export function createMockPrisma() {
  const user = makeTable<AnyRecord>();
  const organization = makeTable<AnyRecord>();
  const membership = makeTable<AnyRecord>();
  const story = makeTable<AnyRecord>();
  const storyPage = makeTable<AnyRecord>();
  const auditLog = makeTable<AnyRecord>();
  const invitation = makeTable<AnyRecord>();
  const promptTemplate = makeTable<AnyRecord>();
  const promptVersion = makeTable<AnyRecord>();
  const promptExecution = makeTable<AnyRecord>();
  const aiGeneration = makeTable<AnyRecord>();

  const $transaction = vi.fn(async (cb: (tx: ReturnType<typeof createMockPrisma>) => Promise<unknown>) =>
    cb(createMockPrisma()),
  );

  return {
    user, organization, membership, story, storyPage, auditLog,
    invitation, promptTemplate, promptVersion, promptExecution, aiGeneration,
    $transaction,
  } as unknown as PrismaClient & {
    $transaction: ReturnType<typeof vi.fn>;
  };
}
