"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/require-admin";
import type {
  PostEditorActionState,
  SavePostResult,
} from "@/lib/content/admin-types";
import { parsePostFormData } from "@/lib/content/admin-validation";

type SavePostRpcRow = Readonly<{
  item_id: string;
  draft_version_id: string;
  published_version_id: string | null;
}>;

function isSavePostRpcRow(value: unknown): value is SavePostRpcRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Readonly<Record<string, unknown>>;

  return (
    typeof row.item_id === "string" &&
    typeof row.draft_version_id === "string" &&
    (typeof row.published_version_id === "string" ||
      row.published_version_id === null)
  );
}

export async function savePostAction(
  _previousState: PostEditorActionState,
  formData: FormData,
): Promise<PostEditorActionState> {
  const parsed = parsePostFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  const { supabase } = await requireAdminSession();
  const { values, publish } = parsed.input;
  const { data, error } = await supabase.rpc("save_post_draft", {
    p_item_id: values.itemId,
    p_slug: values.slug,
    p_category_id: values.categoryId,
    p_title: values.title,
    p_description: values.description || null,
    p_body_markdown: values.bodyMarkdown,
    p_publish: publish,
  });

  if (error) {
    console.error("Supabase post draft save failed", {
      operation: publish ? "publish post" : "save post draft",
      itemId: values.itemId,
      slug: values.slug,
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });

    return {
      status: "error",
      message:
        error.code === "23505"
          ? "이미 사용 중인 글 경로입니다."
          : "글을 저장하지 못했습니다. 입력 내용과 연결 상태를 확인해 주세요.",
      fieldErrors: {},
      values,
    };
  }

  const rawResult: unknown = Array.isArray(data) ? data[0] : data;

  if (!isSavePostRpcRow(rawResult)) {
    console.error("Supabase post draft returned an invalid result", {
      operation: publish ? "publish post" : "save post draft",
      itemId: values.itemId,
    });

    return {
      status: "error",
      message: "저장 결과를 확인하지 못했습니다. 다시 시도해 주세요.",
      fieldErrors: {},
      values,
    };
  }

  const result: SavePostResult = {
    itemId: rawResult.item_id,
    draftVersionId: rawResult.draft_version_id,
    publishedVersionId: rawResult.published_version_id,
  };

  revalidatePath("/admin");
  revalidatePath(`/admin/posts/${result.itemId}`);
  redirect(
    `/admin/posts/${result.itemId}?result=${publish ? "published" : "saved"}`,
  );
}
