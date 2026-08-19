import type {
  HypothesisDecision,
  HypothesisFailureType,
  HypothesisVerdict,
} from "@/lib/hypotheses/admin-types";

type HypothesisDecisionHistoryProps = Readonly<{
  decisions: readonly HypothesisDecision[];
}>;

const VERDICT_LABELS: Readonly<Record<HypothesisVerdict, string>> = {
  supported: "지지됨",
  rejected: "기각됨",
  inconclusive: "판단 보류",
  pivoted: "피봇",
};

const FAILURE_LABELS: Readonly<Record<HypothesisFailureType, string>> = {
  hypothesis_error: "가설 오류",
  experiment_design: "실험 설계",
  execution_incomplete: "실행 미완료",
  insufficient_data: "데이터 부족",
  external_condition: "외부 조건",
};

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

function decisionLabel(decision: HypothesisDecision): string {
  return decision.isCurrent
    ? `${VERDICT_LABELS[decision.verdict]} · 현재 판정`
    : `${VERDICT_LABELS[decision.verdict]} · 이전 판정`;
}

export function HypothesisDecisionHistory({
  decisions,
}: HypothesisDecisionHistoryProps) {
  if (decisions.length === 0) {
    return <p className="hypothesis-empty">아직 저장된 판정이 없습니다.</p>;
  }

  return (
    <ol className="hypothesis-decision-list">
      {decisions.map((decision) => (
        <li className="hypothesis-decision-item" key={decision.id}>
          <div className="hypothesis-timeline-meta">
            <span className="hypothesis-badge">{decisionLabel(decision)}</span>
            <time dateTime={decision.decidedAt}>
              {dateTimeFormatter.format(new Date(decision.decidedAt))}
            </time>
          </div>
          <p className="hypothesis-timeline-copy">{decision.reasoning}</p>
          {decision.confidenceAfter !== null ? (
            <p className="hypothesis-timeline-copy">
              판정 후 확신도 {decision.confidenceAfter}
            </p>
          ) : null}
          {decision.failureType ? (
            <p className="hypothesis-timeline-copy">
              실패 유형 {FAILURE_LABELS[decision.failureType]}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
