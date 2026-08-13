import assert from "node:assert/strict";
import test from "node:test";
import { parseContentEditorFormData } from "../src/lib/content/content-editor-validation.ts";

const CATEGORY_ID = "10000000-0000-4000-8000-000000000001";
const PARENT_ID = "10000000-0000-4000-8000-000000000002";

function createForm(kind = "post") {
  const form = new FormData();
  form.set("kind", kind);
  form.set("slug", "unified-writer");
  form.set("title", "Unified writer");
  form.set("description", "Description");
  form.set("bodyMarkdown", "Body");
  form.set("intent", "save");
  form.set("editorDestination", "writer");
  return form;
}

test("parses a post with only post fields", () => {
  const form = createForm();
  form.set("categoryId", CATEGORY_ID);

  const result = parseContentEditorFormData(form);

  assert.deepEqual(result, {
    ok: true,
    input: {
      values: {
        kind: "post",
        itemId: null,
        slug: "unified-writer",
        categoryId: CATEGORY_ID,
        title: "Unified writer",
        description: "Description",
        bodyMarkdown: "Body",
      },
      publish: false,
      destination: "writer",
    },
  });
});

test("parses top-level and child ideas", () => {
  const topLevel = createForm("idea");
  topLevel.set("categoryId", CATEGORY_ID);
  const child = createForm("idea");
  child.set("parentItemId", PARENT_ID);

  const topResult = parseContentEditorFormData(topLevel);
  const childResult = parseContentEditorFormData(child);

  assert.equal(topResult.ok, true);
  assert.deepEqual(topResult.ok && topResult.input.values, {
    kind: "idea",
    itemId: null,
    slug: "unified-writer",
    categoryId: CATEGORY_ID,
    parentItemId: null,
    title: "Unified writer",
    description: "Description",
    bodyMarkdown: "Body",
  });
  assert.equal(childResult.ok, true);
  assert.deepEqual(childResult.ok && childResult.input.values, {
    kind: "idea",
    itemId: null,
    slug: "unified-writer",
    categoryId: "",
    parentItemId: PARENT_ID,
    title: "Unified writer",
    description: "Description",
    bodyMarkdown: "Body",
  });
});

test("parses a project without leaking idea fields", () => {
  const form = createForm("project");
  form.set("summary", "Summary");
  form.set("projectStatus", "active");
  form.set("projectSortOrder", "0");

  const result = parseContentEditorFormData(form);

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.input.values.kind, "project");
  assert.equal(result.ok && "parentItemId" in result.input.values, false);
  assert.deepEqual(result.ok && result.input.values, {
    kind: "project",
    itemId: null,
    slug: "unified-writer",
    categoryId: null,
    title: "Unified writer",
    description: "Description",
    bodyMarkdown: "Body",
    summary: "Summary",
    projectStatus: "active",
    projectSortOrder: 0,
    period: "",
    role: "",
    outcome: "",
    demoUrl: "",
    repositoryUrl: "",
  });
});

test("rejects an invalid kind without inventing values", () => {
  const form = createForm("note");
  const result = parseContentEditorFormData(form);

  assert.equal(result.ok, false);
  assert.deepEqual(!result.ok && result.state, {
    status: "error",
    message: "콘텐츠 유형을 선택해 주세요.",
    fieldErrors: { kind: "글, 아이디어, 프로젝트 중 하나를 선택해 주세요." },
    values: null,
  });
});

test("preserves normalized post values while reporting common field errors", () => {
  const form = createForm();
  form.set("itemId", "invalid");
  form.set("slug", "Invalid Slug");
  form.set("categoryId", "invalid");
  form.set("title", " ");
  form.set("description", "d".repeat(501));
  form.set("bodyMarkdown", "b".repeat(500001));

  const result = parseContentEditorFormData(form);

  assert.equal(result.ok, false);
  assert.deepEqual(!result.ok && result.state.fieldErrors, {
    itemId: "수정할 콘텐츠 정보를 확인할 수 없습니다.",
    slug: "영문 소문자, 숫자, 하이픈만 사용해 120자 이내로 입력해 주세요.",
    categoryId: "카테고리를 선택해 주세요.",
    title: "제목을 200자 이내로 입력해 주세요.",
    description: "설명을 500자 이내로 입력해 주세요.",
    bodyMarkdown: "본문은 500,000자 이내로 입력해 주세요.",
  });
  assert.equal(!result.ok && result.state.values?.slug, "invalid slug");
});

test("requires a body only when publishing", () => {
  const form = createForm();
  form.set("categoryId", CATEGORY_ID);
  form.set("bodyMarkdown", " ");
  form.set("intent", "publish");

  const result = parseContentEditorFormData(form);

  assert.equal(result.ok, false);
  assert.equal(
    !result.ok && result.state.fieldErrors.bodyMarkdown,
    "발행하려면 본문을 입력해 주세요.",
  );
});

test("requires a category for a top-level idea but not a child", () => {
  const topLevel = createForm("idea");
  const child = createForm("idea");
  child.set("parentItemId", PARENT_ID);
  const invalidChild = createForm("idea");
  invalidChild.set("parentItemId", "invalid");

  const topResult = parseContentEditorFormData(topLevel);
  const childResult = parseContentEditorFormData(child);
  const invalidChildResult = parseContentEditorFormData(invalidChild);

  assert.equal(topResult.ok, false);
  assert.equal(
    !topResult.ok && topResult.state.fieldErrors.categoryId,
    "최상위 아이디어의 카테고리를 선택해 주세요.",
  );
  assert.equal(childResult.ok, true);
  assert.equal(invalidChildResult.ok, false);
  assert.equal(
    !invalidChildResult.ok && invalidChildResult.state.fieldErrors.parentItemId,
    "상위 아이디어 정보를 확인해 주세요.",
  );
});

test("validates project summary status sort order and HTTPS URLs", () => {
  const form = createForm("project");
  form.set("summary", " ");
  form.set("projectStatus", "finished");
  form.set("projectSortOrder", "1.5");
  form.set("demoUrl", "http://example.com");
  form.set("repositoryUrl", "not-a-url");

  const result = parseContentEditorFormData(form);

  assert.equal(result.ok, false);
  assert.deepEqual(!result.ok && result.state.fieldErrors, {
    summary: "프로젝트 요약을 입력해 주세요.",
    projectStatus: "프로젝트 상태를 선택해 주세요.",
    projectSortOrder: "정렬 순서는 0 이상의 정수로 입력해 주세요.",
    demoUrl: "HTTPS 주소를 입력해 주세요.",
    repositoryUrl: "HTTPS 주소를 입력해 주세요.",
  });
});

test("rejects invalid writer metadata", () => {
  const form = createForm();
  form.set("categoryId", CATEGORY_ID);
  form.set("editorDestination", "admin");

  const result = parseContentEditorFormData(form);

  assert.equal(result.ok, false);
  assert.equal(
    !result.ok && result.state.message,
    "작성 화면 정보를 확인할 수 없습니다.",
  );
});
