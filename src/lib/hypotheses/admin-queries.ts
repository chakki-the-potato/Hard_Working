import type { PostgrestError } from "@supabase/supabase-js";
import type { ServerSupabaseClient } from "@/lib/auth/require-admin";
import type {
  CategoryOption,
  ContentOption,
  HypothesisActivity,
  HypothesisDecision,
  HypothesisDetail,
  HypothesisEvidence,
  HypothesisListItem,
  HypothesisPublicationJson,
  HypothesisAdminOptions,
  TagOption,
} from "@/lib/hypotheses/admin-types";

const MAX_QUERY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 200;

type QueryResult<T> = Readonly<{ data: T | null; error: PostgrestError | null }>;

type CategoryRow = Readonly<{ id: string; name: string; slug: string }>;
type TagRow = Readonly<{ id: string; name: string; slug: string }>;
type ContentItemRow = Readonly<{ id: string; kind: "post" | "idea" | "project"; slug: string; path: string }>;
type ContentVersionRow = Readonly<{ content_item_id: string; state: "draft" | "published"; title: string; updated_at: string }>;
type HypothesisRow = Readonly<{
  id: string;
  slug: string;
  project_item_id: string | null;
  category_id: string;
  parent_hypothesis_id: string | null;
  parent_relation: string | null;
  statement: string;
  rationale: string;
  success_criteria: string;
  measurement_plan: string;
  status: string;
  visibility: string;
  public_summary: string | null;
  confidence_before: number | null;
  started_at: string | null;
  review_due_at: string | null;
  concluded_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}>;
type HypothesisTagRow = Readonly<{ tag_id: string; sort_order: number }>;
type ActivityRow = Readonly<{
  id: string;
  hypothesis_id: string;
  related_content_item_id: string | null;
  activity_type: string;
  title: string;
  description: string;
  started_at: string;
  completed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}>;
type EvidenceRow = Readonly<{
  id: string;
  activity_id: string;
  evidence_type: string;
  summary: string;
  details_markdown: string;
  source_url: string | null;
  observed_at: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}>;
type DecisionRow = Readonly<{
  id: string;
  hypothesis_id: string;
  verdict: string;
  reasoning: string;
  confidence_after: number | null;
  failure_type: string | null;
  is_current: boolean;
  decided_at: string;
  created_at: string;
}>;

