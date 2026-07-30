import type {
  PostEditorActionState,
  PostEditorField,
  PostEditorValues,
  SavePostInput,
} from "@/lib/content/admin-types";
import { parseEditorDestination } from "@/lib/content/editor-destination";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 120;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_BODY_LENGTH = 500000;

type ParsePostFormResult =
  | Readonly<{
      ok: true;
      input: SavePostInput;
    }>
  | Readonly<{
      ok: false;
      state: PostEditorActionState;
    }>;

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parsePostFormData(formData: FormData): ParsePostFormResult {
  const rawItemId = getFormString(formData, "itemId").trim();
  const values: PostEditorValues = {
    itemId: rawItemId || null,
    slug: getFormString(formData, "slug").trim().toLowerCase(),
    categoryId: getFormString(formData, "categoryId").trim(),
    title: getFormString(formData, "title").trim(),
    description: getFormString(formData, "description").trim(),
    bodyMarkdown: getFormString(formData, "bodyMarkdown"),
  };
  const publish = getFormString(formData, "intent") === "publish";
  const destination = parseEditorDestination(formData);
  const fieldErrors: Partial<Record<PostEditorField, string>> = {};

  if (!destination) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "작성 화면 정보를 확인할 수 없습니다.",
        fieldErrors,
        values,
      },
    };
  }

  if (values.itemId && !isUuid(values.itemId)) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "수정할 글 정보를 확인할 수 없습니다.",
        fieldErrors,
        values,
      },
    };
  }

  if (
    !values.slug ||
    values.slug.length > MAX_SLUG_LENGTH ||
    !SLUG_PATTERN.test(values.slug)
  ) {
    fieldErrors.slug =
      "영문 소문자, 숫자, 하이픈만 사용해 120자 이내로 입력해 주세요.";
  }

  if (!isUuid(values.categoryId)) {
    fieldErrors.categoryId = "카테고리를 선택해 주세요.";
  }

  if (!values.title || values.title.length > MAX_TITLE_LENGTH) {
    fieldErrors.title = "제목을 200자 이내로 입력해 주세요.";
  }

  if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = "설명을 500자 이내로 입력해 주세요.";
  }

  if (values.bodyMarkdown.length > MAX_BODY_LENGTH) {
    fieldErrors.bodyMarkdown = "본문은 500,000자 이내로 입력해 주세요.";
  } else if (publish && !values.bodyMarkdown.trim()) {
    fieldErrors.bodyMarkdown = "발행하려면 본문을 입력해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "입력 내용을 확인해 주세요.",
        fieldErrors,
        values,
      },
    };
  }

  return {
    ok: true,
    input: {
      values,
      publish,
      destination,
    },
  };
}
