# Inline Content Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 공개 사이트 안에서 글, 아이디어, 프로젝트를 하나의 모달로 생성·수정·발행하게 만든다.

**Architecture:** `public.save_content_draft`를 세 콘텐츠 유형의 단일 DB mutation 경계로 추가하고, 기존 post 전용 작성 모듈을 discriminated union 기반 콘텐츠 작성 도메인으로 교체한다. Next.js parallel/intercepted route는 모달과 직접 접근 fallback을 함께 제공하며, 공개 shell의 단일 관리자 상태 provider가 상단 `작성`과 상세 `수정` action을 제어한다.

**Tech Stack:** Next.js 16.2.12 App Router, React 19.2.8 Server Actions, TypeScript 5.9.3, Supabase Postgres/Auth/Storage, pgTAP, Playwright 1.61.0.

**Spec:** `docs/superpowers/specs/2026-08-13-inline-content-authoring-design.md`.

## Global Constraints

- 지원 콘텐츠 유형은 정확히 `post | idea | project`다. 가설 도메인은 변경하지 않는다.
- 새 패키지를 추가하지 않는다.
- `/admin/import`와 `public.import_content_snapshot`을 변경하지 않는다.
- 기존 post 이미지 업로드는 보존하되 이번 범위에서 idea/project 이미지 업로드를 추가하지 않는다.
- DB 변경은 migration으로만 수행하고 동일 basename의 rollback companion을 만든다.
- 원격 Supabase 적용은 로컬 reset, pgTAP, rollback rehearsal 통과 후 별도 사용자 승인을 받아 실행한다.
- 프로덕션 검증에서는 콘텐츠를 생성·수정·발행하지 않는다.
- 기존 `save_post_draft`는 새 앱 배포와 live read-only 검증이 끝난 뒤 별도 removal migration으로 제거한다.
- Server Action의 `redirect()`는 `try` 바깥에서 호출하고 mutation 후 필요한 path를 `revalidatePath()`한다.
- intercepted route slot에는 unmatched navigation에서 `null`을 반환하는 기존 `default.tsx` 계약을 유지한다.
- `next-env.d.ts` 자동 생성 변경은 커밋에서 제외한다.
- 각 task는 정확한 경로만 stage하며 push는 별도 승인 전 실행하지 않는다.
- 실행은 가설 관리자 브랜치가 `origin/main`에 통합되고 `app/admin/hypotheses/**`와 가설 전용 `app/admin/page.tsx`가 확인된 뒤, 최신 `origin/main`에서 만든 격리 worktree에서 시작한다.

## File and Responsibility Map

- `supabase/migrations/20260813050000_add_content_authoring_workflow.sql`: additive `save_content_draft` RPC와 아이디어 하위 path cascade.
- `supabase/rollbacks/20260813050000_add_content_authoring_workflow.sql`: additive RPC와 helper만 역순 제거.
- `supabase/tests/content_authoring.test.sql`: 권한, 세 유형 lifecycle, path, cascade, rollback pgTAP.
- `src/lib/content/content-editor-types.ts`: 작성 입력·action state·RPC 결과 discriminated union.
- `src/lib/content/content-editor-validation.ts`: FormData 정규화와 유형별 순수 검증.
- `src/lib/content/content-editor-rpc.ts`: RPC 결과의 순수 runtime type guard.
- `tests/content-editor-validation.test.mjs`: validation contract의 Node test.
- `src/lib/content/content-editor-queries.ts`: category, idea parent, 세 유형 draft 조회.
- `src/lib/content/content-editor-actions.ts`: 관리자 확인, RPC 호출, revalidation, redirect.
- `src/components/writer/content-writer.tsx`: writer 조립만 담당하는 Server Component.
- `src/components/editor/content-editor-form.tsx`: 유형 선택, 공통 필드, action state 조립.
- `src/components/editor/post-fields.tsx`: post 전용 category field.
- `src/components/editor/idea-fields.tsx`: idea category·parent fields.
- `src/components/editor/project-fields.tsx`: project summary·status·metadata fields.
- `src/components/site/admin-status-provider.tsx`: 공개 shell에서 관리자 상태를 한 번만 조회·공유.
- `src/components/site/admin-write-action.tsx`: 현재 공개 경로를 보존하는 작성/login action.
- `src/components/site/admin-edit-action.tsx`: 관리자에게만 보이는 상세 수정 action.
- `src/components/site/article-view.tsx`: 상세 header에 edit action 배치.
- `app/(site)/write/**`, `app/(site)/@writer/**`: 같은 `ContentWriter`를 page/modal mode로 조립.
- `app/admin/page.tsx`: 동시 개발된 가설 관리 작업 영역을 보존하고 콘텐츠 작성 링크를 제공하지 않는다.
- `app/admin/posts/**`: legacy 콘텐츠 작성 URL redirect만 담당.
- `tests/e2e/admin-writer.spec.ts`: guest/login/route contract.
- `tests/e2e/content-authoring.spec.ts`: 로컬 관리자 세 유형 browser flow.
- `supabase/migrations/20260813060000_remove_post_draft_workflow.sql`: live 검증 뒤 legacy RPC 제거.
- `supabase/rollbacks/20260813060000_remove_post_draft_workflow.sql`: legacy RPC를 원래 signature와 grant로 복원.

