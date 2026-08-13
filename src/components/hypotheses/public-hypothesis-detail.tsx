import Link from "next/link";
import type {
  PublicHypothesis,
  PublicHypothesisStatus,
  PublicHypothesisVerdict,
} from "@/lib/hypotheses/public-types";

type PublicHypothesisDetailProps = Readonly<{
  hypothesis: PublicHypothesis;
}>;

const STATUS_LABELS: Readonly<Record<PublicHypothesisStatus, string>> = {
  draft: "DRAFT",
  planned: "PLANNED",
  running: "RUNNING",
  concluded: "CONCLUDED",
  abandoned: "ABANDONED",
};

const VERDICT_LABELS: Readonly<Record<PublicHypothesisVerdict, string>> = {
  supported: "지지됨",
  rejected: "기각됨",
  inconclusive: "판단 유보",
  pivoted: "피봇",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function PublicHypothesisDetail({
  hypothesis,
}: PublicHypothesisDetailProps) {
  return (
    <main className="qt-hypothesis-detail-wrap">
      <nav className="qt-hypothesis-detail-crumb" aria-label="가설 탐색">
        <Link href="/hypotheses">← Hypotheses</Link>
        <span>{STATUS_LABELS[hypothesis.status]}</span>
      </nav>

      <article className="qt-hypothesis-detail">
        <header className="qt-hypothesis-detail-head">
          <span className="qt-hypothesis-eyebrow">
            // {hypothesis.category.name.toUpperCase()} · {hypothesis.slug}.hypothesis
          </span>
          <h1>{hypothesis.statement}</h1>
          <div className="qt-hypothesis-detail-meta">
            <time dateTime={hypothesis.publishedAt}>
              PUBLISHED {formatDate(hypothesis.publishedAt)}
            </time>
            {hypothesis.project ? (
              <Link href={hypothesis.project.path}>
                PROJECT · {hypothesis.project.title}
              </Link>
            ) : null}
          </div>
          <p className="qt-hypothesis-public-summary">
            {hypothesis.publicSummary}
          </p>
        </header>

        <section className="qt-hypothesis-definition" aria-labelledby="hypothesis-definition-title">
          <h2 id="hypothesis-definition-title">검증 설계</h2>
          <dl>
            <div>
              <dt>SUCCESS CRITERIA</dt>
              <dd>{hypothesis.successCriteria}</dd>
            </div>
            {hypothesis.measurementPlan ? (
              <div>
                <dt>MEASUREMENT PLAN</dt>
                <dd>{hypothesis.measurementPlan}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        {hypothesis.decision ? (
          <section className="qt-hypothesis-decision" aria-labelledby="hypothesis-decision-title">
            <span>// DECISION</span>
            <h2 id="hypothesis-decision-title">
              {VERDICT_LABELS[hypothesis.decision.verdict]}
            </h2>
            <p>{hypothesis.decision.reasoning}</p>
            <dl>
              <div>
                <dt>DECIDED</dt>
                <dd>{formatDate(hypothesis.decision.decidedAt)}</dd>
              </div>
              {hypothesis.decision.confidenceAfter !== null ? (
                <div>
                  <dt>CONFIDENCE</dt>
                  <dd>{hypothesis.decision.confidenceAfter}%</dd>
                </div>
              ) : null}
              {hypothesis.decision.failureType ? (
                <div>
                  <dt>FAILURE TYPE</dt>
                  <dd>{hypothesis.decision.failureType}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        <section className="qt-hypothesis-activities" aria-labelledby="hypothesis-activities-title">
          <div className="qt-hypothesis-section-head">
            <span>// ACTIVITY &amp; EVIDENCE</span>
            <h2 id="hypothesis-activities-title">검증 기록</h2>
          </div>
          {hypothesis.activities.length > 0 ? (
            <ol>
              {hypothesis.activities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="qt-hypothesis-activity-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="qt-hypothesis-activity-body">
                    <div className="qt-hypothesis-activity-meta">
                      <span>{activity.activityType.toUpperCase()}</span>
                      <time dateTime={activity.startedAt}>
                        {formatDate(activity.startedAt)}
                      </time>
                    </div>
                    <h3>{activity.title}</h3>
                    {activity.description ? <p>{activity.description}</p> : null}
                    {activity.relatedContent ? (
                      <Link className="qt-hypothesis-related-content" href={activity.relatedContent.path}>
                        연결 기록 · {activity.relatedContent.title} →
                      </Link>
                    ) : null}
                    {activity.evidence.length > 0 ? (
                      <div className="qt-hypothesis-evidence-list">
                        {activity.evidence.map((evidence) => (
                          <section key={evidence.id}>
                            <div>
                              <span>{evidence.evidenceType.toUpperCase()}</span>
                              <time dateTime={evidence.observedAt}>
                                {formatDate(evidence.observedAt)}
                              </time>
                            </div>
                            <h4>{evidence.summary}</h4>
                            {evidence.detailsMarkdown ? (
                              <p className="qt-hypothesis-evidence-details">
                                {evidence.detailsMarkdown}
                              </p>
                            ) : null}
                            {evidence.sourceUrl ? (
                              <a href={evidence.sourceUrl} rel="noopener noreferrer" target="_blank">
                                출처 열기 ↗
                              </a>
                            ) : null}
                          </section>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="qt-hypothesis-empty">공개된 활동 기록이 없습니다.</p>
          )}
        </section>

        {hypothesis.relations.length > 0 ? (
          <section className="qt-hypothesis-relations" aria-labelledby="hypothesis-relations-title">
            <span>// NEXT HYPOTHESES</span>
            <h2 id="hypothesis-relations-title">이어진 가설</h2>
            <div>
              {hypothesis.relations.map((relation) => (
                <Link href={`/hypotheses/${relation.hypothesis.slug}`} key={`${relation.relation}-${relation.hypothesis.slug}`}>
                  <span>{relation.relation.toUpperCase()}</span>
                  <strong>{relation.hypothesis.statement}</strong>
                  <p>{relation.hypothesis.publicSummary}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {hypothesis.tags.length > 0 ? (
          <footer className="qt-hypothesis-tags">
            {hypothesis.tags.map((tag) => (
              <span key={tag.slug}>#{tag.name}</span>
            ))}
          </footer>
        ) : null}
      </article>
    </main>
  );
}
