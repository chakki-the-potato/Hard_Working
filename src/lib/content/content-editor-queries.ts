import type { ServerSupabaseClient } from "@/lib/auth/require-admin";
import type { CategoryOption } from "@/lib/content/admin-types";
import { runAdminQueryWithRetry } from "@/lib/content/admin-queries";
import type {
  ContentEditorValues,
  ContentKind,
} from "@/lib/content/content-editor-types";

type IdeaItemRow = Readonly<{
  id: string;
  path: string;
}>;

type IdeaDraftRow = Readonly<{
  content_item_id: string;
  title: string;
  category_id: string | null;
}>;

type ContentItemRow = Readonly<{
  id: string;
  kind: ContentKind;
  slug: string;
  path: string;
  parent_item_id: string | null;
}>;

type ContentDraftRow = Readonly<{
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  summary: string | null;
  body_markdown: string;
  demo_url: string | null;
  repository_url: string | null;
  role: string | null;
  period: string | null;
  outcome: string | null;
}>;

type PublishedVersionRow = Readonly<{
  published_at: string;
}>;

type ProjectDetailRow = Readonly<{
  status: "active" | "paused" | "archived";
  sort_order: number;
}>;

export type ContentEditorOptions = Readonly<{
  categories: readonly CategoryOption[];
  ideaParents: readonly Readonly<{
    id: string;
    title: string;
    path: string;
    categoryId: string;
  }>[];
}>;

export type ContentDraft = Readonly<{
  path: string;
  publishedAt: string | null;
  values: ContentEditorValues;
}>;

export async function listContentEditorOptions(
  supabase: ServerSupabaseClient,
): Promise<ContentEditorOptions> {
  const [categories, ideaItems] = await Promise.all([
    runAdminQueryWithRetry(
      () =>
        supabase
          .from("categories")
          .select("id, name, slug")
          .order("sort_order", { ascending: true })
          .returns<CategoryOption[]>(),
      "list content editor categories",
    ),
    runAdminQueryWithRetry(
      () =>
        supabase
          .from("content_items")
          .select("id, path")
          .eq("kind", "idea")
          .order("path", { ascending: true })
          .returns<IdeaItemRow[]>(),
      "list idea parent items",
    ),
  ]);

  if (ideaItems.length === 0) {
    return { categories, ideaParents: [] };
  }

  const ideaDrafts = await runAdminQueryWithRetry(
    () =>
      supabase
        .from("content_versions")
        .select("content_item_id, title, category_id")
        .in(
          "content_item_id",
          ideaItems.map((item) => item.id),
        )
        .eq("state", "draft")
        .returns<IdeaDraftRow[]>(),
    "list idea parent drafts",
  );
  const draftByItemId = new Map(
    ideaDrafts.map((draft) => [draft.content_item_id, draft]),
  );
  const ideaParents = ideaItems.flatMap((item) => {
    const draft = draftByItemId.get(item.id);
    return draft?.category_id
      ? [
          {
            id: item.id,
            title: draft.title,
            path: item.path,
            categoryId: draft.category_id,
          },
        ]
      : [];
  });

  return { categories, ideaParents };
}

export async function getContentDraft(
  supabase: ServerSupabaseClient,
  itemId: string,
): Promise<ContentDraft | null> {
  const [items, drafts, publishedVersions] = await Promise.all([
    runAdminQueryWithRetry(
      () =>
        supabase
          .from("content_items")
          .select("id, kind, slug, path, parent_item_id")
          .eq("id", itemId)
          .limit(1)
          .returns<ContentItemRow[]>(),
      "get content editor item",
    ),
    runAdminQueryWithRetry(
      () =>
        supabase
          .from("content_versions")
          .select(
            "id, category_id, title, description, summary, body_markdown, demo_url, repository_url, role, period, outcome",
          )
          .eq("content_item_id", itemId)
          .eq("state", "draft")
          .limit(1)
          .returns<ContentDraftRow[]>(),
      "get content editor draft",
    ),
    runAdminQueryWithRetry(
      () =>
        supabase
          .from("content_versions")
          .select("published_at")
          .eq("content_item_id", itemId)
          .eq("state", "published")
          .limit(1)
          .returns<PublishedVersionRow[]>(),
      "get content published version",
    ),
  ]);
  const item = items[0];
  const draft = drafts[0];

  if (!item || !draft) {
    return null;
  }

  const commonValues = {
    itemId: item.id,
    slug: item.slug,
    title: draft.title,
    description: draft.description ?? "",
    bodyMarkdown: draft.body_markdown,
  } as const;
  let values: ContentEditorValues;

  if (item.kind === "post") {
    if (!draft.category_id) {
      return null;
    }

    values = {
      ...commonValues,
      kind: "post",
      categoryId: draft.category_id,
    };
  } else if (item.kind === "idea") {
    if (!draft.category_id) {
      return null;
    }

    values = {
      ...commonValues,
      kind: "idea",
      categoryId: draft.category_id,
      parentItemId: item.parent_item_id,
    };
  } else if (item.kind === "project") {
    const details = await runAdminQueryWithRetry(
      () =>
        supabase
          .from("project_version_details")
          .select("status, sort_order")
          .eq("content_version_id", draft.id)
          .limit(1)
          .returns<ProjectDetailRow[]>(),
      "get project draft details",
    );
    const detail = details[0];

    if (!detail || !draft.summary) {
      return null;
    }

    values = {
      ...commonValues,
      kind: "project",
      categoryId: draft.category_id,
      summary: draft.summary,
      projectStatus: detail.status,
      projectSortOrder: detail.sort_order,
      period: draft.period ?? "",
      role: draft.role ?? "",
      outcome: draft.outcome ?? "",
      demoUrl: draft.demo_url ?? "",
      repositoryUrl: draft.repository_url ?? "",
    };
  } else {
    return null;
  }

  return {
    path: item.path,
    publishedAt: publishedVersions[0]?.published_at ?? null,
    values,
  };
}