기존 `src/lib/content/admin-actions.ts`, `admin-types.ts`, `admin-validation.ts`, `admin-queries.ts`는 post 작성, 목록, 삭제 보조 책임이 섞여 있다. 새 작성 workflow를 추가하지 않고 작성 책임만 새 `content-editor-*` 모듈로 이동한다. `PostWriter`는 세 유형 조립 책임을 받지 않고 `ContentWriter`로 대체한다.

---

### Task 1: Add the additive post-compatible content RPC

**Files:**
- Create: `supabase/migrations/20260813050000_add_content_authoring_workflow.sql`
- Create: `supabase/tests/content_authoring.test.sql`

**Interfaces:**
- Consumes: `public.content_items`, `public.content_versions`, `public.categories`, `public.content_redirects`, `public.publish_content_version(uuid)`.
- Produces: `public.save_content_draft(uuid,text,text,uuid,uuid,text,text,text,text,text,text,text,text,text,text,integer,boolean)` returning `(item_id uuid, kind text, draft_version_id uuid, published_version_id uuid, canonical_path text)`.

- [ ] **Step 1: Write failing pgTAP authorization and post lifecycle tests.**

Create a transaction-scoped test with `no_plan()` so Task 2 can extend it without renumbering. Use fixed UUIDs and the same request-claim pattern as `supabase/tests/hypothesis_tracking.test.sql`.

```sql
begin;
select no_plan();

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'authoring-admin@example.com', '{"role":"admin"}', '{}'),
  ('10000000-0000-4000-8000-000000000002', 'authoring-member@example.com', '{"role":"member"}', '{}');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","app_metadata":{"role":"member"}}', true);
select throws_ok(
  $$ select * from public.save_content_draft(null, 'post', 'blocked', (select id from public.categories where slug = 'thinking'), null, 'Blocked', null, null, '', null, null, null, null, null, null, 0, false) $$,
  '42501',
  'Administrator access is required',
  'member cannot save content'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","app_metadata":{"role":"admin"}}', true);
create temporary table saved_post as
select * from public.save_content_draft(
  null, 'post', 'authoring-post',
  (select id from public.categories where slug = 'thinking'), null,
  'Authoring post', 'Description', null, 'Body',
  null, null, null, null, null, null, 0, false
);
select is((select kind from saved_post), 'post', 'post draft returns its kind');
select is((select canonical_path from saved_post), '/posts/thinking/authoring-post', 'post path is server-derived');
select is((select state from public.content_versions where id = (select draft_version_id from saved_post)), 'draft', 'post creates a draft');

select * from finish();
rollback;
```

The test file must name and assert these contracts individually with `throws_ok`, `is`, `ok`, and `results_eq`: anon/member rejection, invalid kind, invalid slug, blank title, 501-character description, 500,001-character body, missing category, empty published body, new post draft, post update, post publish, next draft creation, duplicate path rollback, and old-path 308 redirect.

- [ ] **Step 2: Run the focused DB test and confirm the expected RED state.**

