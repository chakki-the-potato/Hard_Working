"use client";

import { useActionState } from "react";
import {
  createHypothesisEvidenceAction,
  updateHypothesisEvidenceAction,
} from "@/lib/hypotheses/admin-actions";
import type {
  HypothesisEvidenceActionState,
  HypothesisEvidenceFormValues,
} from "@/lib/hypotheses/admin-types";

type EvidenceFormProps = Readonly<{
  activityTitle: string;
  initialValues: HypothesisEvidenceFormValues;
  mode: "create" | "edit";
}>;

function toDateTimeLocal(value: string): string {
  return value ? value.slice(0, 16) : "";
}

export function EvidenceForm({ activityTitle, initialValues, mode }: EvidenceFormProps) {
  const initialState: HypothesisEvidenceActionState = {
    status: "idle",
    message: null,
    fieldErrors: {},
    values: initialValues,
  };
  const action = mode === "create" ? createHypothesisEvidenceAction : updateHypothesisEvidenceAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="hypothesis-evidence-form">
      <input name="hypothesisId" type="hidden" value={state.values.hypothesisId} />
      <input name="activityId" type="hidden" value={state.values.activityId} />
      <input name="evidenceId" type="hidden" value={state.values.evidenceId} />
      <p className="hypothesis-form-context">{activityTitle}에 {mode === "edit" ? "증거 수정" : "증거 추가"}</p>
      {mode === "edit" ? <p className="hypothesis-form-context">저장하면 이 증거는 다시 공개할 때까지 공개 대기 상태입니다.</p> : null}
      {state.message ? <p className="admin-notice" role="alert">{state.message}</p> : null}
      <div className="hypothesis-form-grid">
        <label className="admin-field"><span className="admin-field-label">증거 유형</span><select className="admin-select" defaultValue={state.values.evidenceType} name="evidenceType"><option value="metric">지표</option><option value="observation">관찰</option><option value="feedback">피드백</option><option value="artifact">산출물</option><option value="source">출처</option><option value="other">기타</option></select></label>
        <label className="admin-field"><span className="admin-field-label">관찰 시각</span><input className="admin-input" defaultValue={toDateTimeLocal(state.values.observedAt)} name="observedAt" required type="datetime-local" /></label>
        <label className="admin-field"><span className="admin-field-label">요약</span><input className="admin-input" defaultValue={state.values.summary} name="summary" required type="text" /></label>
        <label className="admin-field"><span className="admin-field-label">출처 URL</span><input className="admin-input" defaultValue={state.values.sourceUrl} name="sourceUrl" type="url" /></label>
        <label className="admin-field"><span className="admin-field-label">세부 기록</span><textarea className="admin-textarea" defaultValue={state.values.detailsMarkdown} name="detailsMarkdown" rows={3} /></label>
      </div>
      <button className="admin-button admin-button-secondary" disabled={isPending} type="submit">{isPending ? "저장 중" : mode === "edit" ? "증거 수정" : "증거 기록"}</button>
    </form>
  );
}
