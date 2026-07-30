import type { PostgrestError } from "@supabase/supabase-js";
import { cache } from "react";
import type {
  PublicContentItem,
  PublicContentNeighbors,
  PublicContentRedirect,
  PublicContentVersionSummary,
  PublicHomeViewData,
  PublicVersionHistoryPage,
  SearchIndexItem,
  WorksIdeaGroup,
} from "@/lib/content/public-types";
import { createPublicClient } from "@/lib/supabase/public";

const MAX_QUERY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 200;

type PublicContentRow = Readonly<{
  id: string;
  content_item_id: string;
  version_label: string | null;
  title: string;
  description: string | null;
  summary: string | null;
  body_markdown: string;
  demo_url: string | null;
  repository_url: string | null;
  role: string | null;
  period: string | null;
  outcome: string | null;
  published_at: string;
  updated_at: string;
  item: Readonly<{
    id: string;
    kind: "post" | "idea" | "project";
    slug: string;
    path: string;
    parent_item_id: string | null;
    created_at: string;
  }>;
  category: Readonly<{
    name: string;
    slug: string;
  }> | null;
  content_version_tags:
    | readonly Readonly<{
        sort_order: number;
        tag: Readonly<{
          name: string;
          slug: string;
        }>;
      }>[]
    | null;
  project_version_details: Readonly<{
    status: "active" | "archived" | "paused";
    sort_order: number;
  }> | null;
}>;

type RedirectRow = Readonly<{
  source_path: string;
  status_code: number;
  item: Readonly<{
    path: string;
  }>;
}>;

type PublicVersionRow = Readonly<{
  id: string;
  content_item_id: string;
  revision_number: number;
  state: "published" | "archived";
  version_label: string | null;
  title: string;
  published_at: string;
  archived_at: string | null;
}>;

