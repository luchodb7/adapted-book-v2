import type { PrismaClient, Prisma } from "@prisma/client";
import {
  type ListStoriesQuery,
  type ListStoriesResult,
  type StoryRepository,
} from "@/modules/stories/domain/repositories/story-repository";
import { Story } from "@/modules/stories/domain/entities/story";
import { StoryPage } from "@/modules/stories/domain/value-objects/story-page";

type StoryRow = Prisma.StoryGetPayload<{ include: { pages: true } }>;

export class PrismaStoryRepository implements StoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, organizationId: string): Promise<Story | null> {
    const row = await this.prisma.story.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { pages: { orderBy: { order: "asc" } } },
    });
    return row ? this.toDomain(row) : null;
  }

  async list(query: ListStoriesQuery): Promise<ListStoriesResult> {
    const where: Prisma.StoryWhereInput = {
      organizationId: query.organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.createdById ? { createdById: query.createdById } : {}),
      ...(query.tags && query.tags.length > 0 ? { tags: { hasEvery: query.tags } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.StoryOrderByWithRelationInput = {
      [query.sortBy ?? "updatedAt"]: query.sortDir ?? "desc",
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.story.findMany({
        where,
        include: { pages: { orderBy: { order: "asc" } } },
        orderBy,
        take: query.limit ?? 24,
        skip: query.offset ?? 0,
      }),
      this.prisma.story.count({ where }),
    ]);

    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(story: Story): Promise<void> {
    const data = story.toJSON();
    const pages = data.pages.map((p) => p.toJSON());

    await this.prisma.$transaction(async (tx) => {
      await tx.story.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          organizationId: data.organizationId,
          createdById: data.createdById,
          title: data.title,
          description: data.description,
          originalText: data.originalText,
          adaptedText: data.adaptedText,
          language: data.language,
          status: data.status,
          visibility: data.visibility,
          coverImageUrl: data.coverImageUrl,
          tags: data.tags,
          metadata: data.metadata as object,
        },
        update: {
          title: data.title,
          description: data.description,
          originalText: data.originalText,
          adaptedText: data.adaptedText,
          language: data.language,
          status: data.status,
          visibility: data.visibility,
          coverImageUrl: data.coverImageUrl,
          tags: data.tags,
          metadata: data.metadata as object,
          deletedAt: data.deletedAt,
        },
      });

      // Replace pages atomically. For huge stories (>200 pages) a per-page
      // diff would be cheaper; we keep it simple while we're well under that.
      await tx.storyPage.deleteMany({ where: { storyId: data.id } });
      if (pages.length > 0) {
        await tx.storyPage.createMany({
          data: pages.map((p) => ({
            id: p.id,
            storyId: data.id,
            order: p.order,
            text: p.text,
            pictogramUrl: p.pictogramUrl,
            pictogramKeyword: p.pictogramKeyword,
            pictogramId: p.pictogramId,
            backgroundColor: p.backgroundColor,
            textColor: p.textColor,
            fontSize: p.fontSize,
            layout: p.layout,
            notes: p.notes,
          })),
        });
      }
    });
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.story.updateMany({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(row: StoryRow): Story {
    return Story.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      createdById: row.createdById,
      title: row.title,
      description: row.description,
      originalText: row.originalText,
      adaptedText: row.adaptedText,
      language: row.language,
      status: row.status,
      visibility: row.visibility,
      coverImageUrl: row.coverImageUrl,
      tags: row.tags,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      pages: row.pages.map((p) =>
        StoryPage.create({
          id: p.id,
          order: p.order,
          text: p.text,
          pictogramUrl: p.pictogramUrl,
          pictogramKeyword: p.pictogramKeyword,
          pictogramId: p.pictogramId,
          backgroundColor: p.backgroundColor,
          textColor: p.textColor,
          fontSize: p.fontSize,
          layout: p.layout as Parameters<typeof StoryPage.create>[0]["layout"],
          notes: p.notes,
        }),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
