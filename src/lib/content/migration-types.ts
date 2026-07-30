export type ImportContentKind = "post" | "idea" | "project";

export type ImportContentTag = Readonly<{
  name: string;
  slug: string;
}>;

export type ImportContentItem = Readonly<{
  kind: ImportContentKind;
  slug: string;
  path: string;
  parentPath: string | null;
  title: string;
  description: string | null;
  summary: string | null;
  bodyMarkdown: string;
  categorySlug: string | null;
  versionLabel: string | null;
  tags: readonly ImportContentTag[];
  demoUrl: string | null;
  repositoryUrl: string | null;
  role: string | null;
  period: string | null;
  outcome: string | null;
  publishedAt: string;
  projectStatus: "active" | "archived" | "paused" | null;
  projectSortOrder: number | null;
}>;

export type ImportContentRedirect = Readonly<{
  sourcePath: string;
  targetPath: string;
}>;

export type ContentImportSnapshot = Readonly<{
  items: readonly ImportContentItem[];
  redirects: readonly ImportContentRedirect[];
}>;

export type ContentImportResult = Readonly<{
  createdItems: number;
  updatedItems: number;
  createdVersions: number;
  updatedVersions: number;
  assignedTags: number;
  upsertedRedirects: number;
}>;

export type ContentImportActionState = Readonly<{
  status: "idle" | "success" | "error";
  mode: "dry-run" | "apply" | null;
  message: string | null;
  result: ContentImportResult | null;
}>;