Run:

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/content_authoring.test.sql --local
```

Expected: FAIL because `public.save_content_draft` does not exist.

- [ ] **Step 3: Implement the additive RPC with the exact signature and post branch.**

Start the migration with the explicit function contract.

```sql
create function public.save_content_draft(
  p_item_id uuid,
  p_kind text,
  p_slug text,
  p_category_id uuid,
  p_parent_item_id uuid,
  p_title text,
  p_description text,
  p_summary text,
  p_body_markdown text,
  p_demo_url text,
  p_repository_url text,
  p_role text,
  p_period text,
  p_outcome text,
  p_project_status text,
  p_project_sort_order integer,
  p_publish boolean
)
returns table (
  item_id uuid,
  kind text,
  draft_version_id uuid,
  published_version_id uuid,
  canonical_path text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  content_item public.content_items%rowtype;
  draft_version public.content_versions%rowtype;
  published_version public.content_versions%rowtype;
  normalized_kind text := lower(btrim(coalesce(p_kind, '')));
  normalized_slug text := lower(btrim(coalesce(p_slug, '')));
  resolved_category_slug text;
  next_path text;
  previous_path text;
begin
  if (select auth.uid()) is null
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin'
  then
    raise exception using errcode = '42501', message = 'Administrator access is required';
  end if;

  if normalized_kind not in ('post', 'idea', 'project') then
    raise exception using errcode = '22023', message = 'A valid content kind is required';
  end if;

  if normalized_slug = ''
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or char_length(normalized_slug) > 120
  then
    raise exception using errcode = '22023', message = 'A valid content slug is required';
  end if;

  if btrim(coalesce(p_title, '')) = '' or char_length(p_title) > 200 then
    raise exception using errcode = '22023', message = 'A valid content title is required';
  end if;

  if char_length(coalesce(p_description, '')) > 500 then
    raise exception using errcode = '22023', message = 'Content description must be 500 characters or fewer';
  end if;

  if char_length(coalesce(p_body_markdown, '')) > 500000 then
    raise exception using errcode = '22023', message = 'Content body must be 500000 characters or fewer';
  end if;
end;
$$;
```

Implement the post branch by moving the executable create/update/publish statements from `supabase/migrations/20260729135938_add_post_draft_workflow.sql` into this branch. Change only the shared error nouns, return columns, and `next_path := '/posts/' || resolved_category_slug || '/' || normalized_slug`; preserve kind-locked update, one draft, `publish_content_version`, and 308 redirect behavior. Revoke `public` and `anon`, grant only `authenticated`.

- [ ] **Step 4: Run the focused pgTAP file.**

Run: `supabase test db supabase/tests/content_authoring.test.sql --local`.

Expected: all post and authorization assertions PASS.

- [ ] **Step 5: Commit the additive post-compatible boundary.**

```bash
git add supabase/migrations/20260813050000_add_content_authoring_workflow.sql supabase/tests/content_authoring.test.sql
git --no-pager diff --staged
git commit -m "feat(cms): add common content draft workflow"
```

### Task 2: Extend the RPC for ideas, projects, and descendant redirects

**Files:**
- Modify: `supabase/migrations/20260813050000_add_content_authoring_workflow.sql`
- Modify: `supabase/tests/content_authoring.test.sql`

**Interfaces:**
- Consumes: Task 1 `public.save_content_draft` signature, `public.project_version_details`, `public.publish_content_version` project-detail cloning.
- Produces: complete `post | idea | project` behavior under the unchanged RPC signature.

- [ ] **Step 1: Add failing idea hierarchy tests.**

Add fixtures and assertions for:

```sql
create temporary table saved_parent as
select * from public.save_content_draft(
  null, 'idea', 'parent-idea',
  (select id from public.categories where slug = 'works'), null,
  'Parent idea', null, null, 'Parent body',
  null, null, null, null, null, null, 0, true
);

create temporary table saved_child as
select * from public.save_content_draft(
  null, 'idea', 'child-idea', null,
  (select item_id from saved_parent),
  'Child idea', null, null, 'Child body',
  null, null, null, null, null, null, 0, true
);

select is((select canonical_path from saved_child), '/ideas/works/parent-idea/child-idea', 'child inherits parent path');
```

The idea section of the test file must contain one named assertion for each of these contracts: top-level path, parent kind rejection, self-parent rejection, descendant-parent cycle rejection, inherited category, parent rename cascade, multi-level descendant cascade, descendant draft/published category cascade, archived category preservation, one redirect per old path, and full rollback when one destination path conflicts.

- [ ] **Step 2: Add failing project lifecycle tests.**

Create a project fixture with summary, optional category, `https://example.com/demo`, `https://github.com/example/repo`, role, period, outcome, `paused`, and sort order 7. The project section must name and assert canonical `/projects/authoring-project`, every stored content-version field, the detail row, publish cloning to the new draft, update, redirect, `http:` rejection, invalid status rejection, negative sort-order rejection, and missing published summary/body rejection. Task 4 covers non-integer form input before RPC invocation.

- [ ] **Step 3: Run the focused test and verify the new assertions fail.**

Run: `supabase test db supabase/tests/content_authoring.test.sql --local`.

Expected: post assertions PASS; idea/project assertions FAIL at the unimplemented branches.

- [ ] **Step 4: Implement idea validation and recursive path cascade.**

Use a recursive CTE rooted at the changed idea to collect ids and paths into local arrays. Lock the real `content_items` rows in deterministic path order before collision checks. Calculate each new descendant path by replacing the old root prefix with the new root path, then insert redirects before updating item paths.

```sql
select array_agg(tree.id order by tree.path), array_agg(tree.path order by tree.path)
into descendant_ids, descendant_paths
from (
  with recursive idea_tree as (
    select id, parent_item_id, path, 0 as depth
    from public.content_items
    where id = content_item.id
    union all
    select child.id, child.parent_item_id, child.path, tree.depth + 1
    from public.content_items child
    join idea_tree tree on child.parent_item_id = tree.id
    where child.kind = 'idea'
  )
  select id, path, depth from idea_tree
) tree;

perform 1
from public.content_items
where id = any(descendant_ids)
order by path
for update;
```

Reject a parent found in the root's recursive descendants. For descendants, compute `next_path || substr(old_child_path, char_length(previous_path) + 1)`. Detect conflicts against `content_items.path` outside the tree and `content_redirects.source_path` targeting another item. Insert/upsert 308 redirects for every changed row and then update paths inside the transaction.

When the resolved root category changes, update `category_id` for descendant versions whose state is `draft` or `published`. Do not update `archived` versions.

- [ ] **Step 5: Implement the project branch.**

Write shared version fields to `content_versions`; for project drafts upsert exactly one detail row.

```sql
insert into public.project_version_details (content_version_id, status, sort_order)
values (draft_version.id, normalized_project_status, p_project_sort_order)
on conflict (content_version_id) do update
set status = excluded.status, sort_order = excluded.sort_order;
```

Normalize empty optional text to `null`. Accept URL values only when `url ~ '^https://[^[:space:]]+$'`. Require summary and body on publish. Rely on `publish_content_version` to clone the published project detail into the new draft.

- [ ] **Step 6: Reset and run both CMS and hypothesis DB suites.**

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/content_authoring.test.sql --local
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
```

Expected: both files PASS. The second command proves project-kind references used by hypotheses were not regressed.

- [ ] **Step 7: Commit the complete database behavior.**

```bash
git add supabase/migrations/20260813050000_add_content_authoring_workflow.sql supabase/tests/content_authoring.test.sql
git --no-pager diff --staged
git commit -m "feat(cms): support idea and project authoring"
```

### Task 3: Add and rehearse the additive migration rollback

**Files:**
- Create: `supabase/rollbacks/20260813050000_add_content_authoring_workflow.sql`

**Interfaces:**
- Consumes: Task 1 migration function signature.
- Produces: non-destructive rollback that removes only the new RPC and private helpers created by that migration.

- [ ] **Step 1: Write the rollback SQL in dependency order.**

```sql
revoke execute on function public.save_content_draft(
  uuid, text, text, uuid, uuid, text, text, text, text,
  text, text, text, text, text, text, integer, boolean
) from authenticated;

drop function if exists public.save_content_draft(
  uuid, text, text, uuid, uuid, text, text, text, text,
  text, text, text, text, text, text, integer, boolean
);
```

Keep the recursive path cascade inside `save_content_draft`, so this rollback drops only the public function. Do not delete any content row, redirect, category, asset, project detail, or hypothesis row.

- [ ] **Step 2: Verify rollback on the resettable local database.**

```bash
supabase db reset --local --no-seed
CONTENT_AUTHORING_DB_URL="$(supabase status -o env | sed -n 's/^DB_URL=//p' | tr -d '"')"
psql "$CONTENT_AUTHORING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/rollbacks/20260813050000_add_content_authoring_workflow.sql
unset CONTENT_AUTHORING_DB_URL
```

Then query `to_regprocedure('public.save_content_draft(uuid,text,text,uuid,uuid,text,text,text,text,text,text,text,text,text,text,integer,boolean)')` and expect `NULL`.

- [ ] **Step 3: Restore migrations and rerun DB tests.**

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/content_authoring.test.sql --local
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
```

Expected: reset reapplies the function and both suites PASS.

- [ ] **Step 4: Commit rollback evidence.**

```bash
git add supabase/rollbacks/20260813050000_add_content_authoring_workflow.sql
git --no-pager diff --staged
git commit -m "test(cms): verify content authoring rollback"
```

### Task 4: Create the typed editor input and validation boundary

**Files:**
- Create: `src/lib/content/content-editor-types.ts`
- Create: `src/lib/content/content-editor-validation.ts`
- Create: `tests/content-editor-validation.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: spec field limits and `EditorDestination = 'writer'` during the transition.
- Produces: `ContentKind`, `ContentEditorValues`, `ContentEditorActionState`, `SaveContentInput`, `parseContentEditorFormData(formData)`.

- [ ] **Step 1: Define failing validation tests for the discriminated union.**

Test exact successful shapes for post, top-level idea, child idea, and project. Test invalid kind, UUIDs, slug, title, description, body, required publish body, post category, top-level idea category, project summary, project status, sort order, and `https:` URLs.

```js
test("parses a project without leaking idea fields", () => {
  const form = new FormData();
  form.set("kind", "project");
  form.set("slug", "unified-writer");
  form.set("title", "Unified writer");
  form.set("description", "Description");
  form.set("bodyMarkdown", "Body");
  form.set("summary", "Summary");
  form.set("projectStatus", "active");
  form.set("projectSortOrder", "0");
  form.set("intent", "save");
  form.set("editorDestination", "writer");

  const result = parseContentEditorFormData(form);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.input.values.kind, "project");
  assert.equal(result.ok && "parentItemId" in result.input.values, false);
});
```

- [ ] **Step 2: Run the Node test and verify RED.**

Run: `node --test tests/content-editor-validation.test.mjs`.

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement exact union types.**

```ts
export type ContentKind = "post" | "idea" | "project";

