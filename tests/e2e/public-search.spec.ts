import { expect, test } from "@playwright/test";

test("command palette supports open, search, keyboard navigation, and close", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/search.json");
  const items = (await response.json()) as readonly {
    id: string;
    title: string;
  }[];

  expect(items.length).toBeGreaterThan(1);
  await page.goto("/");
  await page.locator("[data-cmdk-trigger]").first().click();

  await expect(page.locator("#qt-cmdk")).toBeVisible();
  await expect(page.locator("#qt-cmdk-input")).toBeFocused();
  await expect(page.locator(".qt-cmdk-item").first()).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".qt-cmdk-item").nth(1)).toHaveClass(
    /is-active/,
  );
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(".qt-cmdk-item").first()).toHaveClass(
    /is-active/,
  );

  await page.locator("#qt-cmdk-input").fill(items[0].title);
  await expect(page.locator(".qt-cmdk-item").first()).toContainText(
    items[0].title,
  );

  await page.keyboard.press("Escape");
  await expect(page.locator("#qt-cmdk")).toBeHidden();

  await page.keyboard.press("Meta+k");
  await expect(page.locator(".qt-cmdk-item").first()).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/posts/${items[0].id}/?$`));
});

test("search page filters immediately from the URL query", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/search.json");
  const items = (await response.json()) as readonly {
    title: string;
  }[];
  const query = items[0].title;

  await page.goto(`/search?q=${encodeURIComponent(query)}`);

  await expect(page.locator("#search-input")).toHaveValue(query);
  await expect(page.locator(".qt-search-row").first()).toContainText(query);

  await page.locator("#search-input").fill("검색결과가절대없는문자열");
  await expect(page.locator("#search-empty")).toBeVisible();
});

test("404 search action opens the command palette", async ({ page }) => {
  await page.goto("/posts/missing-public-page");
  await page.locator(".qt-404-actions [data-cmdk-trigger]").click();

  await expect(page.locator("#qt-cmdk")).toBeVisible();
});
