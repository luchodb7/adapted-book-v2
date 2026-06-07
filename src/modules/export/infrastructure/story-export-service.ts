import type { Logger } from "@/core/logger/logger";
import type { Story } from "@/modules/stories/domain/entities/story";
import type { StoryRepository } from "@/modules/stories/domain/repositories/story-repository";
import type {
  ExportArtifact,
  ExportOptions,
  IStoryExportService,
} from "@/modules/export/domain/story-export-service";
import { PDFExporter } from "./pdf/pdf-exporter";
import { ZIPExporter } from "./zip/zip-exporter";

/**
 * Façade that selects the right exporter and emits a consistent artifact.
 *
 * Stateless — safe to share as a singleton across requests.
 */
export class StoryExportService implements IStoryExportService {
  private readonly pdf = new PDFExporter();
  private readonly zip = new ZIPExporter();

  constructor(
    private readonly stories: StoryRepository,
    private readonly logger: Logger,
  ) {}

  async export(story: Story, options: ExportOptions): Promise<ExportArtifact> {
    this.logger.info(
      { storyId: story.id, format: options.format, pages: story.pages.length },
      "export.story",
    );

    switch (options.format) {
      case "pdf-a4-portrait":
      case "pdf-a4-landscape":
        return this.pdf.export(story, options);
      case "pages-zip":
      case "png-zip":
        return this.zip.exportPagesZip(story);
      default: {
        const _exhaustive: never = options.format;
        throw new Error(`Unsupported export format: ${String(_exhaustive)}`);
      }
    }
  }
}
