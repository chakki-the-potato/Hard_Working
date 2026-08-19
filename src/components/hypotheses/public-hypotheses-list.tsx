import Link from "next/link";
import type { ReactNode } from "react";
import { HypothesisListRow } from "@/components/hypotheses/hypothesis-list-row";
import type {
  PublicHypothesis,
  PublicHypothesisStatus,
} from "@/lib/hypotheses/public-types";
import {
  HYPOTHESIS_FILTER_STATUSES,
  HYPOTHESIS_STATUS_LABELS,
} from "@/lib/hypotheses/status-labels";
import { getHypothesisWriterPath } from "@/lib/hypotheses/writer-path";

type PublicHypothesesListProps = Readonly<{
  activeStatus: PublicHypothesisStatus | null;
  adminShelf?: ReactNode;
  canAuthor: boolean;
  hypotheses: readonly PublicHypothesis[];
}>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  })
    .format(new Date(value))
    .replace(/\.\s*/g, ".")
    .replace(/\.$/, "");
}

export function PublicHypothesesList({
  activeStatus,
  adminShelf,
  canAuthor,
  hypotheses,
}: PublicHypothesesListProps) {
  const statusCounts = new Map<PublicHypothesisStatus, number>();
  for (const hypothesis of hypotheses) {
    statusCounts.set(
      hypothesis.status,
      (statusCounts.get(hypothesis.status) ?? 0) + 1,
    );
  }
  const visible = activeStatus
    ? hypotheses.filter((hypothesis) => hypothesis.status === activeStatus)
    : hypotheses;
  const latestUpdate = hypotheses[0]?.publishedAt;

  return (
    <main>
      <section className="qt-list-hero">
        <span className="qt-mono qt-list-mono">// HYPOTHESES / VALIDATION</span>
        <h1 className="qt-list-title">
          <span className="qt-list-hash">#</span> Hypothesis
        </h1>
        <p className="qt-list-desc">
          무엇을 믿었고, 어떻게 검증했으며, 어떤 판단으로 이어졌는지 기록합니다.
        </p>
        <span className="qt-mono qt-list-meta">
          {hypotheses.length} HYPOTHESES
          {latestUpdate ? ` · LAST_UPDATE ${formatDate(latestUpdate)}` : ""}
        </span>
      </section>

      <section className="qt-list-chips qt-hypothesis-chips">
        <div aria-label="상태 필터" className="qt-tag-chips" role="navigation">
          <Link
            aria-current={activeStatus ? undefined : "page"}
            className={`qt-chip${activeStatus ? "" : " is-active"}`}
            href="/hypotheses"
          >
            전체
          </Link>
          {HYPOTHESIS_FILTER_STATUSES.map((status) => (
            <Link
              aria-current={activeStatus === status ? "page" : undefined}
              className={`qt-chip${activeStatus === status ? " is-active" : ""}`}
              href={`/hypotheses?status=${status}`}
              key={status}
            >
              {HYPOTHESIS_STATUS_LABELS[status]}
            </Link>
          ))}
        </div>
        {canAuthor ? (
          <Link className="qt-chip" href={getHypothesisWriterPath()}>
            + 새 가설
          </Link>
        ) : null}
      </section>

      <div className="qt-list-body">
        <section className="qt-list-main" aria-label="가설 목록">
          <div className="qt-list-thead">
            <span>NO</span>
            <span>STATEMENT</span>
            <span>STATUS/CAT</span>
            <span className="qt-list-thead-right">PUBLISHED</span>
          </div>
          {visible.length > 0 ? (
            <div className="qt-list-rows">
              {visible.map((hypothesis, index) => (
                <HypothesisListRow
                  hypothesis={hypothesis}
                  key={hypothesis.id}
                  number={visible.length - index}
                />
              ))}
            </div>
          ) : (
            <p className="qt-hypothesis-empty">
              {activeStatus
                ? "이 상태의 공개 가설이 없습니다."
                : "아직 공개된 가설이 없습니다."}
            </p>
          )}
          {adminShelf}
        </section>
        <aside className="qt-list-aside" aria-label="상태별 가설">
          <div className="qt-aside-inner">
            <Link
              aria-current={activeStatus ? undefined : "page"}
              className={`qt-aside-parent${activeStatus ? "" : " is-active"}`}
              href="/hypotheses"
            >
              // HYPOTHESES
            </Link>
            <div className="qt-aside-list">
              {HYPOTHESIS_FILTER_STATUSES.map((status) => (
                <Link
                  className="qt-aside-item"
                  href={`/hypotheses?status=${status}`}
                  key={status}
                >
                  <span className="qt-aside-name">
                    {HYPOTHESIS_STATUS_LABELS[status]}
                  </span>
                  <span className="qt-aside-count">
                    {statusCounts.get(status) ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
