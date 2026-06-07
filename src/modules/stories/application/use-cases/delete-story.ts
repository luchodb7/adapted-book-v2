import { z } from "zod";
import type { TenantContext } from "@/shared/tenant/tenant-context";
import { authorize } from "@/shared/auth/authorize";
import { NotFoundError } from "@/core/errors/app-error";
import { assertTenant } from "@/shared/tenant/guards";
import type { StoryRepository } from "@/modules/stories/domain/repositories/story-repository";
import type { AuditLogger } from "@/modules/audit/domain/audit-logger";
import { parseInput } from "@/core/validation/parse";

const inputSchema = z.object({ storyId: z.string() });

export class DeleteStoryUseCase {
  constructor(
    private readonly stories: StoryRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(ctx: TenantContext, rawInput: unknown): Promise<void> {
    const { storyId } = parseInput(inputSchema, rawInput);
    authorize(ctx, "stories.delete");

    const story = await this.stories.findById(storyId, ctx.organizationId);
    if (!story) throw new NotFoundError("Story", storyId);
    assertTenant(ctx, story.organizationId);

    story.softDelete();
    await this.stories.save(story);

    await this.audit.log({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "DELETE",
      resource: "Story",
      resourceId: storyId,
      metadata: { title: story.title },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }
}
