import { expect, test } from "@playwright/test";

async function mockAdminStatus(
  page: Parameters<Parameters<typeof test>[1]>[0]["page"],
  isAdmin: boolean,
): Promise<void> {
  await page.route("**/api/auth/admin-status", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ isAdmin }),
      contentType: "application/json",
      status: 200,
    });
  });
}

test("public shell keeps the legacy desktop structure", async ({ page }) => {
  await mockAdminStatus(page, false);
  await page.goto("/");

  await expect(page.locator(".qt-header")).toBeVisible();
  await expect(page.locator(".qt-logo-name")).toHaveText("Hard_Working");
  await expect(page.locator(".qt-nav")).toBeVisible();
  await expect(page.locator(".qt-search")).toBeVisible();
  await expect(page.locator(".qt-page")).toBeVisible();
  await expect(page.locator(".qt-footer")).toBeVisible();
  await expect(page.locator(".qt-footer-social a")).toHaveCount(5);
  await expect(page.getByRole("link", { name: "관리자 로그인" })).toHaveAttribute(
    "href",
    "/admin/login?next=%2F",
  );
});

test("public shell keeps the legacy mobile controls", async ({ page }) => {
  await mockAdminStatus(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".qt-header")).toBeVisible();
  await expect(page.locator(".qt-nav")).toBeHidden();
  await expect(page.locator(".qt-search")).toBeHidden();
  await expect(page.locator(".qt-search-mobile")).toBeVisible();
  await expect(page.getByRole("link", { name: "관리자 로그인" })).toBeVisible();
  await expect(page.locator(".qt-footer")).toBeVisible();
});

test("authenticated visitors get the homepage write action", async ({
  page,
}) => {
  await mockAdminStatus(page, true);
  await page.goto("/");

  const writeAction = page.getByRole("link", { name: "글 작성" });

  await expect(writeAction).toHaveText("작성");
  await expect(writeAction).toHaveAttribute("href", "/write");
});
