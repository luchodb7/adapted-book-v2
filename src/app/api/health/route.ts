import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health endpoint for load balancers and uptime monitors.
 *
 * Checks:
 *   - Process is alive (implicit by responding).
 *   - DB reachability via a no-op query.
 *
 * Returns 200 OK with `{ status: "ok", checks: {...} }`, or 503 with the
 * failing check(s) listed.
 */
export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    checks.database = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      uptimeMs: Date.now() - startedAt,
      version: process.env.npm_package_version ?? "0.1.0",
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
