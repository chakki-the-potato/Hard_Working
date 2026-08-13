import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title: "가설 관리자",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requireAdminSession();

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">Hypothesis workspace</p>
          <h1 className="admin-title">가설 관리.</h1>
          <p className="admin-account">{user.email}</p>
        </div>
        <div className="admin-actions">
          <Link
            className="admin-button admin-button-primary"
            href="/admin/hypotheses"
          >
            가설 목록
          </Link>
          <Link
            className="admin-button admin-button-secondary"
            href="/admin/hypotheses/new"
          >
            새 가설
          </Link>
        </div>
      </header>

      <section className="admin-empty admin-section">
        <h2 className="admin-empty-title">가설 검증 기록을 관리합니다.</h2>
        <p className="admin-empty-description">
          가설, 활동, 증거, 판정, 공개 상태를 한곳에서 이어서 기록하세요.
        </p>
        <Link
          className="admin-button admin-button-primary"
          href="/admin/hypotheses"
        >
          가설 관리 시작
        </Link>
      </section>
    </main>
  );
}
