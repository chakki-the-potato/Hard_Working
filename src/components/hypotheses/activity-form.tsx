"use client";

import { useActionState } from "react";
import {
  createHypothesisActivityAction,
  updateHypothesisActivityAction,
} from "@/lib/hypotheses/admin-actions";
import type {
  HypothesisActivityActionState,
  HypothesisActivityFormValues,
  HypothesisAdminOptions,
} from "@/lib/hypotheses/admin-types";

type ActivityFormProps = Readonly<{
  initialValues: HypothesisActivityFormValues;
  mode: "create" | "edit";
  options: HypothesisAdminOptions;
}>;

function toDateTimeLocal(value: string): string {
  return value ? value.slice(0, 16) : "";
}

export function ActivityForm({ initialValues, mode, options }: ActivityFormProps) {
  const initialState: HypothesisActivityActionState = {
    status: "idle",
    message: null,
    fieldErrors: {},
    values: initialValues,
  };
  const action = mode === "create" ? createHypothesisActivityAction : updateHypothesisActivityAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="hypothesis-compact-form">
      <input name="hypothesisId" type="hidden" value={state.values.hypothesisId} />
      <input name="activityId" type="hidden" value={state.values.activityId} />
      {mode === "edit" ? <p className="hypothesis-form-context">저장하면 이 활동과 연결된 증거는 공개 대기로 전환됩니다.</p> : null}
      {state.message ? <p className="admin-notice" role="alert">{state.message}</p> : null}
      <div className="hypothesis-form-grid">
        <label className="admin-field"><span className="admin-field-label">활동 유형</span><select className="admin-select" defaultValue={state.values.activityType} name="activityType"><option value="experiment">실험</option><option value="interview">인터뷰</option><option value="build">제작</option><option value="launch">출시</option><option value="analysis">분석</option><option value="other">기타</option></select></label>
        <label className="admin-field"><span className="admin-field-label">연결 콘텐츠</span><select className="admin-select" defaultValue={state.values.relatedContentItemId} name="relatedContentItemId"><option value="">선택 안 함</option>{options.relatedContent.map((content) => <option key={content.id} value={content.id}>{content.title}</option>)}</select></label>
        <label className="admin-field"><span className="admin-field-label">활동 제목</span><input className="admin-input" defaultValue={state.values.title} name="title" required type="text" /></label>
        <label className="admin-field"><span className="admin-field-label">시작 시각</span><input className="admin-input" defaultValue={toDateTimeLocal(state.values.startedAt)} name="startedAt" required type="datetime-local" /></label>
        <label className="admin-field"><span className="admin-field-label">완료 시각</span><input className="admin-input" defaultValue={toDateTimeLocal(state.values.completedAt)} name="completedAt" type="datetime-local" /></label>
        <label className="admin-field"><span className="admin-field-label">설명</span><textarea className="admin-textarea" defaultValue={state.values.description} name="description" rows={3} /></label>
      </div>
      <button className="admin-button admin-button-secondary" disabled={isPending} type="submit">{isPending ? "저장 중" : mode === "edit" ? "활동 수정" : "활동 기록"}</button>
    </form>
  );
}
