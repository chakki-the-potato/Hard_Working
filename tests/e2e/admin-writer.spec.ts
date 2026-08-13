import { expect, test } from "@playwright/test";

test("guest writer access returns to the requested writer after login", async ({
  page,
}) => {
  await page.goto("/write");

  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fwrite$/);
  await expect(page.locator('input[name="returnTo"]')).toHaveValue("/write");
});

test("login rejects an external return path", async ({ page }) => {
  await page.goto("/admin/login?next=https%3A%2F%2Fexample.com");

  await expect(page.locator('input[name="returnTo"]')).toHaveValue("/");
});

test("guest admin action preserves the current path and query", async ({
  page,
}) => {
  await page.goto("/ideas?view=all");

  await expect(page.locator('[data-admin-action="login"]')).toHaveAttribute(
    "href",
    "/admin/login?next=%2Fideas%3Fview%3Dall",
  );
});

test("legacy post writer routes forward to the inline writer", async ({
  page,
}) => {
  await page.goto("/admin/posts/new");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fwrite$/);

  await page.goto("/admin/posts/10000000-0000-4000-8000-000000000001");
  await expect(page).toHaveURL(
    /\/admin\/login\?next=%2Fwrite%2F10000000-0000-4000-8000-000000000001$/,
  );
});

test("admin root remains the hypothesis workspace entry", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
  await expect(page.getByRole("link", { name: "새 글 작성" })).toHaveCount(0);
});

test("admin status endpoint treats a missing session as a guest", async ({
  request,
}) => {
  const response = await request.get("/api/auth/admin-status");

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await expect(response.json()).resolves.toEqual({ isAdmin: false });
});