type CommonEditorValues = Readonly<{
  itemId: string | null;
  slug: string;
  title: string;
  description: string;
  bodyMarkdown: string;
}>;

export type ContentEditorValues =
  | (CommonEditorValues & Readonly<{ kind: "post"; categoryId: string }>)
  | (CommonEditorValues & Readonly<{ kind: "idea"; categoryId: string; parentItemId: string | null }>)
  | (CommonEditorValues & Readonly<{
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
  | "kind" | "slug" | "categoryId" | "parentItemId" | "title"
  | "description" | "summary" | "bodyMarkdown" | "projectStatus"
  | "projectSortOrder" | "period" | "role" | "outcome"
  | "demoUrl" | "repositoryUrl";

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
```

Preserve parsed values on every validation failure. Use `values: null` only before a new writer kind is selected.

- [ ] **Step 4: Implement pure FormData parsing.**

Normalize common strings once, then construct exactly one union member. Use the existing UUID, slug, and size limits. URL validation uses `new URL(value)` plus `url.protocol === 'https:'`; catch only `TypeError` from invalid URL construction. Do not mutate the `FormData` or returned values.

- [ ] **Step 5: Add and run the focused package script.**

Add:

```json
"test:content-editor": "node --test tests/content-editor-validation.test.mjs"
```

Run:

```bash
npm run test:content-editor
npm run typecheck:next
```

Expected: validation tests and typecheck PASS.

- [ ] **Step 6: Commit the typed validation boundary.**

```bash
git add package.json src/lib/content/content-editor-types.ts src/lib/content/content-editor-validation.ts tests/content-editor-validation.test.mjs
git --no-pager diff --staged
git commit -m "feat(cms): add typed content editor validation"
```

### Task 5: Replace post-only queries and action with common authoring modules

**Files:**
- Create: `src/lib/content/content-editor-queries.ts`
- Create: `src/lib/content/content-editor-actions.ts`
- Create: `src/lib/content/content-editor-rpc.ts`
- Modify: `tests/content-editor-validation.test.mjs`

**Interfaces:**
- Consumes: Task 1 RPC result and Task 4 `SaveContentInput`.
- Produces: `listContentEditorOptions`, `getContentDraft`, `saveContentAction`, `ContentDraft`, `ContentEditorOptions`.

- [ ] **Step 1: Add query result types and source-level failing integration assertions.**

Create `isSaveContentRpcRow` in the pure `content-editor-rpc.ts` module. Extend `tests/content-editor-validation.test.mjs` to import the guard and assert that only this shape passes:

```ts
type SaveContentRpcRow = Readonly<{
  item_id: string;
  kind: ContentKind;
  draft_version_id: string;
  published_version_id: string | null;
  canonical_path: string;
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
```

Run `npm run test:content-editor` and expect failure because the guard is absent.

- [ ] **Step 2: Implement option and draft queries.**

`listContentEditorOptions` returns ordered categories and all idea items with their draft title/path/category. `getContentDraft` fetches item kind, slug, path, parent, draft common fields, optional project detail, and published timestamp. Return a typed union and reject incomplete rows rather than filling invalid defaults.

Use the existing `runAdminQueryWithRetry` only for idempotent reads. Do not add retry around RPC mutation.

- [ ] **Step 3: Implement `saveContentAction`.**

Map the discriminated union to all RPC parameters, using `null` for fields owned by other kinds. Validate the returned row with `isSaveContentRpcRow`. On error, log `operation`, `kind`, `itemId`, `slug`, `code`, `details`, `hint`, and `message` as structured fields.

After success:

```ts
revalidatePath("/");
revalidatePath("/search");
revalidatePath("/ideas");
revalidatePath("/projects");
revalidatePath(rawResult.canonical_path);
revalidatePath(`/write/${rawResult.item_id}`);

const resultName = publish ? "published" : "saved";
const destination = publish
  ? rawResult.canonical_path
  : `/write/${rawResult.item_id}?result=${resultName}`;
redirect(destination);
```

Keep `redirect()` outside the mutation `try/catch` because it throws by design.

- [ ] **Step 4: Keep the post writer live during the additive application transition.**

Do not remove or modify `savePostAction`, `parsePostFormData`, post types, `getPostDraft`, asset modules, or post form destination branching in this task. The existing production UI must continue compiling against `save_post_draft` while the new application boundary is reviewed.

- [ ] **Step 5: Run DB, validation, and type checks.**

```bash
supabase test db supabase/tests/content_authoring.test.sql --local
npm run test:content-editor
npm run typecheck:next
```

Expected: all commands PASS while the existing post writer remains the active UI.

- [ ] **Step 6: Commit the additive application boundary.**

```bash
git add src/lib/content/content-editor-queries.ts src/lib/content/content-editor-actions.ts src/lib/content/content-editor-rpc.ts tests/content-editor-validation.test.mjs
git --no-pager diff --staged
git commit -m "feat(cms): add common editor application boundary"
```

### Task 6: Build the common writer UI and wire both route modes

**Files:**
- Create: `src/components/writer/content-writer.tsx`
- Create: `src/components/editor/content-editor-form.tsx`
- Create: `src/components/editor/post-fields.tsx`
- Create: `src/components/editor/idea-fields.tsx`
- Create: `src/components/editor/project-fields.tsx`
- Modify: `src/components/writer/writer-overlay.tsx`
- Modify: `src/components/editor/post-delete-form.tsx`
- Modify: `app/(site)/write/page.tsx`
- Modify: `app/(site)/write/[id]/page.tsx`
- Modify: `app/(site)/@writer/(.)write/page.tsx`
- Modify: `app/(site)/@writer/(.)write/[id]/page.tsx`
- Modify: `app/(site)/styles/writer.css`
- Modify: `src/lib/content/admin-actions.ts`
- Modify: `src/lib/content/admin-queries.ts`
- Modify: `src/lib/content/admin-types.ts`
- Modify: `src/lib/content/admin-validation.ts`
- Modify: `src/lib/content/admin-asset-actions.ts`
- Modify: `src/lib/content/admin-asset-queries.ts`
- Modify: `src/lib/content/admin-post-delete-action.ts`
- Modify: `src/lib/content/editor-destination.ts`
- Delete: `src/components/writer/post-writer.tsx`
- Delete: `src/components/editor/post-editor-form.tsx`

**Interfaces:**
- Consumes: Task 4 editor union, Task 5 queries/action, existing `WriterOverlay` modal/page contract.
- Produces: `ContentWriter({ itemId?, initialKind?, mode, result? })` and accessible type-specific form UI.

- [ ] **Step 1: Update route props to carry `kind`.**

Both new-writer routes accept `searchParams.kind` and pass only `post | idea | project` to `ContentWriter`. Edit routes ignore query kind and resolve kind from DB. Preserve `result` handling in page and intercepted variants.

- [ ] **Step 2: Implement the Server Component orchestrator.**

`ContentWriter` must perform only UUID validation, `requireAdminSession(writerPath)`, parallel option/draft/assets loading, defaults, and result-message selection. Render `PostAssetManager` and `PostDeleteForm` only when `draft.values.kind === 'post'` and `itemId` exists.

```tsx
<ContentEditorForm
  initialKind={initialKind}
  initialValues={draft?.values ?? null}
  options={options}
/>
```

- [ ] **Step 3: Implement type selection and common form state.**

Use buttons with `aria-pressed` and labels `글`, `아이디어`, `프로젝트`. With no initial kind, show only the selector and explanatory copy. On create, selecting a kind creates typed defaults. On edit, hide switching controls and render the fixed kind label.

Before changing a non-empty create form, call `window.confirm("작성 중인 내용이 초기화됩니다. 유형을 바꿀까요?")`; cancel leaves state untouched.

- [ ] **Step 4: Implement focused field components.**

Each field component receives typed values, field errors, options, and renders only owned inputs. `IdeaFields` disables category when a parent is selected and submits the inherited category id. `ProjectFields` uses a select for status, number input with `min={0}` and `step={1}`, and URL inputs for demo/repository.

Common form submits hidden `itemId`, `kind`, and `editorDestination=writer`, then the two existing intents `save` and `publish`. Preserve all returned values and show field errors by stable ids.

- [ ] **Step 5: Preserve modal accessibility and direct-page fallback.**

Keep `role="dialog"`, `aria-modal`, focus-on-close-button, Escape close, body scroll lock, `router.back()` for modal, and `router.replace('/')` for page mode. Ensure `app/(site)/@writer/default.tsx` still returns `null` so unrelated client navigation closes the modal.

- [ ] **Step 6: Retire post-only writer exports and keep assets post-only.**

Remove `savePostAction`, `parsePostFormData`, `PostEditorValues`, `PostEditorActionState`, `SavePostInput`, `SavePostResult`, and `getPostDraft` after all UI imports point to the common modules. Retain `listAdminPosts`, delete action types, query retry, and post deletion behavior. Rename `listPostAssets` to `listContentAssets`, but keep upload item lookup restricted to `kind = 'post'`; do not enable idea/project uploads. Change successful post deletion navigation from `/admin?result=...` to `/?result=...` so it does not enter the hypothesis workspace.

- [ ] **Step 7: Run focused tests and typecheck.**

```bash
npm run test:content-editor
npm run typecheck:next
```

Expected: PASS with no imports from deleted post writer/form files.

- [ ] **Step 8: Commit the unified writer UI.**

Stage only the files listed in Task 6, inspect the staged diff, then commit:

```bash
git commit -m "feat(cms): add unified inline content writer"
```

### Task 7: Share admin status and add contextual write/edit entry points

**Files:**
- Create: `src/components/site/admin-status-provider.tsx`
- Create: `src/components/site/admin-edit-action.tsx`
- Modify: `src/components/site/public-shell.tsx`
- Modify: `src/components/site/site-header.tsx`
- Modify: `src/components/site/admin-write-action.tsx`
- Modify: `src/components/site/article-view.tsx`
- Modify: `app/admin/login/page.tsx`
- Modify: `src/lib/auth/return-path.ts`
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/posts/new/page.tsx`
- Modify: `app/admin/posts/[id]/page.tsx`
- Modify: `app/(site)/ideas/[...path]/page.tsx`
- Modify: `app/(site)/projects/[slug]/page.tsx`
- Modify: `tests/e2e/admin-writer.spec.ts`

**Interfaces:**
- Consumes: `/api/auth/admin-status`, `/write`, `/write/[id]`, `PublicContentItem.id`.
- Produces: `AdminStatusProvider`, `useAdminStatus()`, `AdminEditAction({ itemId })`, legacy redirects.

- [ ] **Step 1: Extend guest and redirect E2E tests first.**

Assert guest header login href contains the current pathname and query, invalid external return path falls back to `/`, legacy post routes redirect to `/write` or `/write/[id]` while preserving a valid UUID, and `/admin` remains the authenticated hypothesis workspace without a `새 글 작성` action.

Run: `npx playwright test tests/e2e/admin-writer.spec.ts`.

Expected: FAIL on current static `next=/`, legacy post pages, and content links that still remain in the admin workspace.

- [ ] **Step 2: Extract one admin-status provider.**

Move retry, response guard, and fetch ownership from `AdminWriteAction` into `AdminStatusProvider`. Expose:

```ts
type AdminStatusContextValue = Readonly<{
  isAdmin: boolean;
  isResolved: boolean;
}>;

export function useAdminStatus(): AdminStatusContextValue;
```

Wrap the public shell once so header and article action share the same request. On terminal lookup failure expose `{ isAdmin: false, isResolved: true }` and keep structured logging.

- [ ] **Step 3: Preserve the current route through login.**

Use `usePathname()` and `useSearchParams()` in `AdminWriteAction` to build the internal return path. When admin, link to `/write`; otherwise link to `getAdminLoginPath(currentPath)` and label `관리자`.

Wrap `AdminWriteAction` in a `Suspense` boundary in `SiteHeader` because `useSearchParams()` participates in static rendering. The fallback renders the same non-interactive width without exposing admin state.

Change `DEFAULT_RETURN_PATH` to `/`. Keep rejection of external, protocol-relative, backslash, CR, and LF paths.

- [ ] **Step 4: Add contextual edit action.**

Render `<AdminEditAction itemId={item.id} />` in the article header. It returns `null` unless `isAdmin` is true, then links to `/write/{itemId}` with accessible name `콘텐츠 수정` and visible label `수정`.

- [ ] **Step 5: Replace only legacy post pages with redirects.**

Use `redirect('/write')` and `redirect(`/write/${id}`)` in the two post page modules. Remove their now-unused editor imports. Preserve the hypothesis management content in `app/admin/page.tsx`, but remove post lists, `새 글 작성`, and import navigation from that page. Do not change `app/admin/import/**`, `app/admin/login/**`, or `app/admin/hypotheses/**` routes.

- [ ] **Step 6: Honor content redirects for ideas and projects.**

Match the existing post route behavior: when the requested idea or project is absent, find its source path in `listPublicRedirects()` and call `permanentRedirect(redirect.targetPath)` before `notFound()`. Add focused E2E assertions for an old idea path and old project path.

- [ ] **Step 7: Run route tests and typecheck.**

```bash
npx playwright test tests/e2e/admin-writer.spec.ts
npm run typecheck:next
```

Expected: guest/login/legacy redirect tests PASS.

- [ ] **Step 8: Commit contextual admin entry points.**

```bash
git add src/components/site/admin-status-provider.tsx src/components/site/admin-edit-action.tsx src/components/site/public-shell.tsx src/components/site/site-header.tsx src/components/site/admin-write-action.tsx src/components/site/article-view.tsx app/admin/login/page.tsx src/lib/auth/return-path.ts app/admin/page.tsx app/admin/posts/new/page.tsx 'app/admin/posts/[id]/page.tsx' 'app/(site)/ideas/[...path]/page.tsx' 'app/(site)/projects/[slug]/page.tsx' tests/e2e/admin-writer.spec.ts
git --no-pager diff --staged
git commit -m "feat(cms): add contextual authoring actions"
```

### Task 8: Prove authenticated browser flows against local Supabase

**Files:**
- Create: `tests/e2e/content-authoring.spec.ts`
- Create: `tests/e2e/helpers/local-admin.ts`

**Interfaces:**
- Consumes: local Supabase URL, anon key, service-role key passed only through environment; unified writer UI.
- Produces: isolated admin fixture and cleanup for real create/update/publish browser flows.

- [ ] **Step 1: Create a local-only admin fixture helper.**

Read `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `E2E_SUPABASE_SERVICE_ROLE_KEY`. Fail with a clear setup error when missing. Use the existing `@supabase/supabase-js` dependency and service role only in the Playwright process to create a unique user with `app_metadata.role = 'admin'`; delete that user in teardown. Never send the service role to the browser or Next.js public env.

- [ ] **Step 2: Write the authenticated E2E scenarios before UI fixes.**

Cover these exact flows with unique slugs:

1. Login from `/ideas?view=all` and return to the same URL.
2. Header changes from `관리자` to `작성`.
3. Open intercepted `/write`, select each kind, and verify only owned fields.
4. Save a post draft and remain on `/write/{id}?result=saved`.
5. Publish an idea and match the canonical URL pattern `/ideas/works/e2e-idea-[a-z0-9-]+`.
6. Publish a project and land on `/projects/{slug}`.
7. Open `수정` from each published detail and verify fixed kind plus existing values.
8. Rename a parent idea and verify old parent and child URLs redirect to their new paths.
9. Guest browser does not render `작성` or `수정`.

Delete content fixtures through the local service-role client after each test, including redirects, versions, assets, and items in foreign-key-safe order.

- [ ] **Step 3: Configure the authoring suite without changing production behavior.**

Add a per-file `test.describe.configure({ mode: 'serial' })` because the hierarchy scenario depends on its own parent/child order. Keep global Playwright config unchanged and read the three required env names only inside `tests/e2e/helpers/local-admin.ts`.

- [ ] **Step 4: Run authenticated E2E against reset local Supabase.**

Start/reset local Supabase, export the local URL/keys for this command only, then run:

```bash
npx playwright test tests/e2e/content-authoring.spec.ts
```

Expected: all authenticated and guest scenarios PASS, and teardown leaves no `e2e-*` content paths.

- [ ] **Step 5: Run the complete E2E suite.**

Run: `npx playwright test`.

Expected: existing public, SEO, search, writer, and new authoring tests PASS.

- [ ] **Step 6: Commit browser proof.**

```bash
git add tests/e2e/content-authoring.spec.ts tests/e2e/helpers/local-admin.ts
git --no-pager diff --staged
git commit -m "test(cms): cover inline content authoring"
```

### Task 9: Run the full local release gate

**Files:**
- Modify only if verification exposes a scoped defect in files already owned by Tasks 1–8.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: reviewable local release candidate; no remote mutation.

- [ ] **Step 1: Reset and test the complete database.**

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/content_authoring.test.sql --local
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
```

- [ ] **Step 2: Run application tests and static checks.**

```bash
npm run test:import-policy
npm run test:content-editor
npm run typecheck:next
npm run build
npx playwright test
git diff --check
```

- [ ] **Step 3: Perform manual browser checks.**

At desktop and 390px width, verify type selection, long validation messages, Escape close, close-button focus, body scroll lock restoration, direct `/write` fallback, edit action placement, and back/forward modal behavior. Save screenshots only under `.playwright-mcp/_archive/screenshots/`.

- [ ] **Step 4: Request code review and resolve Critical/Important findings.**

Review the migration security boundary, recursive idea cascade, Server Action redirect placement, client admin-state exposure, cleanup fixture safety, and route compatibility. Re-run the affected focused test after every fix, then repeat Steps 1–2.

- [ ] **Step 5: Confirm exact release candidate state.**

```bash
git status --short --branch
git log --oneline --decorate origin/main..HEAD
git diff --check origin/main..HEAD
```

Expected: only intentional commits, clean worktree, no generated `next-env.d.ts` diff, and no untracked test artifacts.

### Task 10: Deploy additively, verify live read-only, then remove the legacy RPC

**Files:**
- Create after live verification: `supabase/migrations/20260813060000_remove_post_draft_workflow.sql`
- Create after live verification: `supabase/rollbacks/20260813060000_remove_post_draft_workflow.sql`

**Interfaces:**
- Consumes: production app verified on `save_content_draft`; original `save_post_draft` definition from `20260729135938_add_post_draft_workflow.sql`.
- Produces: one authoritative content mutation RPC with reversible legacy removal.

- [ ] **Step 1: Stop for explicit production DB approval.**

Present the exact project ref, additive migration filename, dry-run output, rollback filename, test counts, and command. Do not apply the migration until the user approves this production DB target.

- [ ] **Step 2: Apply only the additive migration and verify its catalog contract.**

Confirm the new function exists with `prosecdef = false`, empty configured search path, no `public`/`anon` execute privilege, and `authenticated` execute privilege. Do not call the mutation RPC with production content.

- [ ] **Step 3: Push the application commits after separate push approval.**

Fetch/prune, confirm the branch is based on current `origin/main`, push normally, and wait for Vercel production `READY` at the exact commit SHA.

- [ ] **Step 4: Perform production read-only browser verification.**

With the user's administrator session, verify login return, `작성`, type selector, all three empty forms, `수정` action visibility, direct `/write` fallback, and legacy redirects. Do not submit `초안 저장` or `발행`.

- [ ] **Step 5: Write the legacy removal migration only after Step 4 passes.**

Removal migration:

```sql
revoke execute on function public.save_post_draft(
  uuid, text, uuid, text, text, text, boolean
) from authenticated;

drop function public.save_post_draft(
  uuid, text, uuid, text, text, text, boolean
);
```

The rollback companion must reproduce the complete original function body and grants from `supabase/migrations/20260729135938_add_post_draft_workflow.sql`; do not reference that migration dynamically.

- [ ] **Step 6: Rehearse removal rollback locally.**

Reset local DB, apply the removal migration, assert `save_post_draft` is absent and `save_content_draft` still passes pgTAP, apply the rollback companion, then assert the old signature and grants are restored.

- [ ] **Step 7: Commit the removal migration.**

```bash
git add supabase/migrations/20260813060000_remove_post_draft_workflow.sql supabase/rollbacks/20260813060000_remove_post_draft_workflow.sql
git --no-pager diff --staged
git commit -m "refactor(cms): remove legacy post draft RPC"
```

- [ ] **Step 8: Request separate approval for the removal migration.**

Apply and push only after reporting the live application SHA, zero remaining `save_post_draft` callers from `rg`, local rollback rehearsal, and exact removal target. After deployment, verify the old function is absent, the common function privileges remain correct, Vercel is `READY`, and the production UI still renders without data writes.
