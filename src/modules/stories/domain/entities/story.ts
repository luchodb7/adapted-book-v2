import { AggregateRoot } from "@/shared/domain/base";
import type { StoryStatus, StoryVisibility } from "@prisma/client";
import { StoryPage, type StoryPageProps } from "../value-objects/story-page";
import { PagePictogram, type PagePictogramProps } from "../value-objects/page-pictogram";

export interface StoryProps {
  readonly id: string;
  readonly organizationId: string;
  readonly createdById: string;
  title: string;
  description: string | null;
  originalText: string;
  adaptedText: string | null;
  language: string;
  status: StoryStatus;
  visibility: StoryVisibility;
  coverImageUrl: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  pages: StoryPage[];
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 50_000;
const MAX_PAGES = 200;

/**
 * Story aggregate root.
 *
 * Owns its pages as a value-object collection — the page identity is local to
 * the story. All page mutations go through the aggregate to maintain
 * invariants (ordering, max count, etc.).
 */
export class Story extends AggregateRoot {
  private constructor(private props: StoryProps) {
    super(props.id);
  }

  static fromPersistence(props: StoryProps): Story {
    return new Story(props);
  }

  static create(input: {
    id: string;
    organizationId: string;
    createdById: string;
    title: string;
    originalText: string;
    language?: string;
  }): Story {
    Story.validateTitle(input.title);
    Story.validateText(input.originalText);
    const now = new Date();

    const story = new Story({
      id: input.id,
      organizationId: input.organizationId,
      createdById: input.createdById,
      title: input.title.trim(),
      description: null,
      originalText: input.originalText,
      adaptedText: null,
      language: input.language ?? "en",
      status: "DRAFT",
      visibility: "ORGANIZATION",
      coverImageUrl: null,
      tags: [],
      metadata: {},
      pages: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    story.addEvent({
      name: "story.created",
      occurredAt: now,
      aggregateId: story.id,
      payload: { organizationId: input.organizationId, createdById: input.createdById },
    });

    return story;
  }

  rename(title: string): void {
    Story.validateTitle(title);
    this.props.title = title.trim();
    this.touch();
  }

  updateOriginalText(text: string): void {
    Story.validateText(text);
    this.props.originalText = text;
    this.touch();
  }

  updateAdaptedText(text: string): void {
    Story.validateText(text);
    this.props.adaptedText = text;
    this.touch();
  }

  setStatus(status: StoryStatus): void {
    if (this.props.status === status) return;
    this.props.status = status;
    this.touch();
    this.addEvent({
      name: "story.status_changed",
      occurredAt: this.props.updatedAt,
      aggregateId: this.id,
      payload: { status },
    });
  }

  setVisibility(visibility: StoryVisibility): void {
    this.props.visibility = visibility;
    this.touch();
  }

  setTags(tags: string[]): void {
    this.props.tags = Array.from(new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)));
    this.touch();
  }

  replacePages(pages: StoryPage[]): void {
    if (pages.length > MAX_PAGES) {
      throw new Error(`A story cannot have more than ${MAX_PAGES} pages`);
    }
    this.props.pages = [...pages].sort((a, b) => a.order - b.order);
    this.normalizeOrders();
    this.touch();
  }

  addPage(page: StoryPage): void {
    if (this.props.pages.length >= MAX_PAGES) {
      throw new Error(`A story cannot have more than ${MAX_PAGES} pages`);
    }
    this.props.pages.push(page);
    this.normalizeOrders();
    this.touch();
  }

  removePage(pageId: string): void {
    this.props.pages = this.props.pages.filter((p) => p.id !== pageId);
    this.normalizeOrders();
    this.touch();
  }

  reorderPages(orderedIds: string[]): void {
    const map = new Map(this.props.pages.map((p) => [p.id, p]));
    const next: StoryPage[] = [];
    orderedIds.forEach((id, idx) => {
      const page = map.get(id);
      if (page) next.push(page.withOrder(idx));
    });
    if (next.length !== this.props.pages.length) {
      throw new Error("Reorder list must contain every existing page exactly once");
    }
    this.props.pages = next;
    this.touch();
  }

  updatePage(pageId: string, patch: (page: StoryPage) => StoryPage): void {
    this.props.pages = this.props.pages.map((p) => (p.id === pageId ? patch(p) : p));
    this.touch();
  }

  softDelete(): void {
    if (this.props.deletedAt) return;
    this.props.deletedAt = new Date();
    this.touch();
    this.addEvent({
      name: "story.deleted",
      occurredAt: this.props.deletedAt,
      aggregateId: this.id,
      payload: {},
    });
  }

  duplicateAs(newId: string, createdById: string): Story {
    const now = new Date();
    return Story.fromPersistence({
      ...this.props,
      id: newId,
      title: `${this.props.title} (copy)`,
      status: "DRAFT",
      createdById,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      pages: this.props.pages.map((p, idx) => {
        const pj = p.toJSON();
        return StoryPage.create({
          ...pj,
          pictograms: (pj.pictograms as unknown as PagePictogramProps[]).map((pic) =>
            PagePictogram.create(pic),
          ),
          id: `${newId}-page-${idx}`,
          order: idx,
        });
      }),
    });
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private normalizeOrders(): void {
    this.props.pages = this.props.pages
      .sort((a, b) => a.order - b.order)
      .map((p, idx) => (p.order === idx ? p : p.withOrder(idx)));
  }

  private static validateTitle(title: string): void {
    const t = title.trim();
    if (t.length < 1) throw new Error("Title is required");
    if (t.length > MAX_TITLE_LENGTH) throw new Error(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
  }

  private static validateText(text: string): void {
    if (text.length > MAX_TEXT_LENGTH) throw new Error(`Text cannot exceed ${MAX_TEXT_LENGTH} characters`);
  }

  toJSON(): StoryProps & { pages: StoryPageProps[] } {
    return {
      ...this.props,
      pages: this.props.pages.map((p) => p.toJSON()),
    } as unknown as StoryProps & { pages: StoryPageProps[] };
  }

  get organizationId() { return this.props.organizationId; }
  get createdById() { return this.props.createdById; }
  get title() { return this.props.title; }
  get pages(): readonly StoryPage[] { return this.props.pages; }
  get status() { return this.props.status; }
  get isDeleted() { return this.props.deletedAt !== null; }
}
