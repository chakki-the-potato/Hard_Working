import type { Metadata } from "next";
import Link from "next/link";
import { PostEditorForm } from "@/components/editor/post-editor-form";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { listCategories } from "@/lib/content/admin-queries";

export const metadata: Metadata = {
  title: "새 글 작성",
};

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const { supabase } = await requireAdminSession();
  const categories = await listCategories(supabase);
  const defaultCategory = categories[0];

  if (!defaultCategory) {
    throw new Error("Post editor requires at least one category");
  }

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">New post</p>
          <h1 className="admin-title">새 글 작성.</h1>
          <p className="admin-description">
            먼저 초안으로 저장하고 준비가 끝나면 발행하세요.
          </p>
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

      <PostEditorForm
        categories={categories}
        initialValues={{
          itemId: null,
          slug: "",
          categoryId: defaultCategory.id,
          title: "",
          description: "",
          bodyMarkdown: "",
        }}
      />
    </main>
  );
}
