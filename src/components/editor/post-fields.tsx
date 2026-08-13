import type { CategoryOption } from "@/lib/content/admin-types";
import type {
  ContentEditorActionState,
  ContentEditorValues,
} from "@/lib/content/content-editor-types";

type PostValues = Extract<ContentEditorValues, { kind: "post" }>;

type PostFieldsProps = Readonly<{
  categories: readonly CategoryOption[];
  fieldErrors: ContentEditorActionState["fieldErrors"];
  values: PostValues;
}>;

export function PostFields({
  categories,
  fieldErrors,
  values,
}: PostFieldsProps) {
  return (
    <label className="admin-field" htmlFor="categoryId">
      <span className="admin-field-label">카테고리</span>
      <select
        aria-describedby={fieldErrors.categoryId ? "category-error" : undefined}
        className="admin-select"
        defaultValue={values.categoryId}
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
      {fieldErrors.categoryId ? (
        <span className="admin-field-error" id="category-error">
          {fieldErrors.categoryId}
        </span>
      ) : null}
    </label>
  );
}
