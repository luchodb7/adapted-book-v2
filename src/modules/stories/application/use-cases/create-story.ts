import { z } from "zod";
import { nanoid } from "nanoid";
import type { TenantContext } from "@/shared/tenant/tenant-context";
import { authorize } from "@/shared/auth/authorize";
import type { StoryRepository } from "@/modules/stories/domain/repositories/story-repository";
import type { SocialStoryGenerator } from "@/modules/stories/domain/services/social-story-generator";
import type { AuditLogger } from "@/modules/audit/domain/audit-logger";
import { Story } from "@/modules/stories/domain/entities/story";
import { parseInput, sanitizeText } from "@/core/validation/parse";

export const createStoryInputSchema = z.object({
  title: z.string().min(1).max(200),
  originalText: z.string().min(1).max(50_000),
  language: z.string().min(2).max(8).default("en"),
  generatePictograms: z.boolean().default(true),
});

export type CreateStoryInput = z.infer<typeof createStoryInputSchema>;

export interface CreateStoryResult {
  storyId: string;
}

/**
 * CreateStoryUseCase
 *
 * Orchestrates: validation -> tenant guard -> domain creation -> social-story
 * generation -> persistence -> audit. Pure application-layer logic; no I/O
 * details leak in.
 */
export class CreateStoryUseCase {
  constructor(
    private readonly stories: StoryRepository,
    private readonly generator: SocialStoryGenerator,
    private readonly audit: AuditLogger,
  ) {}

  async execute(ctx: TenantContext, rawInput: unknown): Promise<CreateStoryResult> {
    const input = parseInput(createStoryInputSchema, rawInput);
    authorize(ctx, "stories.create");

    const id = `st_${nanoid(20)}`;
    const story = Story.create({
      id,
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      title: sanitizeText(input.title, 200),
      originalText: input.originalText,
      language: input.language,
    });

    const generated = await this.generator.generate({
      storyId: id,
      organizationId: ctx.organizationId,
      originalText: input.originalText,
      language: input.language,
      attachPictograms: input.generatePictograms,
    });

    story.updateAdaptedText(generated.adaptedText);
    story.replacePages(generated.pages);

    await this.stories.save(story);

    await this.audit.log({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "CREATE",
      resource: "Story",
      resourceId: id,
      metadata: { title: story.title, pageCount: story.pages.length },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { storyId: id };
  }
}
