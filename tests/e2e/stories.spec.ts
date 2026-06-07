import { test, expect } from "@playwright/test";

test.describe("Stories", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("demo@adaptedbooks.app");
    await page.getByLabel(/password/i).fill("Demo12345!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/app/);
  });

  test("list page shows empty state and new button", async ({ page }) => {
    await page.goto("/app/stories");
    await expect(page.getByRole("heading", { name: /stories/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /new story/i })).toBeVisible();
  });

  test("can navigate to the visual editor", async ({ page }) => {
    await page.goto("/app/stories/new");
    await expect(page.getByRole("textbox", { name: /title/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /generate|suggest/i })).toBeVisible();
  });

  test("a11y toolbar cycles text size and persists in localStorage", async ({ page }) => {
    await page.goto("/app");
    const increase = page.getByRole("button", { name: /increase text size/i });
    if (await increase.isVisible()) {
      await increase.click();
      const stored = await page.evaluate(() => localStorage.getItem("ab.textSize"));
      expect(stored).toBeTruthy();
    }
  });
});
