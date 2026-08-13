"use client";

import { useActionState, useRef, useState } from "react";
import { IdeaFields } from "@/components/editor/idea-fields";
import { PostFields } from "@/components/editor/post-fields";
import { ProjectFields } from "@/components/editor/project-fields";
import { saveContentAction } from "@/lib/content/content-editor-actions";
import type { ContentEditorOptions } from "@/lib/content/content-editor-queries";
import type {
  ContentEditorActionState,
  ContentEditorValues,
  ContentKind,
} from "@/lib/content/content-editor-types";

type ContentEditorFormProps = Readonly<{
  initialKind?: ContentKind;
  initialValues: ContentEditorValues | null;
  options: ContentEditorOptions;
}>;

const KIND_LABELS: Readonly<Record<ContentKind, string>> = {
  post: "글",
  idea: "아이디어",
  project: "프로젝트",
};

function createValues(
  kind: ContentKind,
  options: ContentEditorOptions,
): ContentEditorValues {
  const categoryId = options.categories[0]?.id ?? "";
  const common = {
    itemId: null,
    slug: "",
    title: "",
    description: "",
    bodyMarkdown: "",
  } as const;

  if (kind === "post") {
    return { ...common, kind, categoryId };
  }

  if (kind === "idea") {
    return { ...common, kind, categoryId, parentItemId: null };
  }

  return {
    ...common,
    kind,
    categoryId: null,
    summary: "",
    projectStatus: "active",
    projectSortOrder: 0,
    period: "",
    role: "",
    outcome: "",
    demoUrl: "",
    repositoryUrl: "",
  };
}

function hasEnteredContent(form: HTMLFormElement | null): boolean {
  if (!form) {
    return false;
  }

  const data = new FormData(form);
  return ["title", "slug", "description", "summary", "bodyMarkdown"].some(
    (name) => String(data.get(name) ?? "").trim() !== "",
  );
}

export function ContentEditorForm({
  initialKind,
  initialValues,
  options,
}: ContentEditorFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fixedKind = initialValues?.kind ?? null;
  const [selectedKind, setSelectedKind] = useState<ContentKind | null>(
    fixedKind ?? initialKind ?? null,
  );
  const initialState: ContentEditorActionState = {
    status: "idle",
    message: null,
    fieldErrors: {},
    values: initialValues ?? (selectedKind ? createValues(selectedKind, options) : null),
  };
  const [state, formAction, isPending] = useActionState(
    saveContentAction,
    initialState,
  );
  const values =
    state.values?.kind === selectedKind
      ? state.values
      : selectedKind
        ? createValues(selectedKind, options)
        : null;

  function selectKind(kind: ContentKind): void {
    if (kind === selectedKind) {
      return;
    }

    if (
      hasEnteredContent(formRef.current) &&
      !window.confirm("작성 중인 내용이 초기화됩니다. 유형을 바꿀까요?")
    ) {
      return;
    }

    setSelectedKind(kind);
  }

  return (
    <>
      {fixedKind ? (
        <p className="writer-kind-fixed">
          유형 <strong>{KIND_LABELS[fixedKind]}</strong>
        </p>
      ) : (
        <div className="writer-kind-selector" aria-label="콘텐츠 유형">
          {Object.entries(KIND_LABELS).map(([kind, label]) => (
            <button
              aria-pressed={selectedKind === kind}
              className="writer-kind-button"
              key={kind}
              onClick={() => selectKind(kind as ContentKind)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {!values ? (
        <p className="writer-kind-prompt">
          만들 콘텐츠 유형을 선택하면 필요한 입력란만 표시됩니다.
        </p>
      ) : (
        <form
          action={formAction}
          className="admin-editor"
          key={values.kind}
          ref={formRef}
        >
          <input name="itemId" type="hidden" value={values.itemId ?? ""} />
          <input name="kind" type="hidden" value={values.kind} />
          <input name="editorDestination" type="hidden" value="writer" />

          {state.message ? (
            <p className="admin-notice" role="alert">
              {state.message}
            </p>
          ) : null}

          <div className="admin-editor-grid">
            <label className="admin-field" htmlFor="title">
              <span className="admin-field-label">제목</span>
              <input
                aria-describedby={state.fieldErrors.title ? "title-error" : undefined}
                className="admin-input"
                defaultValue={values.title}
                id="title"
                maxLength={200}
                name="title"
                required
                type="text"
              />
              {state.fieldErrors.title ? (
                <span className="admin-field-error" id="title-error">
                  {state.fieldErrors.title}
                </span>
              ) : null}
            </label>

            <label className="admin-field" htmlFor="slug">
              <span className="admin-field-label">Slug</span>
              <input
                aria-describedby={state.fieldErrors.slug ? "slug-error" : "slug-help"}
                autoCapitalize="none"
                autoCorrect="off"
                className="admin-input"
                defaultValue={values.slug}
                id="slug"
                maxLength={120}
                name="slug"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
                type="text"
              />
              {state.fieldErrors.slug ? (
                <span className="admin-field-error" id="slug-error">
                  {state.fieldErrors.slug}
                </span>
              ) : (
                <span className="admin-field-help" id="slug-help">
                  영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.
                </span>
              )}
            </label>

            {values.kind === "post" ? (
              <PostFields
                categories={options.categories}
                fieldErrors={state.fieldErrors}
                values={values}
              />
            ) : values.kind === "idea" ? (
              <IdeaFields
                fieldErrors={state.fieldErrors}
                options={options}
                values={values}
              />
            ) : (
              <ProjectFields
                fieldErrors={state.fieldErrors}
                options={options}
                values={values}
              />
            )}

            <label className="admin-field" htmlFor="description">
              <span className="admin-field-label">설명</span>
              <textarea
                aria-describedby={
                  state.fieldErrors.description ? "description-error" : undefined
                }
                className="admin-textarea"
                defaultValue={values.description}
                id="description"
                maxLength={500}
                name="description"
              />
              {state.fieldErrors.description ? (
                <span className="admin-field-error" id="description-error">
                  {state.fieldErrors.description}
                </span>
              ) : null}
            </label>

            <label className="admin-field" htmlFor="bodyMarkdown">
              <span className="admin-field-label">본문 Markdown</span>
              <textarea
                aria-describedby={
                  state.fieldErrors.bodyMarkdown ? "body-error" : undefined
                }
                className="admin-textarea admin-textarea-body"
                defaultValue={values.bodyMarkdown}
                id="bodyMarkdown"
                maxLength={500000}
                name="bodyMarkdown"
              />
              {state.fieldErrors.bodyMarkdown ? (
                <span className="admin-field-error" id="body-error">
                  {state.fieldErrors.bodyMarkdown}
                </span>
              ) : null}
            </label>
          </div>

          <div className="admin-actions">
            <button
              className="admin-button admin-button-secondary"
              disabled={isPending}
              name="intent"
              type="submit"
              value="save"
            >
              {isPending ? "저장 중" : "초안 저장"}
            </button>
            <button
              className="admin-button admin-button-primary"
              disabled={isPending}
              name="intent"
              type="submit"
              value="publish"
            >
              {isPending ? "처리 중" : "발행"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
