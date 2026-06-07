import { describe, expect, it, vi, beforeEach } from "vitest";
import { ArasaacClient } from "@/modules/pictograms/infrastructure/services/arasaac-client";

const BASE = "https://api.example.com";
const STATIC = "https://static.example.com";

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  (globalThis as { fetch: typeof fetch }).fetch = vi.fn(async (input) =>
    handler(typeof input === "string" ? input : (input as URL).toString()),
  ) as unknown as typeof fetch;
}

describe("ArasaacClient", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("searchPictograms translates the query and returns mapped pictograms", async () => {
    mockFetch((url) => {
      expect(url).toContain(`${BASE}/v2/search`);
      expect(url).toContain("keyword=dog");
      return new Response(
        JSON.stringify([{ _id: 100, keyword: [{ keyword: "dog", type: 1 }] }]),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const client = new ArasaacClient({ baseUrl: BASE, staticUrl: STATIC, cacheTtlMs: 1000 });
    const out = await client.searchPictograms("dog", "en", 5);
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe(100);
    expect(out[0]!.url).toBe(`${STATIC}/100/100_500.png`);
  });

  it("getPictogram builds the correct static URL", async () => {
    mockFetch(() => new Response("not used", { status: 200 }));
    const client = new ArasaacClient({ baseUrl: BASE, staticUrl: STATIC, cacheTtlMs: 1000 });
    const p = await client.getPictogram(42, "en");
    expect(p.id).toBe(42);
    expect(p.url).toBe(`${STATIC}/42/42_500.png`);
  });

  it("caches successful responses for the configured TTL", async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = new ArasaacClient({ baseUrl: BASE, staticUrl: STATIC, cacheTtlMs: 60_000 });
    await client.searchPictograms("cat", "en", 3);
    await client.searchPictograms("cat", "en", 3);
    expect(calls).toBe(1);
  });

  it("retries on 503 then succeeds", async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      if (calls < 2) return new Response("down", { status: 503 });
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = new ArasaacClient({ baseUrl: BASE, staticUrl: STATIC, maxRetries: 2, backoffMs: 1 });
    const out = await client.searchPictograms("dog", "en", 3);
    expect(out).toEqual([]);
    expect(calls).toBe(2);
  });

  it("honours Retry-After header on 429", async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      if (calls === 1) {
        return new Response("rate", { status: 429, headers: { "Retry-After": "0" } });
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = new ArasaacClient({ baseUrl: BASE, staticUrl: STATIC, maxRetries: 1, backoffMs: 1 });
    await client.searchPictograms("dog", "en", 3);
    expect(calls).toBe(2);
  });
});
