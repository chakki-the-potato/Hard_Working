"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  CONTENT_ASSET_BUCKET,
  parseAssetIdentity,
  parseUploadAssetFormData,
} from "@/lib/content/admin-asset-validation";
import { removeStorageObjects } from "@/lib/content/admin-storage";
import type { AdminMutationActionState } from "@/lib/content/admin-types";

type ContentItemIdentityRow = Readonly<{
  id: string;
}>;

type ContentAssetIdentityRow = Readonly<{
  id: string;
  bucket_id: string;
  storage_path: string;
}>;

function logStorageCleanupFailures(
  operation: string,
  itemId: string,
  failures: Awaited<ReturnType<typeof removeStorageObjects>>,
): void {
  for (const failure of failures) {
    console.error("Supabase Storage cleanup failed", {
      operation,
      itemId,
      bucketId: failure.bucketId,
      storagePaths: failure.storagePaths,
      message: failure.error.message,
      statusCode: failure.error.statusCode,
    });
  }
}

export async function uploadAssetAction(
  _previousState: AdminMutationActionState,
  formData: FormData,
): Promise<AdminMutationActionState> {
  const parsed = await parseUploadAssetFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  const { supabase, user } = await requireAdminSession();
  const { itemId, altText, file, storagePath } = parsed.input;
  const { data: items, error: itemError } = await supabase
    .from("content_items")
    .select("id")
    .eq("id", itemId)
    .eq("kind", "post")
    .limit(1)
    .returns<ContentItemIdentityRow[]>();

  if (itemError || !items?.[0]) {
    console.error("Supabase asset parent lookup failed", {
      operation: "upload content asset",
      itemId,
      code: itemError?.code ?? "missing_item",
      details: itemError?.details ?? null,
      hint: itemError?.hint ?? null,
      message: itemError?.message ?? "Post not found",
    });

    return {
      status: "error",
      message: "이미지를 연결할 글을 찾지 못했습니다.",
    };
  }

  const { error: uploadError } = await supabase.storage
    .from(CONTENT_ASSET_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase Storage upload failed", {
      operation: "upload content asset",
      itemId,
      bucketId: CONTENT_ASSET_BUCKET,
      storagePath,
      mimeType: file.type,
      byteSize: file.size,
      message: uploadError.message,
      statusCode: uploadError.statusCode,
    });

    return {
      status: "error",
      message: "이미지를 업로드하지 못했습니다. 파일과 연결 상태를 확인해 주세요.",
    };
  }

  const { error: insertError } = await supabase.from("content_assets").insert({
    content_item_id: itemId,
    bucket_id: CONTENT_ASSET_BUCKET,
    storage_path: storagePath,
    alt_text: altText || null,
    mime_type: file.type,
    byte_size: file.size,
    created_by: user.id,
  });

  if (insertError) {
    console.error("Supabase content asset insert failed", {
      operation: "save content asset metadata",
      itemId,
      bucketId: CONTENT_ASSET_BUCKET,
      storagePath,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint,
      message: insertError.message,
    });

    const failures = await removeStorageObjects(supabase, [
      {
        bucketId: CONTENT_ASSET_BUCKET,
        storagePath,
      },
    ]);
    logStorageCleanupFailures("rollback content asset upload", itemId, failures);

    return {
      status: "error",
      message: "이미지 정보를 저장하지 못했습니다. 다시 시도해 주세요.",
    };
  }

  revalidatePath(`/admin/posts/${itemId}`);
  redirect(`/admin/posts/${itemId}?result=asset-uploaded`);
}

export async function deleteAssetAction(
  _previousState: AdminMutationActionState,
  formData: FormData,
): Promise<AdminMutationActionState> {
  const parsed = parseAssetIdentity(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.message,
    };
  }

  const { supabase } = await requireAdminSession();
  const { itemId, assetId } = parsed;
  const { data: assets, error: assetError } = await supabase
    .from("content_assets")
    .select("id, bucket_id, storage_path")
    .eq("id", assetId)
    .eq("content_item_id", itemId)
    .limit(1)
    .returns<ContentAssetIdentityRow[]>();
  const asset = assets?.[0];

  if (assetError || !asset) {
    console.error("Supabase content asset lookup failed", {
      operation: "delete content asset",
      itemId,
      assetId,
      code: assetError?.code ?? "missing_asset",
      details: assetError?.details ?? null,
      hint: assetError?.hint ?? null,
      message: assetError?.message ?? "Asset not found",
    });
    return {
      status: "error",
      message: "삭제할 이미지 정보를 찾지 못했습니다.",
    };
  }

  const { data: deletedAssets, error: deleteError } = await supabase
    .from("content_assets")
    .delete()
    .eq("id", assetId)
    .eq("content_item_id", itemId)
    .select("id")
    .returns<ContentItemIdentityRow[]>();

  if (deleteError || deletedAssets?.length !== 1) {
    console.error("Supabase content asset delete failed", {
      operation: "delete content asset metadata",
      itemId,
      assetId,
      code: deleteError?.code ?? "not_deleted",
      details: deleteError?.details ?? null,
      hint: deleteError?.hint ?? null,
      message: deleteError?.message ?? "No asset row was deleted",
    });
    return {
      status: "error",
      message: "이미지를 삭제하지 못했습니다. 다시 시도해 주세요.",
    };
  }

  const failures = await removeStorageObjects(supabase, [
    {
      bucketId: asset.bucket_id,
      storagePath: asset.storage_path,
    },
  ]);
  logStorageCleanupFailures("delete content asset object", itemId, failures);

  revalidatePath(`/admin/posts/${itemId}`);
  redirect(
    `/admin/posts/${itemId}?result=${
      failures.length > 0 ? "asset-deleted-with-storage-warning" : "asset-deleted"
    }`,
  );
}
