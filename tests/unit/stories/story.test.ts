import { describe, expect, it } from "vitest";
import { Story } from "@/modules/stories/domain/entities/story";
import { StoryPage } from "@/modules/stories/domain/value-objects/story-page";

const baseInput = {
  id: "st_1",
  organizationId: "org_1",
  createdById: "usr_1",
  title: "Going to the dentist",
  originalText: "I am going to the dentist. The dentist is friendly. I will be brave.",
};

describe("Story aggregate", () => {
  it("creates a Draft story and emits a created event", () => {
    const story = Story.create(baseInput);
    expect(story.title).toBe("Going to the dentist");
    expect(story.status).toBe("DRAFT");
    const events = story.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.name).toBe("story.created");
  });

  it("rejects an empty title", () => {
    expect(() => Story.create({ ...baseInput, title: "  " })).toThrow();
  });

  it("rejects a title longer than 200 chars", () => {
    expect(() => Story.create({ ...baseInput, title: "x".repeat(201) })).toThrow();
  });

  it("normalizes page order after replacePages", () => {
    const story = Story.create(baseInput);
    const pages = [
      StoryPage.create({
        id: "p1", order: 5, text: "Hello", pictogramUrl: null, pictogramKeyword: null,
        pictogramId: null, backgroundColor: null, textColor: null, fontSize: null,
        layout: "text-top", notes: null,
      }),
      StoryPage.create({
        id: "p2", order: 2, text: "World", pictogramUrl: null, pictogramKeyword: null,
        pictogramId: null, backgroundColor: null, textColor: null, fontSize: null,
        layout: "text-top", notes: null,
      }),
    ];
    story.replacePages(pages);
    expect(story.pages.map((p) => p.order)).toEqual([0, 1]);
    expect(story.pages[0]!.text).toBe("World");
  });

  it("reorders pages by id", () => {
    const story = Story.create(baseInput);
    story.replacePages([
      StoryPage.create({
        id: "a", order: 0, text: "A", pictogramUrl: null, pictogramKeyword: null,
        pictogramId: null, backgroundColor: null, textColor: null, fontSize: null,
        layout: "text-top", notes: null,
      }),
      StoryPage.create({
        id: "b", order: 1, text: "B", pictogramUrl: null, pictogramKeyword: null,
        pictogramId: null, backgroundColor: null, textColor: null, fontSize: null,
        layout: "text-top", notes: null,
      }),
    ]);
    story.reorderPages(["b", "a"]);
    expect(story.pages.map((p) => p.id)).toEqual(["b", "a"]);
    expect(story.pages.map((p) => p.order)).toEqual([0, 1]);
  });

  it("soft-deletes and emits event", () => {
    const story = Story.create(baseInput);
    story.pullEvents();
    story.softDelete();
    expect(story.isDeleted).toBe(true);
    const events = story.pullEvents();
    expect(events.some((e) => e.name === "story.deleted")).toBe(true);
  });

  it("duplicates with a new id, fresh creator, and DRAFT status", () => {
    const story = Story.create(baseInput);
    story.setStatus("PUBLISHED");
    const copy = story.duplicateAs("st_2", "usr_2");
    expect(copy.id).toBe("st_2");
    expect(copy.status).toBe("DRAFT");
    expect(copy.createdById).toBe("usr_2");
    expect(copy.title).toContain("(copy)");
  });
});