async function wait(delayMs: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

export async function runHypothesisAdminQueryWithRetry<T>(
  operation: () => PromiseLike<QueryResult<T>>,
  operationName: string,
): Promise<T> {
  let lastError: PostgrestError | null = null;
  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    const { data, error } = await operation();
    if (!error && data !== null) return data;
    lastError = error;
    if (attempt < MAX_QUERY_ATTEMPTS) {
      console.warn("Supabase hypothesis query failed; retrying", {
        operation: operationName,
        attempt,
        code: error?.code ?? "missing_data",
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      });
      await wait(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  throw new Error(`Supabase hypothesis query failed: ${operationName}`, lastError ? { cause: lastError } : undefined);
}

async function runNullableHypothesisAdminQueryWithRetry<T>(
  operation: () => PromiseLike<QueryResult<T>>,
  operationName: string,
): Promise<T | null> {
  let lastError: PostgrestError | null = null;
  for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt += 1) {
    const { data, error } = await operation();
    if (!error) return data;
    lastError = error;
    if (attempt < MAX_QUERY_ATTEMPTS) {
      console.warn("Supabase hypothesis query failed; retrying", {
        operation: operationName,
        attempt,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      await wait(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  throw new Error(`Supabase hypothesis query failed: ${operationName}`, { cause: lastError });
}

function toCategoryOption(row: CategoryRow): CategoryOption {
  return { id: row.id, name: row.name, slug: row.slug };
}

function toTagOption(row: TagRow): TagOption {
  return { id: row.id, name: row.name, slug: row.slug };
}

function toContentOptions(
  items: readonly ContentItemRow[],
  versions: readonly ContentVersionRow[],
): readonly ContentOption[] {
  const titleByItem = new Map<string, ContentVersionRow>();
  for (const version of versions) {
    const current = titleByItem.get(version.content_item_id);
    if (!current || (current.state === "published" && version.state === "draft") || (current.state === version.state && current.updated_at < version.updated_at)) {
      titleByItem.set(version.content_item_id, version);
    }
  }
  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    slug: item.slug,
    path: item.path,
    title: titleByItem.get(item.id)?.title ?? item.slug,
  }));
}

async function listContentOptions(
  supabase: ServerSupabaseClient,
): Promise<readonly ContentOption[]> {
  const [items, versions] = await Promise.all([
    runHypothesisAdminQueryWithRetry(
      () => supabase.from("content_items").select("id, kind, slug, path").in("kind", ["post", "idea", "project"]).returns<ContentItemRow[]>(),
      "list hypothesis content items",
    ),
    runHypothesisAdminQueryWithRetry(
      () => supabase.from("content_versions").select("content_item_id, state, title, updated_at").in("state", ["draft", "published"]).returns<ContentVersionRow[]>(),
      "list hypothesis content titles",
    ),
  ]);
  return toContentOptions(items, versions);
}

export async function listHypothesisAdminOptions(
  supabase: ServerSupabaseClient,
): Promise<HypothesisAdminOptions> {
  const [categories, tags, content] = await Promise.all([
    runHypothesisAdminQueryWithRetry(
      () => supabase.from("categories").select("id, name, slug").order("sort_order", { ascending: true }).returns<CategoryRow[]>(),
      "list hypothesis categories",
    ),
    runHypothesisAdminQueryWithRetry(
      () => supabase.from("tags").select("id, name, slug").order("name", { ascending: true }).returns<TagRow[]>(),
      "list hypothesis tags",
    ),
    listContentOptions(supabase),
  ]);
  return {
    categories: categories.map(toCategoryOption),
    tags: tags.map(toTagOption),
    projects: content.filter((item) => item.kind === "project"),
    relatedContent: content,
  };
}

export async function listAdminHypotheses(
  supabase: ServerSupabaseClient,
): Promise<readonly HypothesisListItem[]> {
  const [hypotheses, categories, content] = await Promise.all([
    runHypothesisAdminQueryWithRetry(
      () => supabase.from("hypotheses").select("id, slug, project_item_id, category_id, statement, status, visibility, review_due_at, updated_at").order("updated_at", { ascending: false }).returns<HypothesisRow[]>(),
      "list admin hypotheses",
    ),
    runHypothesisAdminQueryWithRetry(
      () => supabase.from("categories").select("id, name, slug").returns<CategoryRow[]>(),
      "list hypothesis list categories",
    ),
    listContentOptions(supabase),
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, toCategoryOption(category)]));
  const contentById = new Map(content.map((item) => [item.id, item]));
  return hypotheses.flatMap((hypothesis) => {
    const category = categoryById.get(hypothesis.category_id);
    if (!category) return [];
    return [{
      id: hypothesis.id,
      slug: hypothesis.slug,
      statement: hypothesis.statement,
      category,
      project: hypothesis.project_item_id ? contentById.get(hypothesis.project_item_id) ?? null : null,
      status: hypothesis.status as HypothesisListItem["status"],
      visibility: hypothesis.visibility as HypothesisListItem["visibility"],
      reviewDueAt: hypothesis.review_due_at,
      updatedAt: hypothesis.updated_at,
    }];
  });
}

function toEvidence(row: EvidenceRow): HypothesisEvidence {
  return {
    id: row.id,
    evidenceType: row.evidence_type as HypothesisEvidence["evidenceType"],
    summary: row.summary,
    detailsMarkdown: row.details_markdown,
    sourceUrl: row.source_url,
    observedAt: row.observed_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDecision(row: DecisionRow): HypothesisDecision {
  return {
    id: row.id,
    verdict: row.verdict as HypothesisDecision["verdict"],
    reasoning: row.reasoning,
    confidenceAfter: row.confidence_after,
    failureType: row.failure_type as HypothesisDecision["failureType"],
    isCurrent: row.is_current,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

export async function getAdminHypothesisDetail(
  supabase: ServerSupabaseClient,
  hypothesisId: string,
): Promise<HypothesisDetail | null> {
  const hypothesisResult = await runNullableHypothesisAdminQueryWithRetry(
    () => supabase.from("hypotheses").select("id, slug, project_item_id, category_id, parent_hypothesis_id, parent_relation, statement, rationale, success_criteria, measurement_plan, status, visibility, public_summary, confidence_before, started_at, review_due_at, concluded_at, published_at, created_at, updated_at").eq("id", hypothesisId).maybeSingle().returns<HypothesisRow>(),
    "get admin hypothesis",
  );
  if (!hypothesisResult) return null;
  const [categories, tags, hypothesisTags, activities, decisions, content] = await Promise.all([
    runHypothesisAdminQueryWithRetry(() => supabase.from("categories").select("id, name, slug").eq("id", hypothesisResult.category_id).returns<CategoryRow[]>(), "get hypothesis category"),
    runHypothesisAdminQueryWithRetry(() => supabase.from("tags").select("id, name, slug").returns<TagRow[]>(), "get hypothesis tags"),
    runHypothesisAdminQueryWithRetry(() => supabase.from("hypothesis_tags").select("tag_id, sort_order").eq("hypothesis_id", hypothesisId).order("sort_order", { ascending: true }).returns<HypothesisTagRow[]>(), "get hypothesis tag links"),
    runHypothesisAdminQueryWithRetry(() => supabase.from("hypothesis_activities").select("id, hypothesis_id, related_content_item_id, activity_type, title, description, started_at, completed_at, published_at, created_at, updated_at").eq("hypothesis_id", hypothesisId).order("started_at", { ascending: false }).returns<ActivityRow[]>(), "get hypothesis activities"),
    runHypothesisAdminQueryWithRetry(() => supabase.from("hypothesis_decisions").select("id, hypothesis_id, verdict, reasoning, confidence_after, failure_type, is_current, decided_at, created_at").eq("hypothesis_id", hypothesisId).order("decided_at", { ascending: false }).returns<DecisionRow[]>(), "get hypothesis decisions"),
    listContentOptions(supabase),
  ]);
  const category = categories[0];
  if (!category) throw new Error("Hypothesis category is missing");
  const evidence = activities.length === 0
    ? []
    : await runHypothesisAdminQueryWithRetry(
        () => supabase.from("hypothesis_evidence").select("id, activity_id, evidence_type, summary, details_markdown, source_url, observed_at, published_at, created_at, updated_at").in("activity_id", activities.map((activity) => activity.id)).order("observed_at", { ascending: false }).returns<EvidenceRow[]>(),
        "get hypothesis evidence",
      );
  const evidenceByActivity = new Map<string, HypothesisEvidence[]>();
  for (const item of evidence) {
    const entries = evidenceByActivity.get(item.activity_id) ?? [];
    entries.push(toEvidence(item));
    evidenceByActivity.set(item.activity_id, entries);
  }
  const tagById = new Map(tags.map((tag) => [tag.id, toTagOption(tag)]));
  const contentById = new Map(content.map((item) => [item.id, item]));
  const mappedActivities: readonly HypothesisActivity[] = activities.map((activity) => ({
    id: activity.id,
    relatedContent: activity.related_content_item_id ? contentById.get(activity.related_content_item_id) ?? null : null,
    activityType: activity.activity_type as HypothesisActivity["activityType"],
    title: activity.title,
    description: activity.description,
    startedAt: activity.started_at,
    completedAt: activity.completed_at,
    publishedAt: activity.published_at,
    createdAt: activity.created_at,
    updatedAt: activity.updated_at,
    evidence: evidenceByActivity.get(activity.id) ?? [],
  }));
  return {
    id: hypothesisResult.id,
    slug: hypothesisResult.slug,
    project: hypothesisResult.project_item_id ? contentById.get(hypothesisResult.project_item_id) ?? null : null,
    category: toCategoryOption(category),
    parent: hypothesisResult.parent_hypothesis_id && hypothesisResult.parent_relation
      ? { id: hypothesisResult.parent_hypothesis_id, relation: hypothesisResult.parent_relation as HypothesisDetail["parent"] extends infer T ? T extends Readonly<{ relation: infer R }> ? R : never : never }
      : null,
    statement: hypothesisResult.statement,
    rationale: hypothesisResult.rationale,
    successCriteria: hypothesisResult.success_criteria,
    measurementPlan: hypothesisResult.measurement_plan,
    status: hypothesisResult.status as HypothesisDetail["status"],
    visibility: hypothesisResult.visibility as HypothesisDetail["visibility"],
    publicSummary: hypothesisResult.public_summary,
    confidenceBefore: hypothesisResult.confidence_before,
    startedAt: hypothesisResult.started_at,
    reviewDueAt: hypothesisResult.review_due_at,
    concludedAt: hypothesisResult.concluded_at,
    publishedAt: hypothesisResult.published_at,
    createdAt: hypothesisResult.created_at,
    updatedAt: hypothesisResult.updated_at,
    tags: hypothesisTags.flatMap((entry) => {
      const tag = tagById.get(entry.tag_id);
      return tag ? [tag] : [];
    }),
    activities: mappedActivities,
    decisions: decisions.map(toDecision),
  };
}

function isPublicationJson(value: unknown): value is HypothesisPublicationJson {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.every(isPublicationJson);
  if (typeof value !== "object") return false;
  return Object.values(value).every(isPublicationJson);
}

export async function previewHypothesisPublication(
  supabase: ServerSupabaseClient,
  hypothesisId: string,
): Promise<HypothesisPublicationJson> {
  const preview = await runHypothesisAdminQueryWithRetry(
    () => supabase.rpc("preview_hypothesis_publication", { p_hypothesis_id: hypothesisId }).returns<unknown>(),
    "preview hypothesis publication",
  );
  if (!isPublicationJson(preview)) throw new Error("Hypothesis publication preview returned invalid JSON");
  return preview;
}
