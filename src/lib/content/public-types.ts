import type { ImportContentKind } from "@/lib/content/migration-types";

export type PublicContentTag = Readonly<{
  name: string;
  slug: string;
}>;

export type PublicContentCategory = Readonly<{
  name: string;
  slug: string;
}>;

export type PublicContentItem = Readonly<{
  id: string;
  versionId: string;
  kind: ImportContentKind;
  slug: string;
  path: string;
  parentItemId: string | null;
  title: string;
  description: string | null;
  summary: string | null;
  bodyMarkdown: string;
  category: PublicContentCategory | null;
  tags: readonly PublicContentTag[];
  versionLabel: string | null;
  demoUrl: string | null;
  repositoryUrl: string | null;
  role: string | null;
  period: string | null;
  outcome: string | null;
  publishedAt: string;
  updatedAt: string;
  projectStatus: "active" | "archived" | "paused" | null;
  projectSortOrder: number | null;
}>;

export type PublicContentRedirect = Readonly<{
  sourcePath: string;
  targetPath: string;
  statusCode: 301 | 308;
}>;
