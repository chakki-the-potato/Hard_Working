"use client";

import { useActionState } from "react";
import { changeHypothesisPublicationAction } from "@/lib/hypotheses/admin-actions";
import type { HypothesisPublicationActionState, HypothesisPublicationJson, HypothesisVisibility } from "@/lib/hypotheses/admin-types";

type PublicationFormProps = Readonly<{ hypothesisId: string; visibility: HypothesisVisibility; publicSummary: string | null; preview?: HypothesisPublicationJson }>;
export function PublicationForm({ hypothesisId, visibility, publicSummary, preview }: PublicationFormProps) {
  const initialState: HypothesisPublicationActionState = { status: "idle", message: null, fieldErrors: {}, values: { hypothesisId, intent: visibility === "public" ? "publish_changes" : "publish", publicSummary: publicSummary ?? "" } };
  const [state, formAction, isPending] = useActionState(changeHypothesisPublicationAction, initialState);
  const intent = visibility === "public" ? "publish_changes" : "publish";
  return <form action={formAction} className="hypothesis-publication-form"><input name="hypothesisId" type="hidden" value={state.values.hypothesisId} /><input name="publicSummary" type="hidden" value={state.values.publicSummary} />{state.message ? <p className="admin-notice" role="alert">{state.message}</p> : null}<p className="hypothesis-publication-copy">공개하면 가설과 검토된 활동·증거가 함께 공개됩니다. 공개 요약은 가설 편집 폼에서 먼저 저장합니다.</p>{preview === undefined ? null : <pre className="hypothesis-preview">{JSON.stringify(preview, null, 2)}</pre>}<div className="admin-actions"><button className="admin-button admin-button-primary" disabled={isPending} name="intent" type="submit" value={intent}>{isPending ? "처리 중" : visibility === "public" ? "변경 내용 공개" : "공개하기"}</button>{visibility === "public" ? <button className="admin-button admin-button-secondary" disabled={isPending} name="intent" type="submit" value="unpublish">비공개로 전환</button> : null}</div></form>;
}
