import { test, expect } from "@playwright/test";

test.describe("Visual editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("demo@adaptedbooks.app");
    await page.getByLabel(/password/i).fill("Demo12345!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/app/);
  });

  test("create → edit → export happy path", async ({ page }) => {
    await page.goto("/app/stories/new");
    await page.getByLabel(/title/i).fill("Going to the dentist");
    await page.getByLabel(/text|story|original/i).first().fill("I am going to the dentist. The dentist is friendly.");
    await page.getByRole("button", { name: /generate|suggest/i }).click();
    await expect(page.locator('[data-testid="story-pages-list"]')).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: /export/i }).first().click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /pdf/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
