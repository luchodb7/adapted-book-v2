import { z } from "zod";
import type { TenantContext } from "@/shared/tenant/tenant-context";
import { authorize } from "@/shared/auth/authorize";
import type { ListStoriesResult, StoryRepository } from "@/modules/stories/domain/repositories/story-repository";
import { parseInput } from "@/core/validation/parse";

export const listStoriesInputSchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  tags: z.array(z.string()).max(10).optional(),
  createdById: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(24),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type ListStoriesInput = z.infer<typeof listStoriesInputSchema>;

export class ListStoriesUseCase {
  constructor(private readonly stories: StoryRepository) {}

  async execute(ctx: TenantContext, rawInput: unknown): Promise<ListStoriesResult> {
    authorize(ctx, "stories.view");
    const input = parseInput(listStoriesInputSchema, rawInput);
    return this.stories.list({
      organizationId: ctx.organizationId,
      ...input,
    });
  }
}
