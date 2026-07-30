import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { listAdminPosts } from "@/lib/content/admin-queries";

export const metadata: Metadata = {
  title: "관리자",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, user } = await requireAdminSession();
  const posts = await listAdminPosts(supabase);

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">Admin workspace</p>
          <h1 className="admin-title">콘텐츠 관리.</h1>
          <p className="admin-account">{user.email}</p>
        </div>
        <div className="admin-actions">
          <Link
            className="admin-button admin-button-secondary"
            href="/admin/import"
          >
            기존 콘텐츠 이전
          </Link>
          <Link
            className="admin-button admin-button-primary"
            href="/admin/posts/new"
          >
            새 글 작성
          </Link>
        </div>
      </header>

      <section className="admin-section" aria-label="글 목록">
        {posts.length === 0 ? (
          <div className="admin-empty">
            <h2 className="admin-empty-title">아직 작성한 글이 없습니다.</h2>
            <p className="admin-empty-description">
              첫 초안을 만들고 저장·발행 흐름을 시작하세요.
            </p>
            <Link
              className="admin-button admin-button-primary"
              href="/admin/posts/new"
            >
              첫 글 작성
            </Link>
          </div>
        ) : (
          <ul className="admin-list">
            {posts.map((post) => (
              <li className="admin-list-item" key={post.id}>
                <Link
                  className="admin-list-link"
                  href={`/admin/posts/${post.id}`}
                >
                  <div className="admin-list-meta">
                    <span
                      className={`admin-status ${
                        post.publishedAt
                          ? "admin-status-published"
                          : "admin-status-draft"
                      }`}
                    >
                      {post.publishedAt ? "발행됨" : "초안"}
                    </span>
                    <time dateTime={post.updatedAt}>
                      {new Intl.DateTimeFormat("ko-KR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Seoul",
                      }).format(new Date(post.updatedAt))}
                    </time>
                  </div>
                  <h2 className="admin-list-title">{post.title}</h2>
                  <span className="admin-list-path">{post.path}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
