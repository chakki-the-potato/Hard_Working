import { expect, test } from "@playwright/test";

test("public shell keeps the legacy desktop structure", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".qt-header")).toBeVisible();
  await expect(page.locator(".qt-logo-name")).toHaveText("Hard_Working");
  await expect(page.locator(".qt-nav")).toBeVisible();
  await expect(page.locator(".qt-search")).toBeVisible();
  await expect(page.locator(".qt-page")).toBeVisible();
  await expect(page.locator(".qt-footer")).toBeVisible();
  await expect(page.locator(".qt-footer-social a")).toHaveCount(5);
});

test("public shell keeps the legacy mobile controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".qt-header")).toBeVisible();
  await expect(page.locator(".qt-nav")).toBeHidden();
  await expect(page.locator(".qt-search")).toBeHidden();
  await expect(page.locator(".qt-search-mobile")).toBeVisible();
  await expect(page.locator(".qt-footer")).toBeVisible();
});
