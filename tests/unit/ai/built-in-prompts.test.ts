import { describe, expect, it } from "vitest";
import { renderPrompt, SOCIAL_STORY_PROMPT } from "@/modules/ai/domain/prompts/built-in-prompts";

describe("built-in prompts", () => {
  it("renders a social story prompt with all variables substituted", () => {
    const out = renderPrompt(SOCIAL_STORY_PROMPT, {
      topic: "Visiting the doctor",
      age: 7,
      language: "en",
      numberOfPages: 4,
      readingLevel: "elementary",
    });
    expect(out).toContain("Visiting the doctor");
    expect(out).toContain("age 7");
    expect(out).toContain("exactly 4 pages");
  });

  it("throws when a required variable is missing", () => {
    expect(() => renderPrompt(SOCIAL_STORY_PROMPT, { topic: "x" } as never)).toThrow();
  });
});
