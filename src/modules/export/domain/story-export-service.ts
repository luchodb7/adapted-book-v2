import type { Story } from "@/modules/stories/domain/entities/story";

export type ExportFormat = "pdf-a4-portrait" | "pdf-a4-landscape" | "png-zip" | "pages-zip";

export interface ExportOptions {
  format: ExportFormat;
  includeCover?: boolean;
  showPageNumbers?: boolean;
  fontSize?: number;
  highContrast?: boolean;
}

export interface ExportArtifact {
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}

/**
 * StoryExportService — orchestrates story exports across formats.
 *
 * Implementations are stateless and accept a fully-loaded `Story` aggregate.
 * The presentation layer should already have authorised the request and
 * resolved the story through the StoryRepository.
 */
export interface IStoryExportService {
  export(story: Story, options: ExportOptions): Promise<ExportArtifact>;
}
