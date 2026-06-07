import { describe, expect, it, vi } from "vitest";
import { StoryExportService } from "@/modules/export/infrastructure/story-export-service";
import { PDFExporter } from "@/modules/export/infrastructure/pdf/pdf-exporter";
import { ZipExporter } from "@/modules/export/infrastructure/zip/zip-exporter";
import { MemoryStoryRepository } from "./_helpers/memory-story-repo";

const story = {
  id: "st1",
  title: "Test",
  language: "en",
  coverColor: null,
  pages: [
    { text: "Page 1", pictogram: null },
    { text: "Page 2", pictogram: null },
  ],
};

describe("StoryExportService", () => {
  it("produces a PDF for application/pdf", async () => {
    const repo = new MemoryStoryRepository([story]);
    const svc = new StoryExportService(new PDFExporter(), new ZipExporter(), repo as never);
    const buf = await svc.export("st1", { format: "pdf" });
    expect(String.fromCharCode(...buf.subarray(0, 5))).toBe("%PDF-");
  });

  it("produces a ZIP for application/zip", async () => {
    const repo = new MemoryStoryRepository([story]);
    const svc = new StoryExportService(new PDFExporter(), new ZipExporter(), repo as never);
    const buf = await svc.export("st1", { format: "zip" });
    expect(buf.byteLength).toBeGreaterThan(20);
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it("rejects unknown formats", async () => {
    const repo = new MemoryStoryRepository([story]);
    const svc = new StoryExportService(new PDFExporter(), new ZipExporter(), repo as never);
    await expect(svc.export("st1", { format: "txt" as never })).rejects.toThrow();
  });
});
