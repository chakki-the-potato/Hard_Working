import { notFound } from "next/navigation";
import { ContentEditorForm } from "@/components/editor/content-editor-form";
import "@/components/editor/editor.css";
import { PostAssetManager } from "@/components/editor/post-asset-manager";
import { PostDeleteForm } from "@/components/editor/post-delete-form";
import {
  WriterOverlay,
  type WriterOverlayMode,
} from "@/components/writer/writer-overlay";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { listPostAssets } from "@/lib/content/admin-asset-queries";
import {
  getContentDraft,
  listContentEditorOptions,
} from "@/lib/content/content-editor-queries";
import type { ContentKind } from "@/lib/content/content-editor-types";

type ContentWriterProps = Readonly<{
  initialKind?: ContentKind;
  itemId?: string;
  mode: WriterOverlayMode;
  result?: string;
}>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESULT_MESSAGES: Readonly<Record<string, string>> = {
  saved: "초안을 저장했습니다.",
  published: "콘텐츠를 발행하고 다음 수정을 위한 새 초안을 만들었습니다.",
  "asset-uploaded": "이미지를 업로드했습니다.",
  "asset-deleted": "이미지를 삭제했습니다.",
  "asset-deleted-with-storage-warning":
    "이미지 정보는 삭제했지만 Storage 파일 정리가 완료되지 않았습니다.",
};

export async function ContentWriter({
  initialKind,
  itemId,
  mode,
  result,
}: ContentWriterProps) {
  if (itemId && !UUID_PATTERN.test(itemId)) {
    notFound();
  }

  const writerPath = itemId ? `/write/${itemId}` : "/write";
  const { supabase } = await requireAdminSession(writerPath);
  const [options, draft, assets] = await Promise.all([
    listContentEditorOptions(supabase),
    itemId ? getContentDraft(supabase, itemId) : Promise.resolve(null),
    itemId ? listPostAssets(supabase, itemId) : Promise.resolve([]),
  ]);

  if (itemId && !draft) {
    notFound();
  }

  const resultMessage = result ? RESULT_MESSAGES[result] : undefined;
  const isPostDraft = draft?.values.kind === "post";

  return (
    <WriterOverlay
      description={
        draft?.path ??
        "페이지를 떠나지 않고 글, 아이디어, 프로젝트를 작성할 수 있습니다."
      }
      mode={mode}
      title={draft ? "콘텐츠 수정." : "새 콘텐츠 작성."}
    >
      {resultMessage ? (
        <p className="admin-notice" role="status">
          {resultMessage}
        </p>
      ) : null}

      <ContentEditorForm
        initialKind={initialKind}
        initialValues={draft?.values ?? null}
        options={options}
      />

      {itemId && draft && isPostDraft ? (
        <>
          <PostAssetManager
            assets={assets}
            destination="writer"
            itemId={itemId}
          />
          <PostDeleteForm itemId={itemId} title={draft.values.title} />
        </>
      ) : null}
    </WriterOverlay>
  );
}
