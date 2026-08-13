import Link from "next/link";
import type { PublicHypothesis } from "@/lib/hypotheses/public-types";

type PublicHypothesesListProps = Readonly<{
  hypotheses: readonly PublicHypothesis[];
}>;

const STATUS_LABELS: Readonly<Record<PublicHypothesis["status"], string>> = {
  draft: "DRAFT",
  planned: "PLANNED",
  running: "RUNNING",
  concluded: "CONCLUDED",
  abandoned: "ABANDONED",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function PublicHypothesesList({ hypotheses }: PublicHypothesesListProps) {
  return (
    <main>
      <section className="qt-list-hero">
        <Link className="qt-back-link" href="/ideas">
          ← Ideas
        </Link>
        <span className="qt-mono qt-list-mono">// HYPOTHESES</span>
        <h1 className="qt-list-title">
          <span className="qt-list-hash">#</span> Hypotheses
        </h1>
        <p className="qt-list-desc">
          무엇을 믿었고, 어떻게 검증했으며, 어떤 판단으로 이어졌는지 기록합니다.
        </p>
        <span className="qt-mono qt-list-meta">
          {hypotheses.length} PUBLIC HYPOTHESES
        </span>
      </section>
      <div className="qt-hypothesis-list-wrap">
        {hypotheses.length > 0 ? (
          <ol className="qt-hypothesis-list">
            {hypotheses.map((hypothesis, index) => (
              <li key={hypothesis.id}>
                <Link
                  className="qt-hypothesis-card"
                  href={`/hypotheses/${hypothesis.slug}`}
                >
                  <div className="qt-hypothesis-card-meta">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{STATUS_LABELS[hypothesis.status]}</span>
                    <span>{hypothesis.category.name}</span>
                    <time dateTime={hypothesis.publishedAt}>
                      {formatDate(hypothesis.publishedAt)}
                    </time>
                  </div>
                  <h2>{hypothesis.statement}</h2>
                  <p>{hypothesis.publicSummary}</p>
                  {hypothesis.project ? (
                    <span className="qt-hypothesis-project">
                      // PROJECT · {hypothesis.project.title}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="qt-hypothesis-empty">아직 공개된 가설이 없습니다.</p>
        )}
      </div>
    </main>
  );
}
