import { expect, test } from "@playwright/test";

test("home exposes the legacy metadata contract", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Hard_Working — 개발 공부 기록");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "학습·포트폴리오·생각·가치관을 한 곳에 쌓는 개인 블로그.",
  );
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  expect(canonical).not.toBeNull();
  expect(new URL(canonical ?? "http://invalid").pathname).toBe("/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "website",
  );
  const openGraphUrl = await page
    .locator('meta[property="og:url"]')
    .getAttribute("content");
  expect(openGraphUrl).not.toBeNull();
  expect(new URL(openGraphUrl ?? "http://invalid").pathname).toBe("/");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
});

test("RSS and sitemap cover all current public output", async ({ request }) => {
  const searchResponse = await request.get("/api/search.json");
  const posts = (await searchResponse.json()) as readonly unknown[];
  const rssResponse = await request.get("/rss.xml");
  const rss = await rssResponse.text();
  const sitemapResponse = await request.get("/sitemap.xml");
  const sitemap = await sitemapResponse.text();

  expect(rssResponse.headers()["content-type"]).toContain(
    "application/rss+xml",
  );
  expect(rss.match(/<item>/g)?.length ?? 0).toBe(posts.length);
  expect(sitemap).toContain("<loc>");
  expect(sitemap).toContain(
    "<loc>http://127.0.0.1:3100/ideas/works</loc>",
  );
  expect(sitemap).toContain("/projects");
});

test("404 search action and legacy base redirect remain available", async ({
  page,
  request,
}) => {
  const redirect = await request.get("/Hard_Working", {
    maxRedirects: 0,
  });

  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe("/");

  await page.goto("/posts/public-seo-missing");
  await expect(page.locator(".qt-404-actions [data-cmdk-trigger]")).toBeVisible();
});
