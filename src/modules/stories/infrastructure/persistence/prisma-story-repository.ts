import type { PrismaClient, Prisma } from "@prisma/client";
import {
  type ListStoriesQuery,
  type ListStoriesResult,
  type StoryRepository,
} from "@/modules/stories/domain/repositories/story-repository";
import { Story } from "@/modules/stories/domain/entities/story";
import { StoryPage } from "@/modules/stories/domain/value-objects/story-page";
import { PagePictogram } from "@/modules/stories/domain/value-objects/page-pictogram";

type StoryRowWithPages = Prisma.StoryGetPayload<{ include: { pages: { include: { pictograms: true } } } }>;
type StoryRowWithPagesNoPictograms = Prisma.StoryGetPayload<{ include: { pages: true } }>;

export class PrismaStoryRepository implements StoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, organizationId: string): Promise<Story | null> {
    const row = await this.prisma.story.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { pages: { orderBy: { order: "asc" }, include: { pictograms: { orderBy: { order: "asc" } } } } },
    });
    return row ? this.toDomain(row as StoryRowWithPages) : null;
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

    const includePages: Prisma.StoryInclude = query.loadPages !== false
      ? { pages: { orderBy: { order: "asc" as const }, include: { pictograms: { orderBy: { order: "asc" as const } } } } }
      : { pages: { orderBy: { order: "asc" as const } } };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.story.findMany({
        where,
        orderBy,
        take: query.limit ?? 24,
        skip: query.offset ?? 0,
        include: includePages,
      }),
      this.prisma.story.count({ where }),
    ]);

    return { items: rows.map((r) => this.toDomain(r as unknown as StoryRowWithPages)), total };
  }

  async save(story: Story): Promise<void> {
    const data = story.toJSON() as unknown as {
      id: string;
      organizationId: string;
      createdById: string;
      title: string;
      description: string | null;
      originalText: string;
      adaptedText: string | null;
      language: string;
      status: string;
      visibility: string;
      coverImageUrl: string | null;
      tags: string[];
      metadata: Record<string, unknown>;
      deletedAt: Date | null;
      pages: Array<{
        id: string;
        order: number;
        text: string;
        pictograms: Array<{
          id: string;
          order: number;
          pictogramUrl: string;
          pictogramKeyword: string | null;
          pictogramId: string | null;
        }>;
        backgroundColor: string | null;
        textColor: string | null;
        fontSize: number | null;
        layout: string;
        notes: string | null;
      }>;
    };

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
          status: data.status as Prisma.StoryCreateInput["status"],
          visibility: data.visibility as Prisma.StoryCreateInput["visibility"],
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
          status: data.status as Prisma.StoryUpdateInput["status"],
          visibility: data.visibility as Prisma.StoryUpdateInput["visibility"],
          coverImageUrl: data.coverImageUrl,
          tags: data.tags,
          metadata: data.metadata as object,
          deletedAt: data.deletedAt,
        },
      });

      await tx.storyPagePictogram.deleteMany({ where: { page: { storyId: data.id } } });
      await tx.storyPage.deleteMany({ where: { storyId: data.id } });
      if (data.pages.length > 0) {
        for (const p of data.pages) {
          await tx.storyPage.create({
            data: {
              id: p.id,
              storyId: data.id,
              order: p.order,
              text: p.text,
              backgroundColor: p.backgroundColor,
              textColor: p.textColor,
              fontSize: p.fontSize,
              layout: p.layout,
              notes: p.notes,
              pictograms: {
                create: p.pictograms.map((pic) => ({
                  id: pic.id,
                  order: pic.order,
                  pictogramUrl: pic.pictogramUrl,
                  pictogramKeyword: pic.pictogramKeyword,
                  pictogramId: pic.pictogramId,
                })),
              },
            },
          });
        }
      }
    });
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.story.updateMany({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(row: StoryRowWithPages | StoryRowWithPagesNoPictograms): Story {
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
      pages: row.pages.map((p) => {
        const pagePictograms = "pictograms" in p && Array.isArray(p.pictograms)
          ? (p.pictograms as Array<{ id: string; order: number; pictogramUrl: string; pictogramKeyword: string | null; pictogramId: string | null }>)
          : [];
        return StoryPage.create({
          id: p.id,
          order: p.order,
          text: p.text,
          pictograms: pagePictograms.map((pic) =>
            PagePictogram.create({
              id: pic.id,
              order: pic.order,
              pictogramUrl: pic.pictogramUrl,
              pictogramKeyword: pic.pictogramKeyword,
              pictogramId: pic.pictogramId,
            }),
          ),
          backgroundColor: p.backgroundColor,
          textColor: p.textColor,
          fontSize: p.fontSize,
          layout: p.layout as Parameters<typeof StoryPage.create>[0]["layout"],
          notes: p.notes,
        });
      }),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
