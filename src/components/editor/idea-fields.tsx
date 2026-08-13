"use client";

import { useState } from "react";
import type { ContentEditorOptions } from "@/lib/content/content-editor-queries";
import type {
  ContentEditorActionState,
  ContentEditorValues,
} from "@/lib/content/content-editor-types";

type IdeaValues = Extract<ContentEditorValues, { kind: "idea" }>;

type IdeaFieldsProps = Readonly<{
  fieldErrors: ContentEditorActionState["fieldErrors"];
  options: ContentEditorOptions;
  values: IdeaValues;
}>;

export function IdeaFields({ fieldErrors, options, values }: IdeaFieldsProps) {
  const [parentItemId, setParentItemId] = useState(values.parentItemId ?? "");
  const parent = options.ideaParents.find((option) => option.id === parentItemId);
  const inheritedCategoryId = parent?.categoryId ?? values.categoryId;

  return (
    <>
      <label className="admin-field" htmlFor="parentItemId">
        <span className="admin-field-label">상위 아이디어</span>
        <select
          aria-describedby={
            fieldErrors.parentItemId ? "parent-error" : "parent-help"
          }
          className="admin-select"
          id="parentItemId"
          name="parentItemId"
          onChange={(event) => setParentItemId(event.target.value)}
          value={parentItemId}
        >
          <option value="">최상위 아이디어</option>
          {options.ideaParents
            .filter((option) => option.id !== values.itemId)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.title} · {option.path}
              </option>
            ))}
        </select>
        {fieldErrors.parentItemId ? (
          <span className="admin-field-error" id="parent-error">
            {fieldErrors.parentItemId}
          </span>
        ) : (
          <span className="admin-field-help" id="parent-help">
            상위를 선택하면 카테고리와 공개 경로를 이어받습니다.
          </span>
        )}
      </label>

      <label className="admin-field" htmlFor="ideaCategoryId">
        <span className="admin-field-label">카테고리</span>
        <select
          aria-describedby={
            fieldErrors.categoryId ? "idea-category-error" : undefined
          }
          className="admin-select"
          disabled={Boolean(parentItemId)}
          id="ideaCategoryId"
          name={parentItemId ? undefined : "categoryId"}
          defaultValue={inheritedCategoryId}
          required={!parentItemId}
        >
          <option value="">카테고리 선택</option>
          {options.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {parentItemId ? (
          <input name="categoryId" type="hidden" value={inheritedCategoryId} />
        ) : null}
        {fieldErrors.categoryId ? (
          <span className="admin-field-error" id="idea-category-error">
            {fieldErrors.categoryId}
          </span>
        ) : null}
      </label>
    </>
  );
}
