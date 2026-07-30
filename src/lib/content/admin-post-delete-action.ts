"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { removeStorageObjects } from "@/lib/content/admin-storage";
import type { AdminMutationActionState } from "@/lib/content/admin-types";
import { isUuid } from "@/lib/content/admin-validation";

type PostIdentityRow = Readonly<{
  id: string;
  path: string;
}>;

type PostAssetStorageRow = Readonly<{
  bucket_id: string;
  storage_path: string;
}>;

function getItemId(formData: FormData): string {
  const value = formData.get("itemId");
  return typeof value === "string" ? value.trim() : "";
}

export async function deletePostAction(
  _previousState: AdminMutationActionState,
  formData: FormData,
): Promise<AdminMutationActionState> {
  const itemId = getItemId(formData);

  if (!isUuid(itemId)) {
    return {
      status: "error",
      message: "삭제할 글 정보를 확인할 수 없습니다.",
    };
  }

  const { supabase } = await requireAdminSession();
  const { data: posts, error: postError } = await supabase
    .from("content_items")
    .select("id, path")
    .eq("id", itemId)
    .eq("kind", "post")
    .limit(1)
    .returns<PostIdentityRow[]>();
  const post = posts?.[0];

  if (postError || !post) {
    console.error("Supabase post lookup failed", {
      operation: "delete post",
      itemId,
      code: postError?.code ?? "missing_post",
      details: postError?.details ?? null,
      hint: postError?.hint ?? null,
      message: postError?.message ?? "Post not found",
    });
    return {
      status: "error",
      message: "삭제할 글을 찾지 못했습니다.",
    };
  }

  const { data: assets, error: assetError } = await supabase
    .from("content_assets")
    .select("bucket_id, storage_path")
    .eq("content_item_id", itemId)
    .returns<PostAssetStorageRow[]>();

  if (assetError || !assets) {
    console.error("Supabase post asset lookup failed", {
      operation: "delete post",
      itemId,
      path: post.path,
      code: assetError?.code ?? "missing_assets",
      details: assetError?.details ?? null,
      hint: assetError?.hint ?? null,
      message: assetError?.message ?? "Asset lookup returned no data",
    });
    return {
      status: "error",
      message: "글에 연결된 이미지 정보를 확인하지 못했습니다.",
    };
  }

  const { data: deletedPosts, error: deleteError } = await supabase
    .from("content_items")
    .delete()
    .eq("id", itemId)
    .eq("kind", "post")
    .select("id")
    .returns<Pick<PostIdentityRow, "id">[]>();

  if (deleteError || deletedPosts?.length !== 1) {
    console.error("Supabase post delete failed", {
      operation: "delete post",
      itemId,
      path: post.path,
      code: deleteError?.code ?? "not_deleted",
      details: deleteError?.details ?? null,
      hint: deleteError?.hint ?? null,
      message: deleteError?.message ?? "No post row was deleted",
    });
    return {
      status: "error",
      message: "글을 삭제하지 못했습니다. 다시 시도해 주세요.",
    };
  }

  const failures = await removeStorageObjects(
    supabase,
    assets.map((asset) => ({
      bucketId: asset.bucket_id,
      storagePath: asset.storage_path,
    })),
  );

  for (const failure of failures) {
    console.error("Supabase post asset cleanup failed", {
      operation: "delete post storage assets",
      itemId,
      path: post.path,
      bucketId: failure.bucketId,
      storagePaths: failure.storagePaths,
      message: failure.error.message,
      statusCode: failure.error.statusCode,
    });
  }

  revalidatePath("/admin");
  revalidatePath(post.path);
  redirect(
    `/admin?result=${
      failures.length > 0 ? "deleted-with-storage-warning" : "deleted"
    }`,
  );
}
