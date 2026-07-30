import { expect, test } from "@playwright/test";

test("article keeps legacy metadata, body, progress, and navigation", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/search.json");
  const posts = (await response.json()) as readonly { id: string }[];

  expect(posts.length).toBeGreaterThan(0);
  await page.goto(`/posts/${posts[0].id}`);

  await expect(page.locator(".qt-reading-progress")).toBeAttached();
  await expect(page.locator(".qt-post-crumb")).toBeVisible();
  await expect(page.locator(".qt-post-head")).toBeVisible();
  await expect(page.locator(".qt-post-title")).toBeVisible();
  await expect(page.locator(".qt-post-meta")).toBeVisible();
  await expect(page.locator(".qt-post .prose")).toBeVisible();
  await expect(page.locator(".qt-post-nav")).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() =>
      page
        .locator(".qt-reading-progress > span")
        .evaluate((element) => element.style.transform),
    )
    .not.toBe("scaleX(0)");
});

test("project detail uses the same legacy article frame", async ({ page }) => {
  await page.goto("/projects");
  const projectHref = await page
    .locator(".qt-project-grid .qt-project-card")
    .first()
    .getAttribute("href");

  expect(projectHref).toBeTruthy();
  await page.goto(projectHref!);

  await expect(page.locator(".qt-post-wrap")).toBeVisible();
  await expect(page.locator(".qt-post-title")).toBeVisible();
  await expect(page.locator(".qt-post-related")).toBeVisible();
});

test("idea detail stays inside the legacy article frame", async ({ page }) => {
  await page.goto("/ideas");
  const ideaHref = await page
    .locator(".qt-list-row")
    .first()
    .getAttribute("href");

  expect(ideaHref).toBeTruthy();
  await page.goto(ideaHref!);

  await expect(page.locator(".qt-post-wrap")).toBeVisible();
  await expect(page.locator(".qt-post-back-top")).toContainText("Ideas");
  await expect(page.locator(".qt-post-nav")).toBeVisible();
});

test("article frame remains readable on mobile", async ({ page, request }) => {
  const response = await request.get("/api/search.json");
  const posts = (await response.json()) as readonly { id: string }[];

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/posts/${posts[0].id}`);

  await expect(page.locator(".qt-post-wrap")).toBeVisible();
  await expect(page.locator(".qt-post-title")).toBeVisible();
  await expect(page.locator(".qt-post-nav")).toBeVisible();
});
