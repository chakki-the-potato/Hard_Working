import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
] as const;

type VisualRoute = Readonly<{
  name: string;
  path: string;
}>;

test("capture all public parity surfaces", async ({ page }) => {
  test.setTimeout(120_000);

  const routeBase = process.env.PARITY_ROUTE_BASE ?? "";
  const withBase = (path: string): string => `${routeBase}${path}`;

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(withBase("/"));

  const postPath = await page.locator(".qt-feat-row").first().getAttribute("href");
  const categoryPath = await page
    .locator("a[href*='/posts/category/']")
    .first()
    .getAttribute("href");
  const tagPath = await page
    .locator("a[href*='/tags/']")
    .first()
    .getAttribute("href");

  expect(postPath).toBeTruthy();
  expect(categoryPath).toBeTruthy();
  expect(tagPath).toBeTruthy();

  const routes: readonly VisualRoute[] = [
    { name: "home", path: withBase("/") },
    { name: "article", path: postPath ?? withBase("/") },
    { name: "category", path: categoryPath ?? withBase("/") },
    { name: "tag", path: tagPath ?? withBase("/") },
    { name: "ideas", path: withBase("/ideas") },
    { name: "works", path: withBase("/ideas/works") },
    { name: "projects", path: withBase("/projects") },
    { name: "search", path: withBase("/search?q=git") },
    { name: "not-found", path: withBase("/posts/public-visual-missing") },
  ];
  const prefix = process.env.PARITY_SCREENSHOT_PREFIX ?? "next";

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.locator("body")).toBeVisible();
      await page.screenshot({
        animations: "disabled",
        caret: "initial",
        fullPage: true,
        path: `output/playwright/parity/${prefix}-${viewport.name}-${route.name}.png`,
      });
    }
  }
});
