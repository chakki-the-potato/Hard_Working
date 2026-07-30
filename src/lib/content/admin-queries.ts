import type { PostgrestError } from "@supabase/supabase-js";
import type { ServerSupabaseClient } from "@/lib/auth/require-admin";
import type {
  AdminPostListItem,
  CategoryOption,
  PostDraft,
} from "@/lib/content/admin-types";

const MAX_QUERY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 200;

type QueryResult<T> = Readonly<{
  data: T | null;
  error: PostgrestError | null;
}>;

type ContentItemRow = Readonly<{
  id: string;
  path: string;
  updated_at: string;
}>;

type ContentVersionSummaryRow = Readonly<{
  content_item_id: string;
  state: "draft" | "published";
  title: string;
  updated_at: string;
  published_at: string | null;
}>;

type PostDraftRow = Readonly<{
  category_id: string;
  title: string;
  description: string | null;
  body_markdown: string;
}>;

type PostItemRow = Readonly<{
  id: string;
  slug: string;
  path: string;
}>;

type PublishedVersionRow = Readonly<{
  published_at: string;
}>;

async function wait(delayMs: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function runQueryWithRetry<T>(
  operation: () => PromiseLike<QueryResult<T>>,
  operationName: string,
): Promise<T> {
  let lastError: PostgrestError | null = null;

  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    const { data, error } = await operation();

    if (!error && data !== null) {
      return data;
    }

    lastError = error;

    if (attempt < MAX_QUERY_ATTEMPTS) {
      console.warn("Supabase content query failed; retrying", {
        operation: operationName,
        attempt,
        code: error?.code ?? "missing_data",
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      });
      await wait(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error(
    `Supabase content query failed: ${operationName}`,
    lastError ? { cause: lastError } : undefined,
  );
}

export async function listCategories(
  supabase: ServerSupabaseClient,
): Promise<readonly CategoryOption[]> {
  return runQueryWithRetry(
    () =>
      supabase
        .from("categories")
        .select("id, name, slug")
        .order("sort_order", { ascending: true })
        .returns<CategoryOption[]>(),
    "list categories",
  );
}

export async function listAdminPosts(
  supabase: ServerSupabaseClient,
): Promise<readonly AdminPostListItem[]> {
  const items = await runQueryWithRetry(
    () =>
      supabase
        .from("content_items")
        .select("id, path, updated_at")
        .eq("kind", "post")
        .order("updated_at", { ascending: false })
        .returns<ContentItemRow[]>(),
    "list post items",
  );

  if (items.length === 0) {
    return [];
  }

  const itemIds = items.map((item) => item.id);
  const versions = await runQueryWithRetry(
    () =>
      supabase
        .from("content_versions")
        .select("content_item_id, state, title, updated_at, published_at")
        .in("content_item_id", itemIds)
        .in("state", ["draft", "published"])
        .returns<ContentVersionSummaryRow[]>(),
    "list post versions",
  );

  return items.map((item) => {
    const itemVersions = versions.filter(
      (version) => version.content_item_id === item.id,
    );
    const draft = itemVersions.find((version) => version.state === "draft");
    const published = itemVersions.find(
      (version) => version.state === "published",
    );

    return {
      id: item.id,
      path: item.path,
      title: draft?.title ?? published?.title ?? "제목 없음",
      updatedAt: draft?.updated_at ?? item.updated_at,
      publishedAt: published?.published_at ?? null,
    };
  });
}

export async function getPostDraft(
  supabase: ServerSupabaseClient,
  itemId: string,
): Promise<PostDraft | null> {
  const [items, drafts, publishedVersions] = await Promise.all([
    runQueryWithRetry(
      () =>
        supabase
          .from("content_items")
          .select("id, slug, path")
          .eq("id", itemId)
          .eq("kind", "post")
          .limit(1)
          .returns<PostItemRow[]>(),
      "get post item",
    ),
    runQueryWithRetry(
      () =>
        supabase
          .from("content_versions")
          .select("category_id, title, description, body_markdown")
          .eq("content_item_id", itemId)
          .eq("state", "draft")
          .limit(1)
          .returns<PostDraftRow[]>(),
      "get post draft",
    ),
    runQueryWithRetry(
      () =>
        supabase
          .from("content_versions")
          .select("published_at")
          .eq("content_item_id", itemId)
          .eq("state", "published")
          .limit(1)
          .returns<PublishedVersionRow[]>(),
      "get published post version",
    ),
  ]);

  const item = items[0];
  const draft = drafts[0];

  if (!item || !draft) {
    return null;
  }

  return {
    path: item.path,
    publishedAt: publishedVersions[0]?.published_at ?? null,
    values: {
      itemId: item.id,
      slug: item.slug,
      categoryId: draft.category_id,
      title: draft.title,
      description: draft.description ?? "",
      bodyMarkdown: draft.body_markdown,
    },
  };
}
