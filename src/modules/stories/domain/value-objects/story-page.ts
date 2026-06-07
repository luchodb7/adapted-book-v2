import { ValueObject } from "@/shared/domain/base";

export interface StoryPageProps {
  readonly id: string;
  readonly order: number;
  text: string;
  pictogramUrl: string | null;
  pictogramKeyword: string | null;
  pictogramId: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  fontSize: number | null;
  layout: PageLayout;
  notes: string | null;
}

export type PageLayout = "text-top" | "text-bottom" | "text-left" | "text-right" | "text-only" | "pictogram-only";

export class StoryPage extends ValueObject<StoryPageProps> {
  static create(input: Omit<StoryPageProps, "layout"> & { layout?: PageLayout }): StoryPage {
    if (input.text.length > 2000) {
      throw new Error("Page text cannot exceed 2000 characters");
    }
    if (input.order < 0) {
      throw new Error("Page order must be a positive integer");
    }
    return new StoryPage({
      ...input,
      layout: input.layout ?? "text-top",
    });
  }

  get id() { return this.props.id; }
  get order() { return this.props.order; }
  get text() { return this.props.text; }
  get pictogramUrl() { return this.props.pictogramUrl; }
  get pictogramKeyword() { return this.props.pictogramKeyword; }
  get layout() { return this.props.layout; }

  withText(text: string): StoryPage {
    return StoryPage.create({ ...this.props, text });
  }

  withPictogram(input: { url: string | null; keyword: string | null; id: string | null }): StoryPage {
    return StoryPage.create({
      ...this.props,
      pictogramUrl: input.url,
      pictogramKeyword: input.keyword,
      pictogramId: input.id,
    });
  }

  withOrder(order: number): StoryPage {
    return StoryPage.create({ ...this.props, order });
  }

  toJSON(): StoryPageProps {
    return { ...this.props };
  }
}
