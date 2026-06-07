import { PrismaClient } from "@prisma/client";
import { env, isProduction } from "@/core/types/env";

/**
 * Singleton PrismaClient.
 *
 * In dev (`hot-reload`) Next.js can instantiate many clients which exhausts the
 * connection pool. We pin it on `globalThis` to avoid this.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: isProduction ? ["error"] : ["error", "warn"],
    datasources: {
      db: { url: env.DATABASE_URL },
    },
  });

if (!isProduction) {
  globalThis.__prisma = prisma;
}
