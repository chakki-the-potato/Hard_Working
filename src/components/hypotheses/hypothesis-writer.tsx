import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/hypotheses/activity-form";
import { DecisionForm } from "@/components/hypotheses/decision-form";
import { HypothesisDecisionHistory } from "@/components/hypotheses/hypothesis-decision-history";
import { HypothesisForm } from "@/components/hypotheses/hypothesis-form";
import { HypothesisTimeline } from "@/components/hypotheses/hypothesis-timeline";
import "@/components/hypotheses/hypothesis-admin.css";
import { PublicationForm } from "@/components/hypotheses/publication-form";
import "@/components/editor/editor.css";
import {
  WriterOverlay,
  type WriterOverlayMode,
} from "@/components/writer/writer-overlay";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  getAdminHypothesisDetail,
  listHypothesisAdminOptions,
  previewHypothesisPublication,
} from "@/lib/hypotheses/admin-queries";
import {
  hypothesisParentRelations,
  type HypothesisFormValues,
  type HypothesisParentRelation,
} from "@/lib/hypotheses/admin-types";
import {
  HYPOTHESIS_LIST_PATH,
  getHypothesisWriterPath,
} from "@/lib/hypotheses/writer-path";

type HypothesisWriterProps = Readonly<{
  hypothesisId?: string;
  mode: WriterOverlayMode;
  parentHypothesisId?: string;
  parentRelation?: string;
  result?: string;
}>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESULT_MESSAGES: Readonly<Record<string, string>> = {
  created: "가설을 만들었습니다.",
  saved: "가설을 저장했습니다.",
  "activity-created": "활동을 기록했습니다.",
  "activity-updated":
    "활동을 수정했습니다. 공개 중이었다면 재공개가 필요합니다.",
  "evidence-created": "증거를 기록했습니다.",
  "evidence-updated":
    "증거를 수정했습니다. 공개 중이었다면 재공개가 필요합니다.",
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

function parseParentRelation(
  value: string | undefined,
): HypothesisParentRelation | "" {
  return value &&
    hypothesisParentRelations.some((relation) => relation === value)
    ? (value as HypothesisParentRelation)
    : "";
}

export async function HypothesisWriter({
  hypothesisId,
  mode,
  parentHypothesisId,
  parentRelation,
  result,
}: HypothesisWriterProps) {
  if (hypothesisId && !UUID_PATTERN.test(hypothesisId)) {
    notFound();
  }

  const writerPath = getHypothesisWriterPath(hypothesisId);
  const { supabase } = await requireAdminSession(writerPath);
  const [options, detail] = await Promise.all([
    listHypothesisAdminOptions(supabase),
    hypothesisId
      ? getAdminHypothesisDetail(supabase, hypothesisId)
      : Promise.resolve(null),
  ]);

  if (hypothesisId && !detail) {
    notFound();
  }

  const resultMessage = result ? RESULT_MESSAGES[result] : undefined;

  if (!detail) {
    const defaultCategory = options.categories[0];

    if (!defaultCategory) {
      throw new Error("Hypothesis writer requires at least one category");
    }

    const relation = parseParentRelation(parentRelation);
    const initialValues: HypothesisFormValues = {
      hypothesisId: null,
      slug: "",
      projectItemId: "",
      categoryId: defaultCategory.id,
      parentHypothesisId: parentHypothesisId ?? "",
      parentRelation: parentHypothesisId ? relation : "",
      statement: "",
      rationale: "",
      successCriteria: "",
      measurementPlan: "",
      status: "planned",
      publicSummary: "",
      confidenceBefore: "",
      startedAt: "",
      reviewDueAt: "",
      tagIds: [],
    };

    return (
      <WriterOverlay
        closePath={HYPOTHESIS_LIST_PATH}
        description="검증할 문장과 성공 기준을 먼저 고정합니다."
        mode={mode}
        title="새 가설."
      >
        {resultMessage ? (
          <p className="admin-notice" role="status">
            {resultMessage}
          </p>
        ) : null}
        <HypothesisForm
          initialValues={initialValues}
          mode="create"
          options={options}
        />
      </WriterOverlay>
    );
  }

  const preview = await previewHypothesisPublication(supabase, detail.id);
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

  return (
    <WriterOverlay
      closePath={HYPOTHESIS_LIST_PATH}
      description={`/${detail.slug} · ${detail.project?.title ?? "독립 가설"} · ${detail.category.name}`}
      mode={mode}
      title="가설 수정."
    >
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
        <HypothesisDecisionHistory decisions={detail.decisions} />
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

      <nav className="hypothesis-writer-links" aria-label="이어지는 가설">
        <Link
          className="admin-button admin-button-secondary"
          href={`${getHypothesisWriterPath()}?parent=${detail.id}&relation=follow_up`}
        >
          후속 가설
        </Link>
        <Link
          className="admin-button admin-button-secondary"
          href={`${getHypothesisWriterPath()}?parent=${detail.id}&relation=pivot`}
        >
          피봇 가설
        </Link>
      </nav>
    </WriterOverlay>
  );
}
