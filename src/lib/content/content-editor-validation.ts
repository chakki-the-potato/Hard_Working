import type {
  ContentEditorActionState,
  ContentEditorField,
  ContentEditorValues,
  ContentKind,
  ParseContentEditorFormResult,
} from "@/lib/content/content-editor-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTENT_KINDS = new Set<ContentKind>(["post", "idea", "project"]);
const PROJECT_STATUSES = new Set(["active", "paused", "archived"]);
const MAX_SLUG_LENGTH = 120;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_BODY_LENGTH = 500000;

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isContentKind(value: string): value is ContentKind {
  return CONTENT_KINDS.has(value as ContentKind);
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isHttpsUrl(value: string): boolean {
  if (!value) {
    return true;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      return false;
    }

    throw error;
  }
}

function createErrorState(
  values: ContentEditorValues | null,
  fieldErrors: Partial<Record<ContentEditorField, string>>,
  message = "입력 내용을 확인해 주세요.",
): ContentEditorActionState {
  return {
    status: "error",
    message,
    fieldErrors,
    values,
  };
}

export function parseContentEditorFormData(
  formData: FormData,
): ParseContentEditorFormResult {
  const kind = getFormString(formData, "kind").trim().toLowerCase();

  if (!isContentKind(kind)) {
    return {
      ok: false,
      state: createErrorState(
        null,
        { kind: "글, 아이디어, 프로젝트 중 하나를 선택해 주세요." },
        "콘텐츠 유형을 선택해 주세요.",
      ),
    };
  }

  const rawItemId = getFormString(formData, "itemId").trim();
  const commonValues = {
    itemId: rawItemId || null,
    slug: getFormString(formData, "slug").trim().toLowerCase(),
    title: getFormString(formData, "title").trim(),
    description: getFormString(formData, "description").trim(),
    bodyMarkdown: getFormString(formData, "bodyMarkdown"),
  } as const;
  const rawCategoryId = getFormString(formData, "categoryId").trim();
  const rawParentItemId = getFormString(formData, "parentItemId").trim();
  const rawProjectStatus = getFormString(formData, "projectStatus")
    .trim()
    .toLowerCase();
  const rawProjectSortOrder = getFormString(
    formData,
    "projectSortOrder",
  ).trim();
  const parsedProjectSortOrder = Number(rawProjectSortOrder);
  const values: ContentEditorValues =
    kind === "post"
      ? {
          ...commonValues,
          kind,
          categoryId: rawCategoryId,
        }
      : kind === "idea"
        ? {
            ...commonValues,
            kind,
            categoryId: rawCategoryId,
            parentItemId: rawParentItemId || null,
          }
        : {
            ...commonValues,
            kind,
            categoryId: rawCategoryId || null,
            summary: getFormString(formData, "summary").trim(),
            projectStatus: PROJECT_STATUSES.has(rawProjectStatus)
              ? (rawProjectStatus as "active" | "paused" | "archived")
              : "active",
            projectSortOrder: parsedProjectSortOrder,
            period: getFormString(formData, "period").trim(),
            role: getFormString(formData, "role").trim(),
            outcome: getFormString(formData, "outcome").trim(),
            demoUrl: getFormString(formData, "demoUrl").trim(),
            repositoryUrl: getFormString(formData, "repositoryUrl").trim(),
          };
  const fieldErrors: Partial<Record<ContentEditorField, string>> = {};

  if (getFormString(formData, "editorDestination") !== "writer") {
    return {
      ok: false,
      state: createErrorState(
        values,
        fieldErrors,
        "작성 화면 정보를 확인할 수 없습니다.",
      ),
    };
  }

  if (values.itemId && !isUuid(values.itemId)) {
    fieldErrors.itemId = "수정할 콘텐츠 정보를 확인할 수 없습니다.";
  }

  if (
    !values.slug ||
    values.slug.length > MAX_SLUG_LENGTH ||
    !SLUG_PATTERN.test(values.slug)
  ) {
    fieldErrors.slug =
      "영문 소문자, 숫자, 하이픈만 사용해 120자 이내로 입력해 주세요.";
  }

  if (!values.title || values.title.length > MAX_TITLE_LENGTH) {
    fieldErrors.title = "제목을 200자 이내로 입력해 주세요.";
  }

  if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = "설명을 500자 이내로 입력해 주세요.";
  }

  const publish = getFormString(formData, "intent") === "publish";
  if (values.bodyMarkdown.length > MAX_BODY_LENGTH) {
    fieldErrors.bodyMarkdown = "본문은 500,000자 이내로 입력해 주세요.";
  } else if (publish && !values.bodyMarkdown.trim()) {
    fieldErrors.bodyMarkdown = "발행하려면 본문을 입력해 주세요.";
  }

  if (values.kind === "post" && !isUuid(values.categoryId)) {
    fieldErrors.categoryId = "카테고리를 선택해 주세요.";
  }

  if (values.kind === "idea") {
    if (values.parentItemId && !isUuid(values.parentItemId)) {
      fieldErrors.parentItemId = "상위 아이디어 정보를 확인해 주세요.";
    } else if (!values.parentItemId && !isUuid(values.categoryId)) {
      fieldErrors.categoryId = "최상위 아이디어의 카테고리를 선택해 주세요.";
    }
  }

  if (values.kind === "project") {
    if (values.categoryId && !isUuid(values.categoryId)) {
      fieldErrors.categoryId = "카테고리 정보를 확인해 주세요.";
    }

    if (!values.summary) {
      fieldErrors.summary = "프로젝트 요약을 입력해 주세요.";
    }

    if (!PROJECT_STATUSES.has(rawProjectStatus)) {
      fieldErrors.projectStatus = "프로젝트 상태를 선택해 주세요.";
    }

    if (
      rawProjectSortOrder === "" ||
      !Number.isInteger(values.projectSortOrder) ||
      values.projectSortOrder < 0
    ) {
      fieldErrors.projectSortOrder =
        "정렬 순서는 0 이상의 정수로 입력해 주세요.";
    }

    if (!isHttpsUrl(values.demoUrl)) {
      fieldErrors.demoUrl = "HTTPS 주소를 입력해 주세요.";
    }

    if (!isHttpsUrl(values.repositoryUrl)) {
      fieldErrors.repositoryUrl = "HTTPS 주소를 입력해 주세요.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: createErrorState(values, fieldErrors),
    };
  }

  return {
    ok: true,
    input: {
      values,
      publish,
      destination: "writer",
    },
  };
}
