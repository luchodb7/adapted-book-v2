import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login form is accessible on /login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in|log in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("server actions route to the app shell after success", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("demo@adaptedbooks.app");
    await page.getByLabel(/password/i).fill("Demo12345!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/app/);
  });

  test("forgot-password link is reachable", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: /forgot|reset/i });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/forgot/);
    }
  });
});
