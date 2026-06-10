import { z } from "zod";
import type { TenantContext } from "@/shared/tenant/tenant-context";
import { authorize } from "@/shared/auth/authorize";
import { NotFoundError } from "@/core/errors/app-error";
import { assertTenant } from "@/shared/tenant/guards";
import type { StoryRepository } from "@/modules/stories/domain/repositories/story-repository";
import type { AuditLogger } from "@/modules/audit/domain/audit-logger";
import { StoryPage } from "@/modules/stories/domain/value-objects/story-page";
import { PagePictogram } from "@/modules/stories/domain/value-objects/page-pictogram";
import { parseInput, sanitizeText } from "@/core/validation/parse";

const pagePictogramSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(0),
  pictogramUrl: z.string(),
  pictogramKeyword: z.string().nullable().optional(),
  pictogramId: z.string().nullable().optional(),
});

const pageSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(0),
  text: z.string().max(2000),
  pictograms: z.array(pagePictogramSchema).default([]),
  backgroundColor: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).nullable().optional(),
  textColor: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).nullable().optional(),
  fontSize: z.number().int().min(8).max(96).nullable().optional(),
  layout: z
    .enum(["text-top", "text-bottom", "text-left", "text-right", "text-only", "pictogram-only"])
    .optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateStoryInputSchema = z.object({
  storyId: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  adaptedText: z.string().max(50_000).optional(),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  visibility: z.enum(["PRIVATE", "ORGANIZATION", "PUBLIC"]).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  pages: z.array(pageSchema).max(200).optional(),
});

export type UpdateStoryInput = z.infer<typeof updateStoryInputSchema>;

export class UpdateStoryUseCase {
  constructor(
    private readonly stories: StoryRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(ctx: TenantContext, rawInput: unknown): Promise<void> {
    const input = parseInput(updateStoryInputSchema, rawInput);
    authorize(ctx, "stories.update");

    const story = await this.stories.findById(input.storyId, ctx.organizationId);
    if (!story) throw new NotFoundError("Story", input.storyId);
    assertTenant(ctx, story.organizationId);

    if (input.title) story.rename(sanitizeText(input.title, 200));
    if (input.adaptedText !== undefined) story.updateAdaptedText(input.adaptedText);
    if (input.status) story.setStatus(input.status);
    if (input.visibility) story.setVisibility(input.visibility);
    if (input.tags) story.setTags(input.tags);

    if (input.pages) {
      const pages = input.pages.map((p) =>
        StoryPage.create({
          id: p.id,
          order: p.order,
          text: sanitizeText(p.text, 2000),
          pictograms: (p.pictograms ?? []).map((pic) =>
            PagePictogram.create({
              id: pic.id,
              order: pic.order,
              pictogramUrl: pic.pictogramUrl,
              pictogramKeyword: pic.pictogramKeyword ?? null,
              pictogramId: pic.pictogramId ?? null,
            }),
          ),
          backgroundColor: p.backgroundColor ?? null,
          textColor: p.textColor ?? null,
          fontSize: p.fontSize ?? null,
          layout: p.layout ?? "text-top",
          notes: p.notes ?? null,
        }),
      );
      story.replacePages(pages);
    }

    await this.stories.save(story);

    await this.audit.log({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "UPDATE",
      resource: "Story",
      resourceId: story.id,
      metadata: { fields: Object.keys(input).filter((k) => k !== "storyId") },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }
}
