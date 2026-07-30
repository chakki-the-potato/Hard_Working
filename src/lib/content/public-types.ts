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

export type PublicHomeViewData = Readonly<{
  posts: readonly PublicContentItem[];
  ideas: readonly PublicContentItem[];
  projects: readonly PublicContentItem[];
  categoryStats: readonly PublicContentStat[];
  tagStats: readonly PublicContentStat[];
  recentActivity: readonly PublicContentItem[];
}>;

export type PublicContentStat = Readonly<{
  slug: string;
  label: string;
  count: number;
}>;

export type SearchIndexItem = Readonly<{
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  tags: readonly string[];
  pubDate: string;
}>;

export type WorksIdeaGroup = Readonly<{
  slug: string;
  label: string;
  items: readonly PublicContentItem[];
  latestPublishedAt: string;
}>;

export type PublicContentVersionSummary = Readonly<{
  id: string;
  contentItemId: string;
  revisionNumber: number;
  state: "published" | "archived";
  versionLabel: string | null;
  title: string;
  publishedAt: string;
  archivedAt: string | null;
}>;

export type PublicVersionHistoryPage = Readonly<{
  current: PublicContentItem;
  versions: readonly PublicContentVersionSummary[];
}>;
