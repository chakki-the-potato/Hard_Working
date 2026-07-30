"use client";

import { useActionState } from "react";
import type {
  CategoryOption,
  PostEditorActionState,
  PostEditorValues,
} from "@/lib/content/admin-types";
import { savePostAction } from "@/lib/content/admin-actions";
import type { EditorDestination } from "@/lib/content/editor-destination";

type PostEditorFormProps = Readonly<{
  categories: readonly CategoryOption[];
  destination?: EditorDestination;
  initialValues: PostEditorValues;
}>;

export function PostEditorForm({
  categories,
  destination = "admin",
  initialValues,
}: PostEditorFormProps) {
  const initialState: PostEditorActionState = {
    status: "idle",
    message: null,
    fieldErrors: {},
    values: initialValues,
  };
  const [state, formAction, isPending] = useActionState(
    savePostAction,
    initialState,
  );

  return (
    <form action={formAction} className="admin-editor">
      <input name="itemId" type="hidden" value={state.values.itemId ?? ""} />
      <input
        name="editorDestination"
        type="hidden"
        value={destination}
      />

      {state.message ? (
        <p className="admin-notice" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="admin-editor-grid">
        <label className="admin-field" htmlFor="title">
          <span className="admin-field-label">제목</span>
          <input
            aria-describedby={
              state.fieldErrors.title ? "title-error" : undefined
            }
            className="admin-input"
            defaultValue={state.values.title}
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
            aria-describedby={
              state.fieldErrors.slug ? "slug-error" : "slug-help"
            }
            autoCapitalize="none"
            autoCorrect="off"
            className="admin-input"
            defaultValue={state.values.slug}
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

        <label className="admin-field" htmlFor="categoryId">
          <span className="admin-field-label">카테고리</span>
          <select
            aria-describedby={
              state.fieldErrors.categoryId ? "category-error" : undefined
            }
            className="admin-select"
            defaultValue={state.values.categoryId}
            id="categoryId"
            name="categoryId"
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {state.fieldErrors.categoryId ? (
            <span className="admin-field-error" id="category-error">
              {state.fieldErrors.categoryId}
            </span>
          ) : null}
        </label>

        <label className="admin-field" htmlFor="description">
          <span className="admin-field-label">설명</span>
          <textarea
            aria-describedby={
              state.fieldErrors.description ? "description-error" : undefined
            }
            className="admin-textarea"
            defaultValue={state.values.description}
            id="description"
            maxLength={500}
            name="description"
            rows={4}
          />
          {state.fieldErrors.description ? (
            <span className="admin-field-error" id="description-error">
              {state.fieldErrors.description}
            </span>
          ) : null}
        </label>

        <label className="admin-field" htmlFor="bodyMarkdown">
          <span className="admin-field-label">Markdown 본문</span>
          <textarea
            aria-describedby={
              state.fieldErrors.bodyMarkdown ? "body-error" : "body-help"
            }
            className="admin-textarea admin-textarea-body"
            defaultValue={state.values.bodyMarkdown}
            id="bodyMarkdown"
            maxLength={500000}
            name="bodyMarkdown"
            spellCheck={false}
          />
          {state.fieldErrors.bodyMarkdown ? (
            <span className="admin-field-error" id="body-error">
              {state.fieldErrors.bodyMarkdown}
            </span>
          ) : (
            <span className="admin-field-help" id="body-help">
              초안은 본문 없이 저장할 수 있지만 발행하려면 본문이 필요합니다.
            </span>
          )}
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
          {isPending ? "처리 중" : "초안 저장"}
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
  );
}
