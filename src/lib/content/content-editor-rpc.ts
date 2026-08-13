import type { ContentKind } from "@/lib/content/content-editor-types";

export type SaveContentRpcRow = Readonly<{
  item_id: string;
  kind: ContentKind;
  draft_version_id: string;
  published_version_id: string | null;
  canonical_path: string;
}>;

export function isSaveContentRpcRow(
  value: unknown,
): value is SaveContentRpcRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<SaveContentRpcRow>;
  return (
    typeof row.item_id === "string" &&
    (row.kind === "post" || row.kind === "idea" || row.kind === "project") &&
    typeof row.draft_version_id === "string" &&
    (row.published_version_id === null ||
      typeof row.published_version_id === "string") &&
    typeof row.canonical_path === "string" &&
    row.canonical_path.startsWith("/")
  );
}
