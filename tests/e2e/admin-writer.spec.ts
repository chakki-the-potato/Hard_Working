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

  await expect(page.locator('input[name="returnTo"]')).toHaveValue("/admin");
});

test("admin status endpoint treats a missing session as a guest", async ({
  request,
}) => {
  const response = await request.get("/api/auth/admin-status");

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await expect(response.json()).resolves.toEqual({ isAdmin: false });
});
