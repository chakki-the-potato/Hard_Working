import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/hypotheses/activity-form";
import { DecisionForm } from "@/components/hypotheses/decision-form";
import { HypothesisForm } from "@/components/hypotheses/hypothesis-form";
import { HypothesisTimeline } from "@/components/hypotheses/hypothesis-timeline";
import { PublicationForm } from "@/components/hypotheses/publication-form";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  getAdminHypothesisDetail,
  listHypothesisAdminOptions,
  previewHypothesisPublication,
} from "@/lib/hypotheses/admin-queries";
import type {
  HypothesisDecision,
  HypothesisFailureType,
  HypothesisFormValues,
  HypothesisParentRelation,
  HypothesisVerdict,
} from "@/lib/hypotheses/admin-types";

export const metadata: Metadata = {
  title: "가설 상세",
};

export const dynamic = "force-dynamic";

type HypothesisDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string }>;
}>;

const RESULT_MESSAGES: Readonly<Record<string, string>> = {
  created: "가설을 만들었습니다.",
  saved: "가설을 저장했습니다.",
  "activity-created": "활동을 기록했습니다.",
  "activity-updated": "활동을 수정했습니다. 공개 중이었다면 재공개가 필요합니다.",
  "evidence-created": "증거를 기록했습니다.",
  "evidence-updated": "증거를 수정했습니다. 공개 중이었다면 재공개가 필요합니다.",
  concluded: "가설 판정을 저장했습니다.",
  "decision-corrected": "판정 정정 이력을 추가했습니다.",
  publish: "가설과 활동·증거를 공개했습니다.",
  publish_changes: "변경된 활동·증거를 공개했습니다.",
  unpublish: "가설을 비공개로 전환했습니다.",
};

const RELATION_LABELS: Readonly<Record<HypothesisParentRelation, string>> = {
  follow_up: "후속",
  pivot: "피봇",
  retry: "재시도",
  refinement: "구체화",
};

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

export default async function HypothesisDetailPage({
  params,
  searchParams,
}: HypothesisDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdminSession(`/admin/hypotheses/${id}`);
  const detail = await getAdminHypothesisDetail(supabase, id);

  if (!detail) {
    notFound();
  }

  const [options, preview] = await Promise.all([
    listHypothesisAdminOptions(supabase),
    previewHypothesisPublication(supabase, id),
  ]);
  const initialValues: HypothesisFormValues = {
    hypothesisId: detail.id,
    slug: detail.slug,
    projectItemId: detail.project?.id ?? "",
    categoryId: detail.category.id,
    parentHypothesisId: detail.parent?.id ?? "",
    parentRelation: detail.parent?.relation ?? "",
    statement: detail.statement,
    rationale: detail.rationale,
    successCriteria: detail.successCriteria,
    measurementPlan: detail.measurementPlan,
    status: detail.status,
    publicSummary: detail.publicSummary ?? "",
    confidenceBefore: detail.confidenceBefore?.toString() ?? "",
    startedAt: detail.startedAt ?? "",
    reviewDueAt: detail.reviewDueAt ?? "",
    tagIds: detail.tags.map((tag) => tag.id),
  };
  const resultMessage = query.result
    ? RESULT_MESSAGES[query.result]
    : undefined;

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">Hypothesis detail</p>
          <h1 className="admin-title">{detail.statement}</h1>
          <p className="admin-description">
            {detail.project?.title ?? "독립 가설"} · {detail.category.name}
          </p>
        </div>
        <div className="admin-actions">
          <Link
            className="admin-button admin-button-secondary"
            href="/admin/hypotheses"
          >
            목록으로
          </Link>
          <Link
            className="admin-button admin-button-secondary"
            href={`/admin/hypotheses/new?parent=${detail.id}&relation=follow_up`}
          >
            후속 가설
          </Link>
          <Link
            className="admin-button admin-button-secondary"
            href={`/admin/hypotheses/new?parent=${detail.id}&relation=pivot`}
          >
            피봇 가설
          </Link>
        </div>
      </header>

      {resultMessage ? (
        <p className="admin-notice" role="status">
          {resultMessage}
        </p>
      ) : null}

      {detail.parent ? (
        <p className="hypothesis-lineage">
          {RELATION_LABELS[detail.parent.relation]} 가설 · {detail.parent.id}
        </p>
      ) : null}

      <section className="admin-section" aria-labelledby="hypothesis-edit-title">
        <h2 className="admin-section-title" id="hypothesis-edit-title">
          가설 설정
        </h2>
        <HypothesisForm
          initialValues={initialValues}
          mode="edit"
          options={options}
        />
      </section>

      <section className="admin-panel" aria-labelledby="activity-create-title">
        <div>
          <p className="admin-kicker">Activity</p>
          <h2 className="admin-section-title" id="activity-create-title">
            활동 기록
          </h2>
        </div>
        <ActivityForm
          initialValues={{
            hypothesisId: detail.id,
            activityId: "",
            relatedContentItemId: "",
            activityType: "experiment",
            title: "",
            description: "",
            startedAt: "",
            completedAt: "",
          }}
          mode="create"
          options={options}
        />
      </section>

      <section className="admin-section" aria-labelledby="timeline-title">
        <h2 className="admin-section-title" id="timeline-title">
          활동과 증거
        </h2>
        <HypothesisTimeline
          activities={detail.activities}
          hypothesisId={detail.id}
          options={options}
        />
      </section>

      <section className="admin-panel" aria-labelledby="decision-title">
        <div>
          <p className="admin-kicker">Decision</p>
          <h2 className="admin-section-title" id="decision-title">
            판정 이력
          </h2>
        </div>
        {detail.decisions.length === 0 ? (
          <p className="hypothesis-empty">아직 저장된 판정이 없습니다.</p>
        ) : (
          <ol className="hypothesis-decision-list">
            {detail.decisions.map((decision) => (
              <li className="hypothesis-decision-item" key={decision.id}>
                <div className="hypothesis-timeline-meta">
                  <span className="hypothesis-badge">
                    {decisionLabel(decision)}
                  </span>
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
        )}
        {detail.status === "running" ? (
          <DecisionForm hypothesisId={detail.id} mode="conclude" />
        ) : null}
        {detail.status === "concluded" ? (
          <DecisionForm hypothesisId={detail.id} mode="correct" />
        ) : null}
      </section>

      <section className="admin-panel" aria-labelledby="publication-title">
        <div>
          <p className="admin-kicker">Publication</p>
          <h2 className="admin-section-title" id="publication-title">
            공개 관리
          </h2>
        </div>
        <PublicationForm
          hypothesisId={detail.id}
          preview={preview}
          publicSummary={detail.publicSummary}
          visibility={detail.visibility}
        />
      </section>
    </main>
  );
}
