import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { listAdminHypotheses } from "@/lib/hypotheses/admin-queries";
import type {
  HypothesisStatus,
  HypothesisVisibility,
} from "@/lib/hypotheses/admin-types";

export const metadata: Metadata = {
  title: "가설 관리",
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Readonly<Record<HypothesisStatus, string>> = {
  draft: "초안",
  planned: "계획",
  running: "진행 중",
  concluded: "판정 완료",
  abandoned: "중단",
};

const VISIBILITY_LABELS: Readonly<Record<HypothesisVisibility, string>> = {
  private: "비공개",
  public: "공개",
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "Asia/Seoul",
});

export default async function HypothesesPage() {
  const { supabase } = await requireAdminSession("/admin/hypotheses");
  const hypotheses = await listAdminHypotheses(supabase);

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">Hypothesis journal</p>
          <h1 className="admin-title">가설 관리.</h1>
          <p className="admin-description">
            가설과 활동, 증거, 판정을 한 흐름으로 기록합니다.
          </p>
        </div>
        <div className="admin-actions">
          <Link className="admin-button admin-button-secondary" href="/admin">
            콘텐츠 관리
          </Link>
          <Link
            className="admin-button admin-button-primary"
            href="/admin/hypotheses/new"
          >
            새 가설
          </Link>
        </div>
      </header>

      <section className="admin-section" aria-label="가설 목록">
        {hypotheses.length === 0 ? (
          <div className="admin-empty">
            <h2 className="admin-empty-title">아직 기록한 가설이 없습니다.</h2>
            <p className="admin-empty-description">
              검증할 문장과 성공 기준부터 기록하세요.
            </p>
            <Link
              className="admin-button admin-button-primary"
              href="/admin/hypotheses/new"
            >
              첫 가설 만들기
            </Link>
          </div>
        ) : (
          <ul className="admin-list">
            {hypotheses.map((hypothesis) => (
              <li className="admin-list-item" key={hypothesis.id}>
                <Link
                  className="admin-list-link"
                  href={`/admin/hypotheses/${hypothesis.id}`}
                >
                  <div className="admin-list-meta">
                    <span
                      className={`admin-status hypothesis-status-${hypothesis.status}`}
                    >
                      {STATUS_LABELS[hypothesis.status]}
                    </span>
                    <span
                      className={`admin-status hypothesis-visibility-${hypothesis.visibility}`}
                    >
                      {VISIBILITY_LABELS[hypothesis.visibility]}
                    </span>
                    <span>{hypothesis.category.name}</span>
                    {hypothesis.project ? (
                      <span>{hypothesis.project.title}</span>
                    ) : null}
                  </div>
                  <h2 className="admin-list-title">{hypothesis.statement}</h2>
                  <span className="admin-list-path">/{hypothesis.slug}</span>
                  <div className="admin-list-meta">
                    {hypothesis.reviewDueAt ? (
                      <span>
                        검토 {dateFormatter.format(new Date(hypothesis.reviewDueAt))}
                      </span>
                    ) : null}
                    <time dateTime={hypothesis.updatedAt}>
                      수정 {dateFormatter.format(new Date(hypothesis.updatedAt))}
                    </time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
