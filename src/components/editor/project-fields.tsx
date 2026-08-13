import type { ContentEditorOptions } from "@/lib/content/content-editor-queries";
import type {
  ContentEditorActionState,
  ContentEditorValues,
} from "@/lib/content/content-editor-types";

type ProjectValues = Extract<ContentEditorValues, { kind: "project" }>;

type ProjectFieldsProps = Readonly<{
  fieldErrors: ContentEditorActionState["fieldErrors"];
  options: ContentEditorOptions;
  values: ProjectValues;
}>;

export function ProjectFields({
  fieldErrors,
  options,
  values,
}: ProjectFieldsProps) {
  return (
    <>
      <label className="admin-field" htmlFor="projectCategoryId">
        <span className="admin-field-label">카테고리</span>
        <select
          className="admin-select"
          defaultValue={values.categoryId ?? ""}
          id="projectCategoryId"
          name="categoryId"
        >
          <option value="">카테고리 없음</option>
          {options.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="admin-field" htmlFor="summary">
        <span className="admin-field-label">요약</span>
        <textarea
          aria-describedby={fieldErrors.summary ? "summary-error" : undefined}
          className="admin-textarea"
          defaultValue={values.summary}
          id="summary"
          name="summary"
          required
        />
        {fieldErrors.summary ? (
          <span className="admin-field-error" id="summary-error">
            {fieldErrors.summary}
          </span>
        ) : null}
      </label>

      <div className="writer-project-grid">
        <label className="admin-field" htmlFor="projectStatus">
          <span className="admin-field-label">상태</span>
          <select
            className="admin-select"
            defaultValue={values.projectStatus}
            id="projectStatus"
            name="projectStatus"
          >
            <option value="active">진행 중</option>
            <option value="paused">일시 중지</option>
            <option value="archived">보관</option>
          </select>
        </label>

        <label className="admin-field" htmlFor="projectSortOrder">
          <span className="admin-field-label">정렬 순서</span>
          <input
            className="admin-input"
            defaultValue={values.projectSortOrder}
            id="projectSortOrder"
            min={0}
            name="projectSortOrder"
            step={1}
            type="number"
          />
        </label>
      </div>

      {fieldErrors.projectStatus ? (
        <p className="admin-field-error">{fieldErrors.projectStatus}</p>
      ) : null}
      {fieldErrors.projectSortOrder ? (
        <p className="admin-field-error">{fieldErrors.projectSortOrder}</p>
      ) : null}

      {[
        ["period", "기간", values.period, "text"],
        ["role", "역할", values.role, "text"],
        ["outcome", "결과", values.outcome, "text"],
        ["demoUrl", "데모 URL", values.demoUrl, "url"],
        ["repositoryUrl", "저장소 URL", values.repositoryUrl, "url"],
      ].map(([name, label, value, type]) => (
        <label className="admin-field" htmlFor={name} key={name}>
          <span className="admin-field-label">{label}</span>
          <input
            aria-describedby={fieldErrors[name as keyof typeof fieldErrors] ? `${name}-error` : undefined}
            className="admin-input"
            defaultValue={value}
            id={name}
            name={name}
            type={type}
          />
          {fieldErrors[name as keyof typeof fieldErrors] ? (
            <span className="admin-field-error" id={`${name}-error`}>
              {fieldErrors[name as keyof typeof fieldErrors]}
            </span>
          ) : null}
        </label>
      ))}
    </>
  );
}
