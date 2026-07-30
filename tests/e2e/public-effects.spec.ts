import { expect, test } from "@playwright/test";

test("legacy background and home motion effects are mounted", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".qt-bg-fx")).toBeAttached();
  await expect(page.locator(".qt-ambient")).toBeAttached();
  await expect(page.locator(".qt-hero-bg")).toBeAttached();

  const background = page.locator("#qt-hero-bg-wrap");
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect
    .poll(() => background.evaluate((element) => element.style.transform))
    .not.toBe("");
});

test("reduced motion keeps dynamic styles still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const background = page.locator("#qt-hero-bg-wrap");
  await page.evaluate(() => window.scrollTo(0, 300));

  await expect
    .poll(() => background.evaluate((element) => element.style.transform))
    .toBe("");
  await expect(page.locator(".qt-ambient-line").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});
