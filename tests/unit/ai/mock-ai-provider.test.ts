import { describe, expect, it, vi, beforeEach } from "vitest";
import { MockAIProvider } from "@/modules/ai/infrastructure/providers/mock-ai-provider";
import { AIProviderError } from "@/modules/ai/domain/providers/ai-provider";

describe("MockAIProvider", () => {
  let provider: MockAIProvider;

  beforeEach(() => {
    provider = new MockAIProvider({ deterministicSeed: "test" });
  });

  it("returns a completion with deterministic text", async () => {
    const a = await provider.complete({
      prompt: "Hello",
      systemPrompt: "you are kind",
      model: "mock-1",
      temperature: 0,
      maxTokens: 100,
    });
    const b = await provider.complete({
      prompt: "Hello",
      systemPrompt: "you are kind",
      model: "mock-1",
      temperature: 0,
      maxTokens: 100,
    });
    expect(a.text).toBe(b.text);
    expect(a.text.length).toBeGreaterThan(0);
  });

  it("strips JSON from a free-form prompt before generating", async () => {
    const out = await provider.complete({
      prompt: '{"what": "this"}',
      systemPrompt: "",
      model: "mock-1",
      temperature: 0,
      maxTokens: 100,
    });
    expect(out.text).not.toContain("what");
  });

  it("generateStory produces pages with consistent keywords", async () => {
    const out = await provider.generateStory({
      topic: "Going to the dentist",
      age: 6,
      language: "en",
      numberOfPages: 3,
    });
    expect(out.pages).toHaveLength(3);
    expect(out.pages[0]!.text.length).toBeGreaterThan(0);
    expect(out.pages[0]!.pictogramKeyword).toBeTruthy();
  });

  it("adaptText lowers complexity and returns a clean string", async () => {
    const out = await provider.adaptText({
      text: "This is an extremely long and complicated sentence.",
      readingLevel: "elementary",
    });
    expect(out.text.length).toBeGreaterThan(0);
  });

  it("translates text and tags the language", async () => {
    const out = await provider.translateText({
      text: "Hello world",
      fromLanguage: "en",
      toLanguage: "es",
    });
    expect(out.text).toContain("[mock:en->es]");
  });

  it("refuses generation when the topic is unsafe", async () => {
    await expect(
      provider.generateStory({
        topic: "violence at school",
        age: 6,
        language: "en",
        numberOfPages: 3,
      }),
    ).rejects.toBeInstanceOf(AIProviderError);
  });

  it("embeddings produce a fixed-size vector", async () => {
    const out = await provider.embed({ text: "hello world", model: "mock-embed" });
    expect(out.vector).toHaveLength(8);
  });

  it("moderation flags unsafe text", async () => {
    const out = await provider.moderate({ text: "I want to hurt them" });
    expect(out.flagged).toBe(true);
  });

  it("extracts a fixed number of pictogram keywords", async () => {
    const out = await provider.suggestPictograms({
      text: "The cat sits on the mat. The dog plays in the park.",
      language: "en",
      maxKeywords: 4,
    });
    expect(out.keywords).toHaveLength(4);
  });
});
