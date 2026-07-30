import { notFound } from "next/navigation";
import { PostAssetManager } from "@/components/editor/post-asset-manager";
import { PostEditorForm } from "@/components/editor/post-editor-form";
import "@/components/editor/editor.css";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { listPostAssets } from "@/lib/content/admin-asset-queries";
import {
  getPostDraft,
  listCategories,
} from "@/lib/content/admin-queries";
import { isUuid } from "@/lib/content/admin-validation";
import {
  WriterOverlay,
  type WriterOverlayMode,
} from "@/components/writer/writer-overlay";

type PostWriterProps = Readonly<{
  itemId?: string;
  mode: WriterOverlayMode;
  result?: string;
}>;

const RESULT_MESSAGES: Readonly<Record<string, string>> = {
  saved: "초안을 저장했습니다.",
  published: "글을 발행하고 다음 수정을 위한 새 초안을 만들었습니다.",
  "asset-uploaded": "이미지를 업로드했습니다.",
  "asset-deleted": "이미지를 삭제했습니다.",
  "asset-deleted-with-storage-warning":
    "이미지 정보는 삭제했지만 Storage 파일 정리가 완료되지 않았습니다.",
};

export async function PostWriter({
  itemId,
  mode,
  result,
}: PostWriterProps) {
  if (itemId && !isUuid(itemId)) {
    notFound();
  }

  const writerPath = itemId ? `/write/${itemId}` : "/write";
  const { supabase } = await requireAdminSession(writerPath);
  const [categories, draft, assets] = await Promise.all([
    listCategories(supabase),
    itemId ? getPostDraft(supabase, itemId) : Promise.resolve(null),
    itemId ? listPostAssets(supabase, itemId) : Promise.resolve([]),
  ]);
  const defaultCategory = categories[0];

  if (!defaultCategory || (itemId && !draft)) {
    notFound();
  }

  const initialValues = draft?.values ?? {
    itemId: null,
    slug: "",
    categoryId: defaultCategory.id,
    title: "",
    description: "",
    bodyMarkdown: "",
  };
  const resultMessage = result ? RESULT_MESSAGES[result] : undefined;

  return (
    <WriterOverlay
      description={
        draft?.path ??
        "초안으로 저장한 뒤 이미지를 추가하고 준비가 끝나면 발행하세요."
      }
      mode={mode}
      title={draft ? "글 수정." : "새 글 작성."}
    >
      {resultMessage ? (
        <p className="admin-notice" role="status">
          {resultMessage}
        </p>
      ) : null}

      <PostEditorForm
        categories={categories}
        destination="writer"
        initialValues={initialValues}
      />

      {itemId ? (
        <PostAssetManager
          assets={assets}
          destination="writer"
          itemId={itemId}
        />
      ) : null}
    </WriterOverlay>
  );
}
