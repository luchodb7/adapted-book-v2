import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authorize } from "@/shared/tenant/guards";
import { getContainer } from "@/core/di/composition-root";
import { PictogramServiceToken } from "@/core/di/tokens";
import { toAppError } from "@/core/errors/app-error";
import { rateLimit } from "@/lib/rate-limit/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().min(1).max(80),
  language: z.string().min(2).max(8).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const ctx = await authorize("VIEWER");
    const limit = await rateLimit({ key: `pictogram-search:${ctx.organizationId}`, kind: "default" });
    if (!limit.allowed) {
      return NextResponse.json({ code: "RATE_LIMITED", message: "Too many requests" }, { status: 429 });
    }

    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ code: "VALIDATION_ERROR", message: "Invalid query" }, { status: 422 });
    }

    const service = getContainer().resolve(PictogramServiceToken);
    const results = await service.search(parsed.data.q, {
      language: parsed.data.language ?? ctx.locale,
      bestSearch: true,
      limit: parsed.data.limit,
    });

    return NextResponse.json(
      {
        items: results.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          keywords: p.keywords.map((k) => k.keyword),
        })),
      },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (error) {
    const app = toAppError(error);
    return NextResponse.json(app.toJSON(), { status: app.status });
  }
}
