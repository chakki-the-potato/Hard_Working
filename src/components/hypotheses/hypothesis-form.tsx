"use client";

import { useActionState } from "react";
import type {
  HypothesisAdminOptions,
  HypothesisFormActionState,
  HypothesisFormValues,
  HypothesisStatus,
} from "@/lib/hypotheses/admin-types";
import {
  createHypothesisAction,
  updateHypothesisAction,
} from "@/lib/hypotheses/admin-actions";

type HypothesisFormProps = Readonly<{
  options: HypothesisAdminOptions;
  initialValues: HypothesisFormValues;
  mode: "create" | "edit";
}>;

const createStatuses: readonly HypothesisStatus[] = ["draft", "planned", "running"];
const statusLabels: Readonly<Record<HypothesisStatus, string>> = {
  draft: "초안",
  planned: "계획됨",
  running: "진행 중",
  concluded: "종료됨",
  abandoned: "중단됨",
};

function toDateTimeLocal(value: string): string {
  return value ? value.slice(0, 16) : "";
}

export function HypothesisForm({ options, initialValues, mode }: HypothesisFormProps) {
  const initialState: HypothesisFormActionState = { status: "idle", message: null, fieldErrors: {}, values: initialValues };
  const action = mode === "create" ? createHypothesisAction : updateHypothesisAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const statusOptions = mode === "create"
    ? createStatuses
    : initialValues.status === "concluded" || initialValues.status === "abandoned"
      ? [initialValues.status as HypothesisStatus]
      : initialValues.status === "running"
        ? ["running", "abandoned"] as const
        : initialValues.status === "planned"
          ? ["planned", "running", "abandoned"] as const
          : ["draft", "planned", "running", "abandoned"] as const;

  return (
    <form action={formAction} className="admin-editor hypothesis-form">
      <input name="hypothesisId" type="hidden" value={state.values.hypothesisId ?? ""} />
      {state.message ? <p className="admin-notice" role="alert">{state.message}</p> : null}
      <div className="admin-editor-grid">
        <label className="admin-field" htmlFor="hypothesis-slug"><span className="admin-field-label">Slug</span><input aria-describedby={state.fieldErrors.slug ? "hypothesis-slug-error" : undefined} autoCapitalize="none" className="admin-input" defaultValue={state.values.slug} id="hypothesis-slug" maxLength={120} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required type="text" />{state.fieldErrors.slug ? <span className="admin-field-error" id="hypothesis-slug-error">{state.fieldErrors.slug}</span> : null}</label>
        <label className="admin-field" htmlFor="hypothesis-project"><span className="admin-field-label">프로젝트</span><select className="admin-select" defaultValue={state.values.projectItemId} id="hypothesis-project" name="projectItemId"><option value="">독립 가설</option>{options.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
        <label className="admin-field" htmlFor="hypothesis-category"><span className="admin-field-label">카테고리</span><select aria-describedby={state.fieldErrors.categoryId ? "hypothesis-category-error" : undefined} className="admin-select" defaultValue={state.values.categoryId} id="hypothesis-category" name="categoryId" required><option value="">선택</option>{options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{state.fieldErrors.categoryId ? <span className="admin-field-error" id="hypothesis-category-error">{state.fieldErrors.categoryId}</span> : null}</label>
        <label className="admin-field" htmlFor="hypothesis-status"><span className="admin-field-label">상태</span><select aria-describedby={state.fieldErrors.status ? "hypothesis-status-error" : undefined} className="admin-select" defaultValue={state.values.status} id="hypothesis-status" name="status" required>{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>{state.fieldErrors.status ? <span className="admin-field-error" id="hypothesis-status-error">{state.fieldErrors.status}</span> : null}</label>
        <label className="admin-field" htmlFor="hypothesis-parent"><span className="admin-field-label">상위 가설 ID</span><input aria-describedby={state.fieldErrors.parentHypothesisId ? "hypothesis-parent-error" : undefined} className="admin-input" defaultValue={state.values.parentHypothesisId} disabled={mode === "edit"} id="hypothesis-parent" name="parentHypothesisId" type="text" />{state.fieldErrors.parentHypothesisId ? <span className="admin-field-error" id="hypothesis-parent-error">{state.fieldErrors.parentHypothesisId}</span> : null}</label>
        <label className="admin-field" htmlFor="hypothesis-relation"><span className="admin-field-label">상위 가설 관계</span><select aria-describedby={state.fieldErrors.parentRelation ? "hypothesis-relation-error" : undefined} className="admin-select" defaultValue={state.values.parentRelation} disabled={mode === "edit"} id="hypothesis-relation" name="parentRelation"><option value="">선택 안 함</option><option value="follow_up">후속</option><option value="pivot">피봇</option><option value="retry">재시도</option><option value="refinement">구체화</option></select>{state.fieldErrors.parentRelation ? <span className="admin-field-error" id="hypothesis-relation-error">{state.fieldErrors.parentRelation}</span> : null}</label>
        <label className="admin-field"><span className="admin-field-label">가설</span><textarea aria-describedby={state.fieldErrors.statement ? "hypothesis-statement-error" : undefined} className="admin-textarea" defaultValue={state.values.statement} maxLength={5000} name="statement" required rows={4} />{state.fieldErrors.statement ? <span className="admin-field-error" id="hypothesis-statement-error">{state.fieldErrors.statement}</span> : null}</label>
        <label className="admin-field"><span className="admin-field-label">근거</span><textarea className="admin-textarea" defaultValue={state.values.rationale} maxLength={10000} name="rationale" rows={4} /></label>
        <label className="admin-field"><span className="admin-field-label">성공 기준</span><textarea aria-describedby={state.fieldErrors.successCriteria ? "hypothesis-criteria-error" : undefined} className="admin-textarea" defaultValue={state.values.successCriteria} maxLength={10000} name="successCriteria" required rows={4} />{state.fieldErrors.successCriteria ? <span className="admin-field-error" id="hypothesis-criteria-error">{state.fieldErrors.successCriteria}</span> : null}</label>
        <label className="admin-field"><span className="admin-field-label">측정 계획</span><textarea className="admin-textarea" defaultValue={state.values.measurementPlan} maxLength={10000} name="measurementPlan" rows={4} /></label>
        {mode === "edit" ? <label className="admin-field"><span className="admin-field-label">공개 요약</span><textarea aria-describedby={state.fieldErrors.publicSummary ? "hypothesis-summary-error" : undefined} className="admin-textarea" defaultValue={state.values.publicSummary} maxLength={1000} name="publicSummary" rows={3} />{state.fieldErrors.publicSummary ? <span className="admin-field-error" id="hypothesis-summary-error">{state.fieldErrors.publicSummary}</span> : null}</label> : null}
        <label className="admin-field" htmlFor="hypothesis-confidence"><span className="admin-field-label">초기 확신도</span><input aria-describedby={state.fieldErrors.confidenceBefore ? "hypothesis-confidence-error" : undefined} className="admin-input" defaultValue={state.values.confidenceBefore} id="hypothesis-confidence" max="100" min="0" name="confidenceBefore" type="number" />{state.fieldErrors.confidenceBefore ? <span className="admin-field-error" id="hypothesis-confidence-error">{state.fieldErrors.confidenceBefore}</span> : null}</label>
        <label className="admin-field" htmlFor="hypothesis-started"><span className="admin-field-label">시작 시각</span><input className="admin-input" defaultValue={toDateTimeLocal(state.values.startedAt)} id="hypothesis-started" name="startedAt" type="datetime-local" /></label>
        <label className="admin-field" htmlFor="hypothesis-review"><span className="admin-field-label">검토 예정</span><input className="admin-input" defaultValue={toDateTimeLocal(state.values.reviewDueAt)} id="hypothesis-review" name="reviewDueAt" type="datetime-local" /></label>
      </div>
      <fieldset className="hypothesis-tag-fieldset"><legend className="admin-field-label">태그</legend><div className="hypothesis-tag-list">{options.tags.map((tag) => <label className="hypothesis-tag-option" key={tag.id}><input defaultChecked={state.values.tagIds.includes(tag.id)} name="tagIds" type="checkbox" value={tag.id} />{tag.name}</label>)}</div>{state.fieldErrors.tagIds ? <span className="admin-field-error">{state.fieldErrors.tagIds}</span> : null}</fieldset>
      <div className="admin-actions"><button className="admin-button admin-button-primary" disabled={isPending} type="submit">{isPending ? "저장 중" : mode === "create" ? "가설 만들기" : "변경 저장"}</button></div>
    </form>
  );
}
