import JSZip from "jszip";
import type { Story } from "@/modules/stories/domain/entities/story";
import type { ExportArtifact } from "@/modules/export/domain/story-export-service";

/**
 * ZIPExporter — packages a story's metadata, pictograms, and per-page text
 * files into a single archive. Useful for offline distribution and as input
 * for downstream tools (e.g. PowerPoint, classroom apps).
 */
export class ZIPExporter {
  async exportPagesZip(story: Story): Promise<ExportArtifact> {
    const zip = new JSZip();
    const root = zip.folder(slug(story.title))!;

    root.file(
      "story.json",
      JSON.stringify(
        {
          id: story.id,
          title: story.title,
          pages: story.pages.map((p) => ({
            order: p.order,
            text: p.text,
            pictogramUrl: p.pictogramUrl,
            pictogramKeyword: p.pictogramKeyword,
          })),
        },
        null,
        2,
      ),
    );

    const pagesDir = root.folder("pages")!;
    for (const page of story.pages) {
      const idx = String(page.order + 1).padStart(3, "0");
      pagesDir.file(`${idx}.txt`, page.text);
      if (page.pictogramUrl) {
        try {
          const res = await fetch(page.pictogramUrl);
          if (res.ok) {
            const ext = page.pictogramUrl.toLowerCase().endsWith(".jpg") ? "jpg" : "png";
            pagesDir.file(`${idx}.${ext}`, await res.arrayBuffer());
          }
        } catch {
          // Ignore — text file is enough; archive must still build.
        }
      }
    }

    const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
    return { filename: `${slug(story.title)}.zip`, mimeType: "application/zip", bytes };
  }
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "story";
}
