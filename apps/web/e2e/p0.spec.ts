import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("P0 smoke", () => {
  test("landing loads and is largely accessible", async ({ page }) => {
    await page.goto("/#/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("explore route renders for guests", async ({ page }) => {
    await page.goto("/#/en/explore");
    await expect(page.getByRole("heading", { name: /explore/i })).toBeVisible({ timeout: 15_000 });
  });

  test("landing brand is reachable at locale root", async ({ page }) => {
    await page.goto("/#/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  });
});
