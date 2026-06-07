/**
 * Pictogram domain model.
 *
 * A `Pictogram` is a single ARASAAC asset described by its numeric id, image
 * URL, and a set of keywords in one or more locales. We deliberately keep the
 * domain model small and stable: ARASAAC's API has many additional fields that
 * we do not need to expose to the application layer.
 */

export interface PictogramKeyword {
  readonly keyword: string;
  readonly language: string;
  readonly type?: number;
  readonly meaning?: string;
}

export interface Pictogram {
  readonly id: number;
  readonly imageUrl: string;
  readonly keywords: PictogramKeyword[];
  readonly categories: string[];
  readonly tags: string[];
  readonly schematic?: boolean;
  readonly sex?: boolean;
  readonly violence?: boolean;
  readonly aac?: boolean;
}

export interface SearchOptions {
  language?: string;
  bestSearch?: boolean;
  limit?: number;
}
