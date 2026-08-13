"use client";

import { useActionState } from "react";
import { runContentImportAction } from "@/lib/content/import-actions";
import type { ContentImportActionState } from "@/lib/content/migration-types";

const INITIAL_STATE: ContentImportActionState = {
  status: "idle",
  mode: null,
  message: null,
  result: null,
};

type ContentImportFormProps = Readonly<{
  allowApply: boolean;
}>;

export function ContentImportForm({ allowApply }: ContentImportFormProps) {
  const [state, formAction, isPending] = useActionState(
    runContentImportAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="admin-import-form">
      {state.message ? (
        <p className="admin-notice" role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      ) : null}

      {state.result ? (
        <dl className="admin-import-results">
          <div>
            <dt>생성 콘텐츠</dt>
            <dd>{state.result.createdItems}</dd>
          </div>
          <div>
            <dt>갱신 콘텐츠</dt>
            <dd>{state.result.updatedItems}</dd>
          </div>
          <div>
            <dt>생성 revision</dt>
            <dd>{state.result.createdVersions}</dd>
          </div>
          <div>
            <dt>갱신 revision</dt>
            <dd>{state.result.updatedVersions}</dd>
          </div>
          <div>
            <dt>태그 연결</dt>
            <dd>{state.result.assignedTags}</dd>
          </div>
          <div>
            <dt>리디렉션</dt>
            <dd>{state.result.upsertedRedirects}</dd>
          </div>
        </dl>
      ) : null}

      <div className="admin-actions">
        <button
          className="admin-button admin-button-secondary"
          disabled={isPending}
          name="mode"
          type="submit"
          value="dry-run"
        >
          {isPending ? "검증 중" : "Dry-run"}
        </button>
        {allowApply ? (
          <button
            className="admin-button admin-button-primary"
            disabled={isPending}
            name="mode"
            type="submit"
            value="apply"
          >
            {isPending ? "처리 중" : "실제 가져오기"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
