import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import type { PDFFont, PDFPage, PDFImage } from "pdf-lib";
import type { Story } from "@/modules/stories/domain/entities/story";
import type { ExportArtifact, ExportOptions } from "@/modules/export/domain/story-export-service";

/**
 * PDFExporter — builds an A4 PDF from a Story using `pdf-lib`.
 *
 * Why pdf-lib (vs react-pdf)?
 *   - Pure JS, runs on Edge/Node/Browser without canvas dependencies.
 *   - Deterministic output (predictable size, identical bytes in tests).
 *   - Fine-grained layout control (precise positioning for a11y).
 *
 * `@react-pdf/renderer` is also available for component-style templates; see
 * `react-pdf-templates.ts` for a parallel implementation.
 */
export class PDFExporter {
  async export(story: Story, options: ExportOptions): Promise<ExportArtifact> {
    const isLandscape = options.format === "pdf-a4-landscape";
    const [w, h] = isLandscape ? [PageSizes.A4[1], PageSizes.A4[0]] : PageSizes.A4;

    const pdf = await PDFDocument.create();
    pdf.setTitle(story.title);
    pdf.setSubject("Social Story — Adapted Books");
    pdf.setCreator("Adapted Books");
    pdf.setProducer("Adapted Books PDF Engine");
    pdf.setCreationDate(new Date());

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontSize = options.fontSize ?? 18;
    const margin = 48;
    const colors = options.highContrast
      ? { bg: rgb(0, 0, 0), text: rgb(1, 1, 1) }
      : { bg: rgb(1, 1, 1), text: rgb(0.07, 0.09, 0.15) };

    if (options.includeCover !== false) {
      const page = pdf.addPage([w, h]);
      page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: colors.bg });
      drawWrappedText(page, story.title, {
        x: margin,
        y: h - margin - 80,
        maxWidth: w - margin * 2,
        font: fontBold,
        size: fontSize * 2.5,
        color: colors.text,
      });
      const meta = `Created with Adapted Books · ${story.pages.length} pages`;
      page.drawText(meta, { x: margin, y: margin, size: 10, font, color: colors.text });
    }

    for (const [idx, page] of story.pages.entries()) {
      const pdfPage = pdf.addPage([w, h]);
      pdfPage.drawRectangle({ x: 0, y: 0, width: w, height: h, color: colors.bg });

      const hasImage = !!page.pictogramUrl;
      let imageBox = hasImage ? Math.min(w, h) * 0.55 : 0;
      let imageX = (w - imageBox) / 2;
      let imageY = h - margin - imageBox;

      if (hasImage && page.pictogramUrl) {
        try {
          const imgBytes = await fetchAsBytes(page.pictogramUrl);
          const img = await embedImage(pdf, imgBytes, page.pictogramUrl);
          if (img) {
            const scale = imageBox / Math.max(img.width, img.height);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            imageX = (w - drawW) / 2;
            imageY = h - margin - drawH;
            pdfPage.drawImage(img, { x: imageX, y: imageY, width: drawW, height: drawH });
            imageBox = drawH;
          }
        } catch {
          imageBox = 0;
        }
      }

      const textTop = (hasImage && imageBox > 0 ? imageY : h - margin) - 24;
      drawWrappedText(pdfPage, page.text, {
        x: margin,
        y: textTop,
        maxWidth: w - margin * 2,
        font,
        size: fontSize,
        color: colors.text,
        lineHeight: 1.45,
      });

      if (options.showPageNumbers !== false) {
        pdfPage.drawText(`${idx + 1} / ${story.pages.length}`, {
          x: w - margin - 60,
          y: 24,
          size: 9,
          font,
          color: colors.text,
        });
      }
    }

    const bytes = await pdf.save();
    return {
      filename: `${slugifyTitle(story.title)}.pdf`,
      mimeType: "application/pdf",
      bytes,
    };
  }
}

// -- helpers ------------------------------------------------------------------

interface DrawOptions {
  x: number;
  y: number;
  maxWidth: number;
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
  lineHeight?: number;
}

function drawWrappedText(page: PDFPage, text: string, opts: DrawOptions): void {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = opts.font.widthOfTextAtSize(candidate, opts.size);
    if (width > opts.maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  const lineHeight = opts.size * (opts.lineHeight ?? 1.3);
  lines.forEach((line, i) => {
    page.drawText(line, {
      x: opts.x,
      y: opts.y - i * lineHeight,
      size: opts.size,
      font: opts.font,
      color: opts.color,
    });
  });
}

async function fetchAsBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function embedImage(
  pdf: PDFDocument,
  bytes: Uint8Array,
  url: string,
): Promise<PDFImage | null> {
  const lower = url.toLowerCase();
  try {
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return pdf.embedJpg(bytes);
    return pdf.embedPng(bytes);
  } catch {
    try {
      return pdf.embedPng(bytes);
    } catch {
      return null;
    }
  }
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "story";
}
