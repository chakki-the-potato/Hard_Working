import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { getHypothesisWriterPath } from "@/lib/hypotheses/writer-path";

export const metadata: Metadata = {
  title: "관리자",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requireAdminSession();

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">Admin</p>
          <h1 className="admin-title">관리자.</h1>
          <p className="admin-account">{user.email}</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-button admin-button-primary" href="/">
            사이트로
          </Link>
        </div>
      </header>

      <section className="admin-empty admin-section">
        <h2 className="admin-empty-title">
          작성은 사이트 안에서 이어서 합니다.
        </h2>
        <p className="admin-empty-description">
          글과 가설은 공개 페이지를 보면서 그대로 열 수 있습니다. 이 화면은
          로그인 확인과 콘텐츠 가져오기에만 씁니다.
        </p>
        <div className="admin-actions">
          <Link className="admin-button admin-button-primary" href="/write">
            콘텐츠 작성
          </Link>
          <Link
            className="admin-button admin-button-secondary"
            href={getHypothesisWriterPath()}
          >
            새 가설
          </Link>
          <Link
            className="admin-button admin-button-secondary"
            href="/hypotheses"
          >
            가설 목록
          </Link>
          <Link
            className="admin-button admin-button-secondary"
            href="/admin/import"
          >
            콘텐츠 가져오기
          </Link>
        </div>
      </section>
    </main>
  );
}
