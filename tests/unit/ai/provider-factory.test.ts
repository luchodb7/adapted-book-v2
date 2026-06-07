import { describe, expect, it, vi } from "vitest";
import { AIProviderFactory } from "@/modules/ai/infrastructure/ai-provider-factory";

const ORIGINAL = { ...process.env };

afterEachRestoreEnv();

function afterEachRestoreEnv() {
  vi.stubEnv("AI_PROVIDER", "");
  process.env = { ...ORIGINAL };
}

describe("AIProviderFactory", () => {
  it("returns a mock provider for 'mock' without any API key", async () => {
    process.env.AI_PROVIDER = "mock";
    const f = new AIProviderFactory();
    const p = await f.getProvider();
    const out = await p.complete({
      prompt: "hi", systemPrompt: "", model: "m", temperature: 0, maxTokens: 10,
    });
    expect(out.text.length).toBeGreaterThan(0);
  });

  it("falls back to mock when the requested provider is not implemented", async () => {
    process.env.AI_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    const f = new AIProviderFactory();
    const p = await f.getProvider();
    const out = await p.complete({
      prompt: "hi", systemPrompt: "", model: "m", temperature: 0, maxTokens: 10,
    });
    expect(out.text.length).toBeGreaterThan(0);
  });

  it("rejects an explicit provider when its required env is missing", async () => {
    process.env.AI_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    const f = new AIProviderFactory();
    await expect(f.getStrictProvider()).rejects.toThrow(/OPENAI_API_KEY/);
  });
});
