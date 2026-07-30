import type { ServerSupabaseClient } from "@/lib/auth/require-admin";
import type { AdminContentAsset } from "@/lib/content/admin-asset-types";
import { runAdminQueryWithRetry } from "@/lib/content/admin-queries";

type ContentAssetRow = Readonly<{
  id: string;
  bucket_id: string;
  storage_path: string;
  alt_text: string | null;
  mime_type: string | null;
  byte_size: number | null;
  created_at: string;
}>;

function escapeMarkdownAltText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("]", "\\]");
}

export async function listPostAssets(
  supabase: ServerSupabaseClient,
  itemId: string,
): Promise<readonly AdminContentAsset[]> {
  const rows = await runAdminQueryWithRetry(
    () =>
      supabase
        .from("content_assets")
        .select(
          "id, bucket_id, storage_path, alt_text, mime_type, byte_size, created_at",
        )
        .eq("content_item_id", itemId)
        .order("created_at", { ascending: false })
        .returns<ContentAssetRow[]>(),
    "list post assets",
  );

  return rows.map((row) => {
    const publicUrl = supabase.storage
      .from(row.bucket_id)
      .getPublicUrl(row.storage_path).data.publicUrl;
    const altText = row.alt_text ?? "";

    return {
      id: row.id,
      bucketId: row.bucket_id,
      storagePath: row.storage_path,
      altText,
      mimeType: row.mime_type ?? "application/octet-stream",
      byteSize: row.byte_size ?? 0,
      createdAt: row.created_at,
      publicUrl,
      markdown: `![${escapeMarkdownAltText(altText)}](${publicUrl})`,
    };
  });
}
