import { z } from "zod";
import type { TenantContext } from "@/shared/tenant/tenant-context";
import { authorize } from "@/shared/auth/authorize";
import { NotFoundError } from "@/core/errors/app-error";
import { assertTenant } from "@/shared/tenant/guards";
import type { StoryRepository } from "@/modules/stories/domain/repositories/story-repository";
import type { Story } from "@/modules/stories/domain/entities/story";
import { parseInput } from "@/core/validation/parse";

const inputSchema = z.object({ storyId: z.string() });

export class GetStoryUseCase {
  constructor(private readonly stories: StoryRepository) {}

  async execute(ctx: TenantContext, rawInput: unknown): Promise<Story> {
    authorize(ctx, "stories.view");
    const { storyId } = parseInput(inputSchema, rawInput);
    const story = await this.stories.findById(storyId, ctx.organizationId);
    if (!story) throw new NotFoundError("Story", storyId);
    assertTenant(ctx, story.organizationId);
    return story;
  }
}
