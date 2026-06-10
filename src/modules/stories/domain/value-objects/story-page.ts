import { ValueObject } from "@/shared/domain/base";
import { PagePictogram, type PagePictogramProps } from "./page-pictogram";

export interface StoryPageProps {
  readonly id: string;
  readonly order: number;
  text: string;
  pictograms: PagePictogram[];
  backgroundColor: string | null;
  textColor: string | null;
  fontSize: number | null;
  layout: PageLayout;
  notes: string | null;
}

export type PageLayout = "text-top" | "text-bottom" | "text-left" | "text-right" | "text-only" | "pictogram-only";

export class StoryPage extends ValueObject<StoryPageProps> {
  static create(input: Omit<StoryPageProps, "layout" | "pictograms"> & { layout?: PageLayout; pictograms?: PagePictogram[] }): StoryPage {
    if (input.text.length > 2000) {
      throw new Error("Page text cannot exceed 2000 characters");
    }
    if (input.order < 0) {
      throw new Error("Page order must be a positive integer");
    }
    return new StoryPage({
      ...input,
      pictograms: input.pictograms ?? [],
      layout: input.layout ?? "text-top",
    });
  }

  get id() { return this.props.id; }
  get order() { return this.props.order; }
  get text() { return this.props.text; }
  get pictograms(): readonly PagePictogram[] { return this.props.pictograms; }
  get layout() { return this.props.layout; }

  withText(text: string): StoryPage {
    return StoryPage.create({ ...this.props, text });
  }

  addPictogram(pictogram: PagePictogram): StoryPage {
    return StoryPage.create({
      ...this.props,
      pictograms: [...this.props.pictograms, pictogram],
    });
  }

  removePictogram(pictogramId: string): StoryPage {
    return StoryPage.create({
      ...this.props,
      pictograms: this.props.pictograms.filter((p) => p.id !== pictogramId),
    });
  }

  replacePictograms(pictograms: PagePictogram[]): StoryPage {
    return StoryPage.create({
      ...this.props,
      pictograms: [...pictograms].sort((a, b) => a.order - b.order),
    });
  }

  withOrder(order: number): StoryPage {
    return StoryPage.create({ ...this.props, order });
  }

  toJSON(): StoryPageProps {
    return {
      id: this.props.id,
      order: this.props.order,
      text: this.props.text,
      pictograms: this.props.pictograms.map((p) => p.toJSON()) as unknown as PagePictogram[],
      backgroundColor: this.props.backgroundColor,
      textColor: this.props.textColor,
      fontSize: this.props.fontSize,
      layout: this.props.layout,
      notes: this.props.notes,
    };
  }
}
