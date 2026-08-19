import { expect, test } from "@playwright/test";

test("home keeps the legacy hero, content, ideas, and sidebar structure", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator(".qt-hero")).toBeVisible();
  await expect(page.locator(".qt-home-shell")).toBeVisible();
  await expect(page.locator(".qt-featured-wrap")).toBeVisible();
  await expect(page.locator(".qt-strip").first()).toBeVisible();
  await expect(page.locator(".qt-home-aside")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  await expect(page.locator(".qt-hero")).toBeVisible();
  await expect(page.locator(".qt-home-shell")).toBeVisible();
  await expect(page.locator(".qt-home-aside")).toBeVisible();
});

test("category and tag pages keep the legacy list structure", async ({
  page,
}) => {
  await page.goto("/posts/category/programming");

  await expect(page.locator(".qt-list-hero")).toBeVisible();
  await expect(page.locator(".qt-list-body")).toBeVisible();

  await page.goto("/page/2");

  await expect(page.locator(".qt-list-hero")).toBeVisible();
  await expect(page.locator(".qt-list-row").first()).toBeVisible();
  await expect(page.locator(".qt-list-row").first()).toBeVisible();

  await page.goto("/tags/git");

  await expect(page.locator(".qt-list-hero")).toBeVisible();
  await expect(page.locator(".qt-list-body")).toBeVisible();
});

test("idea and project indexes keep their legacy list contracts", async ({
  page,
}) => {
  await page.goto("/ideas");

  await expect(page.locator(".qt-list-hero")).toBeVisible();
  await expect(page.locator(".qt-list-rows")).toBeVisible();

  await page.goto("/ideas/works");

  await expect(page.locator(".qt-project-group").first()).toBeVisible();

  await page.goto("/projects");

  await expect(page.locator(".qt-project-grid")).toBeVisible();
});

test("hypothesis index uses the shared list layout", async ({ page }) => {
  await page.goto("/hypotheses");

  await expect(page.locator(".qt-list-hero")).toBeVisible();
  await expect(page.locator(".qt-list-body")).toBeVisible();
  await expect(page.locator(".qt-list-thead")).toBeVisible();
  await expect(page.locator(".qt-list-aside")).toBeVisible();
  await expect(
    page.locator(".qt-tag-chips").getByRole("link", { name: "RUNNING" }),
  ).toHaveAttribute("href", "/hypotheses?status=running");
});
