import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { listPostAssets } from "@/lib/content/admin-asset-queries";
import {
  getPostDraft,
  listCategories,
} from "@/lib/content/admin-queries";
import { isUuid } from "@/lib/content/admin-validation";
import { PostAssetManager } from "../../_components/post-asset-manager";
import { PostDeleteForm } from "../../_components/post-delete-form";
import { PostEditorForm } from "../../_components/post-editor-form";

export const metadata: Metadata = {
  title: "글 수정",
};

export const dynamic = "force-dynamic";

type EditPostPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    result?: string;
  }>;
}>;

const RESULT_MESSAGES: Readonly<Record<string, string>> = {
  saved: "초안을 저장했습니다.",
  published: "글을 발행하고 다음 수정을 위한 새 초안을 만들었습니다.",
  "asset-uploaded": "이미지를 업로드했습니다.",
  "asset-deleted": "이미지를 삭제했습니다.",
  "asset-deleted-with-storage-warning":
    "이미지 정보는 삭제했지만 Storage 파일 정리가 완료되지 않았습니다.",
};

export default async function EditPostPage({
  params,
  searchParams,
}: EditPostPageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const { supabase } = await requireAdminSession();
  const [draft, categories, assets, query] = await Promise.all([
    getPostDraft(supabase, id),
    listCategories(supabase),
    listPostAssets(supabase, id),
    searchParams,
  ]);

  if (!draft) {
    notFound();
  }

  const resultMessage = query.result
    ? RESULT_MESSAGES[query.result]
    : undefined;

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">Edit post</p>
          <h1 className="admin-title">글 수정.</h1>
          <p className="admin-description">{draft.path}</p>
        </div>
        <div className="admin-actions">
          <Link
            className="admin-button admin-button-secondary"
            href="/admin"
          >
            목록으로
          </Link>
        </div>
      </header>

      {resultMessage ? (
        <p className="admin-notice" role="status">
          {resultMessage}
        </p>
      ) : null}

      <PostEditorForm
        categories={categories}
        initialValues={draft.values}
      />
      <PostAssetManager itemId={id} assets={assets} />
      <PostDeleteForm itemId={id} title={draft.values.title} />
    </main>
  );
}
