import { expect, test } from "@playwright/test";
import {
  cleanupLocalAdmin,
  createLocalAdmin,
} from "./helpers/local-admin";

test.describe.configure({ mode: "serial" });

const created = {
  ideaPath: "",
  projectPath: "",
};

let admin: Awaited<ReturnType<typeof createLocalAdmin>>;

test.beforeAll(async () => {
  admin = await createLocalAdmin();
});

test.afterAll(async () => {
  if (admin) {
    await cleanupLocalAdmin(admin);
  }
});

async function login(page: Parameters<typeof test>[0]["page"], returnTo: string) {
  await page.goto(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  await page.getByLabel("이메일").fill(admin.email);
  await page.getByLabel("비밀번호").fill(admin.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(new RegExp(`${returnTo.replace("?", "\\?")}$`));
}

async function fillCommonFields(
  page: Parameters<typeof test>[0]["page"],
  values: Readonly<{ body: string; slug: string; title: string }>,
) {
  await page.getByLabel("제목").fill(values.title);
  await page.getByLabel("Slug").fill(values.slug);
  await page.getByLabel("본문 Markdown").fill(values.body);
}

test("admin creates, publishes, edits, and renames inline content", async ({
  page,
}) => {
  const postSlug = `e2e-post-${admin.suffix}`;
  const ideaSlug = `e2e-idea-${admin.suffix}`;
  const renamedIdeaSlug = `e2e-idea-renamed-${admin.suffix}`;
  const childSlug = `e2e-child-${admin.suffix}`;
  const projectSlug = `e2e-project-${admin.suffix}`;
  const ideaTitle = `E2E idea ${admin.suffix}`;

  await login(page, "/ideas?view=all");
  await expect(page.locator('[data-admin-action="write"]')).toBeVisible();
  await page.locator('[data-admin-action="write"]').click();
  await expect(page).toHaveURL(/\/write$/);
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "글", exact: true }).click();
  await expect(page.locator('select[name="categoryId"]')).toBeVisible();
  await expect(page.getByLabel("상위 아이디어")).toHaveCount(0);
  await expect(page.getByLabel("요약")).toHaveCount(0);

  await page.getByRole("button", { name: "아이디어", exact: true }).click();
  await expect(page.getByLabel("상위 아이디어")).toBeVisible();
  await expect(page.getByLabel("요약")).toHaveCount(0);

  await page.getByRole("button", { name: "프로젝트", exact: true }).click();
  await expect(page.getByLabel("요약")).toBeVisible();
  await expect(page.getByLabel("상태")).toBeVisible();
  await expect(page.getByLabel("상위 아이디어")).toHaveCount(0);

  await page.getByRole("button", { name: "글", exact: true }).click();
  await fillCommonFields(page, {
    body: "E2E post draft body",
    slug: postSlug,
    title: `E2E post ${admin.suffix}`,
  });
  await page.getByRole("button", { name: "초안 저장" }).click();
  await expect(page).toHaveURL(/\/write\/[0-9a-f-]+\?result=saved$/);
  await expect(page.getByText("유형 글")).toBeVisible();
  await expect(page.getByLabel("제목")).toHaveValue(`E2E post ${admin.suffix}`);

  await page.goto("/write");
  await page.getByRole("button", { name: "아이디어", exact: true }).click();
  await fillCommonFields(page, {
    body: "E2E idea body",
    slug: ideaSlug,
    title: ideaTitle,
  });
  await page.locator('select[name="categoryId"]').selectOption({ label: "Works" });
  await page.getByRole("button", { name: "발행" }).click();
  created.ideaPath = `/ideas/works/${ideaSlug}`;
  await expect(page).toHaveURL(new RegExp(`${created.ideaPath}$`));
  await expect(page.getByRole("link", { name: "콘텐츠 수정" })).toBeVisible();
  await page.getByRole("link", { name: "콘텐츠 수정" }).click();
  await expect(page.getByText("유형 아이디어")).toBeVisible();
  await expect(page.getByLabel("제목")).toHaveValue(ideaTitle);

  await page.goto("/write");
  await page.getByRole("button", { name: "프로젝트", exact: true }).click();
  await fillCommonFields(page, {
    body: "E2E project body",
    slug: projectSlug,
    title: `E2E project ${admin.suffix}`,
  });
  await page.getByLabel("요약").fill("E2E project summary");
  await page.getByRole("button", { name: "발행" }).click();
  created.projectPath = `/projects/${projectSlug}`;
  await expect(page).toHaveURL(new RegExp(`${created.projectPath}$`));
  await expect(page.getByRole("link", { name: "콘텐츠 수정" })).toBeVisible();
  await page.getByRole("link", { name: "콘텐츠 수정" }).click();
  await expect(page.getByText("유형 프로젝트")).toBeVisible();
  await expect(page.getByLabel("요약")).toHaveValue("E2E project summary");

  await page.goto("/write");
  await page.getByRole("button", { name: "아이디어", exact: true }).click();
  await fillCommonFields(page, {
    body: "E2E child body",
    slug: childSlug,
    title: `E2E child ${admin.suffix}`,
  });
  await page
    .getByLabel("상위 아이디어")
    .selectOption({ label: `${ideaTitle} · ${created.ideaPath}` });
  await page.getByRole("button", { name: "발행" }).click();
  const oldChildPath = `${created.ideaPath}/${childSlug}`;
  await expect(page).toHaveURL(new RegExp(`${oldChildPath}$`));
  await expect(page.getByRole("link", { name: "콘텐츠 수정" })).toBeVisible();

  await page.goto(created.ideaPath);
  await page.getByRole("link", { name: "콘텐츠 수정" }).click();
  await page.getByLabel("Slug").fill(renamedIdeaSlug);
  await page.getByRole("button", { name: "발행" }).click();
  const renamedIdeaPath = `/ideas/works/${renamedIdeaSlug}`;
  const renamedChildPath = `${renamedIdeaPath}/${childSlug}`;
  await expect(page).toHaveURL(new RegExp(`${renamedIdeaPath}$`));

  await page.goto(created.ideaPath);
  await expect(page).toHaveURL(new RegExp(`${renamedIdeaPath}$`));
  await page.goto(oldChildPath);
  await expect(page).toHaveURL(new RegExp(`${renamedChildPath}$`));
});

test("guest does not see authoring actions", async ({ page }) => {
  await page.goto(created.projectPath);
  await expect(page.locator('[data-admin-action="write"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "콘텐츠 수정" })).toHaveCount(0);
});
