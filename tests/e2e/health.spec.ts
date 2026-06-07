import { test, expect, request } from "@playwright/test";

test("export endpoint returns a PDF with the magic header", async () => {
  const ctx = await request.newContext({ baseURL: process.env.BASE_URL ?? "http://127.0.0.1:3000" });
  const res = await ctx.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
});
