import { expect, test } from "@playwright/test";

test("legacy public routes remain available", async ({ request }) => {
  for (const path of [
    "/ideas/works",
    "/posts/versions/thinking/karpathy-claude-coding-notes",
    "/api/search.json",
  ]) {
    const response = await request.get(path);

    expect(response.status(), path).toBe(200);
  }
});

test("search endpoint keeps the legacy payload contract", async ({
  request,
}) => {
  const response = await request.get("/api/search.json");
  const body: unknown = await response.json();

  expect(response.headers()["content-type"]).toContain("application/json");
  expect(Array.isArray(body)).toBe(true);
  expect(body).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        category: expect.any(String),
        categoryLabel: expect.any(String),
        description: expect.any(String),
        id: expect.any(String),
        path: expect.any(String),
        pubDate: expect.any(String),
        tags: expect.any(Array),
        title: expect.any(String),
      }),
    ]),
  );
});

test("current search route remains available", async ({ request }) => {
  const response = await request.get("/search?q=git");

  expect(response.status()).toBe(200);
});
