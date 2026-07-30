export type CategoryOption = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type AdminPostListItem = Readonly<{
  id: string;
  path: string;
  title: string;
  updatedAt: string;
  publishedAt: string | null;
}>;

export type PostEditorValues = Readonly<{
  itemId: string | null;
  slug: string;
  categoryId: string;
  title: string;
  description: string;
  bodyMarkdown: string;
}>;

export type PostEditorField =
  | "slug"
  | "categoryId"
  | "title"
  | "description"
  | "bodyMarkdown";

export type PostEditorActionState = Readonly<{
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Readonly<Partial<Record<PostEditorField, string>>>;
  values: PostEditorValues;
}>;

export type PostDraft = Readonly<{
  values: PostEditorValues;
  path: string;
  publishedAt: string | null;
}>;

export type SavePostInput = Readonly<{
  values: PostEditorValues;
  publish: boolean;
}>;

export type SavePostResult = Readonly<{
  itemId: string;
  draftVersionId: string;
  publishedVersionId: string | null;
}>;
