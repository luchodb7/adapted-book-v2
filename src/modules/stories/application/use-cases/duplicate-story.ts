import { z } from "zod";
import { nanoid } from "nanoid";
import type { TenantContext } from "@/shared/tenant/tenant-context";
import { authorize } from "@/shared/auth/authorize";
import { NotFoundError } from "@/core/errors/app-error";
import { assertTenant } from "@/shared/tenant/guards";
import type { StoryRepository } from "@/modules/stories/domain/repositories/story-repository";
import type { AuditLogger } from "@/modules/audit/domain/audit-logger";
import { parseInput } from "@/core/validation/parse";

const inputSchema = z.object({ storyId: z.string() });

export interface DuplicateStoryResult {
  storyId: string;
}

export class DuplicateStoryUseCase {
  constructor(
    private readonly stories: StoryRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(ctx: TenantContext, rawInput: unknown): Promise<DuplicateStoryResult> {
    const { storyId } = parseInput(inputSchema, rawInput);
    authorize(ctx, "stories.duplicate");

    const original = await this.stories.findById(storyId, ctx.organizationId);
    if (!original) throw new NotFoundError("Story", storyId);
    assertTenant(ctx, original.organizationId);

    const newId = `st_${nanoid(20)}`;
    const copy = original.duplicateAs(newId, ctx.userId);
    await this.stories.save(copy);

    await this.audit.log({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "CREATE",
      resource: "Story",
      resourceId: newId,
      metadata: { duplicatedFrom: storyId },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { storyId: newId };
  }
}
