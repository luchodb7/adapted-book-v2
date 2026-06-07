import { describe, expect, it, vi, beforeEach } from "vitest";
import { DefaultSocialStoryGenerator } from "@/modules/stories/infrastructure/services/default-social-story-generator";
import type { PictogramService } from "@/modules/pictograms/domain/services/pictogram-service";
import type { Pictogram } from "@/modules/pictograms/domain/pictogram";

const fakePictograms: Pictogram[] = [
  { id: 1, keyword: "dentist", url: "https://x/1.png", description: "dentist" },
  { id: 2, keyword: "friendly", url: "https://x/2.png", description: "friendly" },
  { id: 3, keyword: "brave", url: "https://x/3.png", description: "brave" },
];

const pictogramService: PictogramService = {
  search: vi.fn(async () => fakePictograms),
  getById: vi.fn(),
};

describe("DefaultSocialStoryGenerator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("generates pages in a sequential flow: tokenize → simplify → pictogram", async () => {
    const gen = new DefaultSocialStoryGenerator(pictogramService, { maxPages: 5 });
    const out = await gen.generate({
      originalText: "I am going to the dentist. The dentist is friendly. I will be brave.",
      language: "en",
    });
    expect(out.pages.length).toBeGreaterThan(0);
    expect(out.pages.length).toBeLessThanOrEqual(5);
    expect(out.pages[0]!.text.length).toBeGreaterThan(0);
  });

  it("respects the maxPages cap", async () => {
    const gen = new DefaultSocialStoryGenerator(pictogramService, { maxPages: 2 });
    const out = await gen.generate({
      originalText:
        "I am going to the dentist. The dentist is friendly. I will be brave. I will get a sticker. I will go home.",
      language: "en",
    });
    expect(out.pages.length).toBeLessThanOrEqual(2);
  });

  it("falls back to empty pictogram when no match is found", async () => {
    const empty: PictogramService = { search: vi.fn(async () => []), getById: vi.fn() };
    const gen = new DefaultSocialStoryGenerator(empty, { maxPages: 3 });
    const out = await gen.generate({ originalText: "Hello world.", language: "en" });
    expect(out.pages[0]!.pictogram).toBeNull();
  });
});
