import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/shared/tenant/guards";
import { getContainer } from "@/core/di/composition-root";
import {
  AuditLoggerToken,
  StoryExportServiceToken,
  StoryRepositoryToken,
} from "@/core/di/tokens";
import { NotFoundError, toAppError } from "@/core/errors/app-error";
import { rateLimit } from "@/lib/rate-limit/rate-limit";
import { logger } from "@/core/logger/logger";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  format: z
    .enum(["pdf-a4-portrait", "pdf-a4-landscape", "png-zip", "pages-zip"])
    .default("pdf-a4-portrait"),
  highContrast: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
  fontSize: z.coerce.number().int().min(10).max(48).optional(),
});

const log = logger.child({ component: "export.route" });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await authorize("VIEWER");

    const limit = await rateLimit({
      key: `export:${ctx.organizationId}:${ctx.userId}`,
      kind: "export",
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many export requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
      );
    }

    const { id } = await params;
    const parsedQuery = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsedQuery.success) {
      return NextResponse.json({ code: "VALIDATION_ERROR", message: "Invalid query" }, { status: 422 });
    }

    const c = getContainer();
    const stories = c.resolve(StoryRepositoryToken);
    const exportService = c.resolve(StoryExportServiceToken);
    const audit = c.resolve(AuditLoggerToken);

    const story = await stories.findById(id, ctx.organizationId);
    if (!story) throw new NotFoundError("Story", id);

    const artifact = await exportService.export(story, parsedQuery.data);

    await audit.log({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "EXPORT",
      resource: "Story",
      resourceId: story.id,
      metadata: { format: parsedQuery.data.format, sizeBytes: artifact.bytes.length },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return new NextResponse(new Uint8Array(artifact.bytes), {
      status: 200,
      headers: {
        "Content-Type": artifact.mimeType,
        "Content-Length": String(artifact.bytes.length),
        "Content-Disposition": `attachment; filename="${artifact.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const app = toAppError(error);
    log.error({ err: error }, "export.route.failed");
    return NextResponse.json(app.toJSON(), { status: app.status });
  }
}
