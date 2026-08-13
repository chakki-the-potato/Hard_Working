"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { isSaveContentRpcRow } from "@/lib/content/content-editor-rpc";
import type {
  ContentEditorActionState,
  ContentEditorValues,
} from "@/lib/content/content-editor-types";
import { parseContentEditorFormData } from "@/lib/content/content-editor-validation";

function getRpcParams(values: ContentEditorValues, publish: boolean) {
  return {
    p_item_id: values.itemId,
    p_kind: values.kind,
    p_slug: values.slug,
    p_category_id: values.categoryId || null,
    p_parent_item_id: values.kind === "idea" ? values.parentItemId : null,
    p_title: values.title,
    p_description: values.description || null,
    p_summary: values.kind === "project" ? values.summary : null,
    p_body_markdown: values.bodyMarkdown,
    p_demo_url: values.kind === "project" ? values.demoUrl || null : null,
    p_repository_url:
      values.kind === "project" ? values.repositoryUrl || null : null,
    p_role: values.kind === "project" ? values.role || null : null,
    p_period: values.kind === "project" ? values.period || null : null,
    p_outcome: values.kind === "project" ? values.outcome || null : null,
    p_project_status:
      values.kind === "project" ? values.projectStatus : null,
    p_project_sort_order:
      values.kind === "project" ? values.projectSortOrder : 0,
    p_publish: publish,
  };
}

export async function saveContentAction(
  _previousState: ContentEditorActionState,
  formData: FormData,
): Promise<ContentEditorActionState> {
  const parsed = parseContentEditorFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  const { values, publish } = parsed.input;
  const { supabase } = await requireAdminSession(
    values.itemId ? `/write/${values.itemId}` : "/write",
  );
  const { data, error } = await supabase.rpc(
    "save_content_draft",
    getRpcParams(values, publish),
  );

  if (error) {
    console.error("Supabase content draft save failed", {
      operation: publish ? "publish content" : "save content draft",
      kind: values.kind,
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
          ? "이미 사용 중인 콘텐츠 경로입니다."
          : "콘텐츠를 저장하지 못했습니다. 입력 내용과 연결 상태를 확인해 주세요.",
      fieldErrors: {},
      values,
    };
  }

  const rawResult: unknown = Array.isArray(data) ? data[0] : data;

  if (!isSaveContentRpcRow(rawResult) || rawResult.kind !== values.kind) {
    console.error("Supabase content draft returned an invalid result", {
      operation: publish ? "publish content" : "save content draft",
      kind: values.kind,
      itemId: values.itemId,
      slug: values.slug,
      code: "invalid_result",
      details: null,
      hint: null,
      message: "Content RPC returned an invalid result",
    });

    return {
      status: "error",
      message: "저장 결과를 확인하지 못했습니다. 다시 시도해 주세요.",
      fieldErrors: {},
      values,
    };
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/ideas");
  revalidatePath("/projects");
  revalidatePath(rawResult.canonical_path);
  revalidatePath(`/write/${rawResult.item_id}`);

  const resultName = publish ? "published" : "saved";
  const destination = publish
    ? rawResult.canonical_path
    : `/write/${rawResult.item_id}?result=${resultName}`;
  redirect(destination);
}
