export type ContentKind = "post" | "idea" | "project";

type CommonEditorValues = Readonly<{
  itemId: string | null;
  slug: string;
  title: string;
  description: string;
  bodyMarkdown: string;
}>;

export type ContentEditorValues =
  | (CommonEditorValues &
      Readonly<{
        kind: "post";
        categoryId: string;
      }>)
  | (CommonEditorValues &
      Readonly<{
        kind: "idea";
        categoryId: string;
        parentItemId: string | null;
      }>)
  | (CommonEditorValues &
      Readonly<{
        kind: "project";
        categoryId: string | null;
        summary: string;
        projectStatus: "active" | "paused" | "archived";
        projectSortOrder: number;
        period: string;
        role: string;
        outcome: string;
        demoUrl: string;
        repositoryUrl: string;
      }>);

export type ContentEditorField =
  | "kind"
  | "itemId"
  | "slug"
  | "categoryId"
  | "parentItemId"
  | "title"
  | "description"
  | "summary"
  | "bodyMarkdown"
  | "projectStatus"
  | "projectSortOrder"
  | "period"
  | "role"
  | "outcome"
  | "demoUrl"
  | "repositoryUrl";

export type ContentEditorActionState = Readonly<{
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Readonly<Partial<Record<ContentEditorField, string>>>;
  values: ContentEditorValues | null;
}>;

export type SaveContentInput = Readonly<{
  values: ContentEditorValues;
  publish: boolean;
  destination: "writer";
}>;

export type ParseContentEditorFormResult =
  | Readonly<{
      ok: true;
      input: SaveContentInput;
    }>
  | Readonly<{
      ok: false;
      state: ContentEditorActionState;
    }>;
