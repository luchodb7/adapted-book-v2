import { describe, expect, it, vi } from "vitest";
import { PDFExporter } from "@/modules/export/infrastructure/pdf/pdf-exporter";
import type { ExportableStory } from "@/modules/export/domain/story-export-service";

const minimalStory: ExportableStory = {
  id: "st1",
  title: "Going to the dentist",
  language: "en",
  coverColor: null,
  pages: [
    { text: "I am going to the dentist.", pictogram: null },
    { text: "The dentist is friendly.", pictogram: null },
  ],
};

describe("PDFExporter", () => {
  it("returns a Uint8Array buffer with a non-trivial size", async () => {
    const exporter = new PDFExporter();
    const buffer = await exporter.export(minimalStory, { highContrast: true });
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.byteLength).toBeGreaterThan(500);
    // pdf-lib embeds the magic header
    const header = String.fromCharCode(...buffer.subarray(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("throws on empty pages", async () => {
    const exporter = new PDFExporter();
    await expect(
      exporter.export({ ...minimalStory, pages: [] }, {}),
    ).rejects.toThrow(/at least one page/);
  });
});