type QueryResult<T> = Readonly<{
  data: T | null;
  error: PostgrestError | null;
}>;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function withReadRetry<T>(
  operation: () => PromiseLike<QueryResult<T>>,
  operationName: string,
): Promise<T> {
  let lastError: PostgrestError | null = null;

  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    const result = await operation();

    if (!result.error && result.data !== null) {
      return result.data;
    }

    lastError = result.error;

    if (attempt < MAX_QUERY_ATTEMPTS) {
      console.warn(
        JSON.stringify({
          event: "public_content_query_retry",
          operation: operationName,
          attempt,
          code: lastError?.code ?? null,
          message: lastError?.message ?? "empty response",
        }),
      );
      await delay(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error(
    `공개 콘텐츠 조회에 실패했습니다. operation=${operationName}, code=${lastError?.code ?? "unknown"}, cause=${lastError?.message ?? "empty response"}. Supabase 연결과 공개 RLS 정책을 확인하세요.`,
    { cause: lastError ?? undefined },
  );
}

function mapContentRow(row: PublicContentRow): PublicContentItem {
  const projectDetails = row.project_version_details;

  return {
    id: row.item.id,
    versionId: row.id,
    kind: row.item.kind,
    slug: row.item.slug,
    path: row.item.path,
    parentItemId: row.item.parent_item_id,
    createdAt: row.item.created_at,
    title: row.title,
    description: row.description,
    summary: row.summary,
    bodyMarkdown: row.body_markdown,
    category: row.category,
    tags: [...(row.content_version_tags ?? [])]
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((entry) => entry.tag),
    versionLabel: row.version_label,
    demoUrl: row.demo_url,
    repositoryUrl: row.repository_url,
    role: row.role,
    period: row.period,
    outcome: row.outcome,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    projectStatus: projectDetails?.status ?? null,
    projectSortOrder: projectDetails?.sort_order ?? null,
  };
}

export const listPublishedContent = cache(
  async (): Promise<readonly PublicContentItem[]> => {
    const supabase = createPublicClient();
    const rows = await withReadRetry(
      () =>
        supabase
          .from("content_versions")
          .select(
            "id, content_item_id, version_label, title, description, summary, body_markdown, demo_url, repository_url, role, period, outcome, published_at, updated_at, item:content_items!inner(id, kind, slug, path, parent_item_id, created_at), category:categories(name, slug), content_version_tags(sort_order, tag:tags(name, slug)), project_version_details(status, sort_order)",
          )
          .eq("state", "published")
          .order("published_at", { ascending: false })
          .returns<PublicContentRow[]>(),
      "list published content",
    );

    return rows.map(mapContentRow);
  },
);

export async function listPublishedPosts(): Promise<
  readonly PublicContentItem[]
> {
  return (await listPublishedContent()).filter((item) => item.kind === "post");
}

export async function listPublishedIdeas(): Promise<
  readonly PublicContentItem[]
> {
  return (await listPublishedContent())
    .filter((item) => item.kind === "idea")
    .sort(
      (left, right) =>
        new Date(right.publishedAt).valueOf() -
          new Date(left.publishedAt).valueOf() ||
        right.title.localeCompare(left.title, "ko"),
    );
}

export async function listPublishedProjects(): Promise<
  readonly PublicContentItem[]
> {
  return (await listPublishedContent())
    .filter((item) => item.kind === "project")
    .sort(
      (left, right) =>
        (left.projectSortOrder ?? 0) - (right.projectSortOrder ?? 0),
    );
}

export async function getHomeViewData(): Promise<PublicHomeViewData> {
  const items = await listPublishedContent();
  const posts = items.filter((item) => item.kind === "post");
  const ideas = items
    .filter((item) => item.kind === "idea")
    .sort(
      (left, right) =>
        new Date(right.publishedAt).valueOf() -
          new Date(left.publishedAt).valueOf() ||
        right.title.localeCompare(left.title, "ko"),
    );
  const categoryCounts = new Map<string, { label: string; count: number }>();
  const tagCounts = new Map<string, { label: string; count: number }>();

  for (const post of posts) {
    if (post.category) {
      const current = categoryCounts.get(post.category.slug);
      categoryCounts.set(post.category.slug, {
        label: post.category.name,
        count: (current?.count ?? 0) + 1,
      });
    }
    for (const tag of post.tags) {
      const current = tagCounts.get(tag.slug);
      tagCounts.set(tag.slug, {
        label: tag.name,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return {
    posts,
    ideas,
    projects: items
      .filter((item) => item.kind === "project")
      .sort(
        (left, right) =>
          (left.projectSortOrder ?? 0) - (right.projectSortOrder ?? 0),
      ),
    categoryStats: [...categoryCounts.entries()]
      .map(([slug, stat]) => ({ slug, ...stat }))
      .sort((left, right) => right.count - left.count),
    tagStats: [...tagCounts.entries()]
      .map(([slug, stat]) => ({ slug, ...stat }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.label.localeCompare(right.label),
      ),
    recentActivity: [...posts, ...ideas]
      .sort(
        (left, right) =>
          new Date(right.publishedAt).valueOf() -
          new Date(left.publishedAt).valueOf(),
      )
      .slice(0, 6),
  };
}

export async function listSearchIndex(): Promise<
  readonly SearchIndexItem[]
> {
  return (await listPublishedPosts()).map((item) => ({
    id: item.path.replace(/^\/posts\//, ""),
    title: item.title,
    description: item.description ?? item.summary ?? "",
    category: item.category?.slug ?? "",
    categoryLabel: item.category?.name ?? "",
    tags: item.tags.map((tag) => tag.name),
    pubDate: item.publishedAt,
  }));
}

function formatGroupLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function listWorksIdeaGroups(): Promise<
  readonly WorksIdeaGroup[]
> {
  const worksIdeas = (await listPublishedIdeas()).filter(
    (item) => item.category?.slug === "works",
  );
  const grouped = new Map<string, PublicContentItem[]>();

  for (const item of worksIdeas) {
    const pathSegments = item.path.split("/").filter(Boolean);
    const groupSlug = pathSegments[2] ?? item.slug;
    const groupItems = grouped.get(groupSlug) ?? [];

    groupItems.push(item);
    grouped.set(groupSlug, groupItems);
  }

  return [...grouped.entries()]
    .map(([slug, items]) => {
      const sortedItems = [...items].sort(
        (left, right) =>
          new Date(right.publishedAt).valueOf() -
            new Date(left.publishedAt).valueOf() ||
          new Date(left.createdAt).valueOf() -
            new Date(right.createdAt).valueOf(),
      );

      return {
        slug,
        label: formatGroupLabel(slug),
        items: sortedItems,
        latestPublishedAt: sortedItems[0].publishedAt,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.latestPublishedAt).valueOf() -
          new Date(left.latestPublishedAt).valueOf() ||
        left.label.localeCompare(right.label),
    );
}

export async function getPublishedContentByPath(
  contentPath: string,
): Promise<PublicContentItem | null> {
  return (
    (await listPublishedContent()).find((item) => item.path === contentPath) ??
    null
  );
}

export async function getContentNeighbors(
  current: PublicContentItem,
): Promise<PublicContentNeighbors> {
  const items = (await listPublishedContent())
    .filter((item) => item.kind === current.kind)
    .sort(
      (left, right) =>
        new Date(left.publishedAt).valueOf() -
        new Date(right.publishedAt).valueOf(),
    );
  const currentIndex = items.findIndex((item) => item.id === current.id);

  return {
    previous: currentIndex > 0 ? items[currentIndex - 1] : null,
    next:
      currentIndex >= 0 && currentIndex < items.length - 1
        ? items[currentIndex + 1]
        : null,
    currentNumber: currentIndex >= 0 ? currentIndex + 1 : 0,
  };
}

const listPublicVersionSummaries = cache(
  async (): Promise<readonly PublicContentVersionSummary[]> => {
    const supabase = createPublicClient();
    const rows = await withReadRetry(
      () =>
        supabase
          .from("content_versions")
          .select(
            "id, content_item_id, revision_number, state, version_label, title, published_at, archived_at",
          )
          .in("state", ["published", "archived"])
          .order("revision_number", { ascending: false })
          .returns<PublicVersionRow[]>(),
      "list public version summaries",
    );

    return rows.map((row) => ({
      id: row.id,
      contentItemId: row.content_item_id,
      revisionNumber: row.revision_number,
      state: row.state,
      versionLabel: row.version_label,
      title: row.title,
      publishedAt: row.published_at,
      archivedAt: row.archived_at,
    }));
  },
);

export async function getVersionHistoryPage(
  contentPath: string,
): Promise<PublicVersionHistoryPage | null> {
  const current = await getPublishedContentByPath(contentPath);

  if (!current || current.kind !== "post") {
    return null;
  }

  const versions = (await listPublicVersionSummaries()).filter(
    (version) => version.contentItemId === current.id,
  );

  return {
    current,
    versions,
  };
}

export const listPublicRedirects = cache(
  async (): Promise<readonly PublicContentRedirect[]> => {
    const supabase = createPublicClient();
    const rows = await withReadRetry(
      () =>
        supabase
          .from("content_redirects")
          .select(
            "source_path, status_code, item:content_items!content_redirects_target_item_id_fkey(path)",
          )
          .eq("is_active", true)
          .returns<RedirectRow[]>(),
      "list public redirects",
    );

    return rows.map((row) => ({
      sourcePath: row.source_path,
      targetPath: row.item.path,
      statusCode: row.status_code === 301 ? 301 : 308,
    }));
  },
);
