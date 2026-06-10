import { ValueObject } from "@/shared/domain/base";

export interface PagePictogramProps {
  readonly id: string;
  readonly order: number;
  pictogramUrl: string;
  pictogramKeyword: string | null;
  pictogramId: string | null;
}

export class PagePictogram extends ValueObject<PagePictogramProps> {
  static create(input: Omit<PagePictogramProps, "id"> & { id?: string }): PagePictogram {
    return new PagePictogram({
      id: input.id ?? crypto.randomUUID(),
      order: input.order,
      pictogramUrl: input.pictogramUrl,
      pictogramKeyword: input.pictogramKeyword ?? null,
      pictogramId: input.pictogramId ?? null,
    });
  }

  get id() { return this.props.id; }
  get order() { return this.props.order; }
  get pictogramUrl() { return this.props.pictogramUrl; }
  get pictogramKeyword() { return this.props.pictogramKeyword; }
  get pictogramId() { return this.props.pictogramId; }

  withUrl(url: string): PagePictogram {
    return PagePictogram.create({ ...this.props, pictogramUrl: url });
  }

  withOrder(order: number): PagePictogram {
    return PagePictogram.create({ ...this.props, order });
  }

  toJSON(): PagePictogramProps {
    return { ...this.props };
  }
}
