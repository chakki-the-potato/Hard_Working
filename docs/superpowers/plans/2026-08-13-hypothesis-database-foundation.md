# Hypothesis Database Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가설, 활동, 증거, 판정 계보와 private/public 검토 게이트를 Postgres에서 원자적으로 보장하는 데이터베이스 기반을 만든다.

**Architecture:** 기존 `content_items`, `categories`, `tags`의 식별자는 재사용하지만 가설은 별도 aggregate로 저장한다. 신규 원본 테이블은 관리자에게도 SELECT만 열고 모든 변경은 관리자 검사를 포함한 전용 `SECURITY DEFINER` RPC로 수행한다. 익명 공개는 승인된 필드만 조립하는 별도 projection RPC로 제한한다.

**Tech Stack:** PostgreSQL 17, Supabase CLI, Supabase Auth JWT, Row Level Security, PL/pgSQL, pgTAP.

**Spec:** `docs/superpowers/specs/2026-08-13-hypothesis-tracking-design.md`.

## Global Constraints

- 이 계획은 DB 기반만 구현한다. 관리자 UI, 공개 Next.js route, TypeScript query는 후속 계획에서 다룬다.
- 프로젝트는 imperative migration 방식을 사용한다. 각 migration 파일은 `supabase migration new`에 계획에 적힌 이름을 전달해 생성하고 CLI가 만든 실제 경로를 사용한다.
- 새 패키지나 extension version pinning을 추가하지 않는다.
- `public`의 모든 신규 테이블에 RLS를 활성화한다.
- 원본 테이블은 `authenticated` 관리자 SELECT만 허용하고 `anon`과 일반 authenticated 사용자의 접근을 거부한다.
- 원본 INSERT, UPDATE, DELETE는 관리자에게도 부여하지 않는다. 모든 변경은 전용 mutation RPC만 수행한다.
- 모든 `SECURITY DEFINER` 함수는 `set search_path = ''`, schema-qualified 객체 참조, 명시적 EXECUTE revoke/grant를 사용한다.
- 권한 판정은 `(select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'`만 사용한다.
- 가설 공개 기본값은 `private`다. 공개 상태와 진행 상태·판정은 독립적이다.
- 활동과 증거는 모두 공개 가능하지만 새 항목과 수정 항목은 `published_at IS NULL`인 검토 대기로 저장한다.
- 비공개 프로젝트나 unpublished 연결 콘텐츠의 ID, 제목, slug, path는 공개 projection에서 생략한다.
- 가설 삭제 mutation은 만들지 않는다.
- 원격 DB 적용은 이 계획 범위가 아니다. `supabase db push --dry-run --linked`까지만 실행한다.
- 실행 시점에 존재하는 관련 없는 dirty 파일은 수정·스테이징·복원하지 않는다.
- Supabase 2026-04-28 변경에 따라 신규 public table은 자동 노출을 기대하지 않고 필요한 GRANT를 모두 명시한다.
- Supabase 2026-07-22 변경에 따라 extension version을 SQL에 고정하지 않는다.

---

## File Structure

- `supabase/migrations/*_create_hypothesis_schema.sql`: 테이블, CHECK/FK, 인덱스, RLS, SELECT 정책, 무결성 trigger를 소유한다.
- `supabase/migrations/*_create_hypothesis_mutations.sql`: 관리자 전용 생성·수정·판정 mutation RPC를 소유한다.
- `supabase/migrations/*_create_hypothesis_publication.sql`: 공개 전환, 검토 대기 일괄 공개, 비공개 전환, 공개 projection RPC를 소유한다.
- `supabase/tests/hypothesis_tracking.test.sql`: 스키마, 권한, 생명주기, 공개 projection을 실제 Postgres 역할로 검증한다.
- Task 1 schema migration과 같은 basename을 갖는 `supabase/rollbacks` SQL: 아직 운영 데이터가 없을 때 사용할 역순 제거 SQL을 보관한다. 운영 적용 시에는 이 파일을 직접 실행하지 않고 새 forward migration의 입력으로 사용한다.

각 `*_create_*.sql`의 timestamp는 계획에서 임의 지정하지 않는다. 해당 task의 첫 단계에서 Supabase CLI가 생성한 파일 하나를 확인하고 이후 단계와 커밋에서 그 경로만 사용한다.

### Task 1: 가설 원본 스키마와 무결성 경계

**Files:**

- Create via CLI: `supabase/migrations/*_create_hypothesis_schema.sql`.
- Create: `supabase/tests/hypothesis_tracking.test.sql`.

**Interfaces:**

- Consumes: `public.content_items(id, kind)`, `public.content_versions(content_item_id, state)`, `public.categories(id)`, `public.tags(id)`, `private.set_updated_at()`.
- Produces: `public.hypotheses`, `public.hypothesis_tags`, `public.hypothesis_activities`, `public.hypothesis_evidence`, `public.hypothesis_decisions`, `private.require_hypothesis_admin()`.

- [ ] **Step 1: 현재 로컬 DB 기준선을 확인한다.**

Run:

```bash
supabase db reset --local --no-seed
supabase migration list --local
```

Expected: 기존 migration이 모두 적용되고 pending migration이 없다. 실패하면 새 파일을 만들지 말고 Docker와 기존 migration 오류를 먼저 해결한다.

- [ ] **Step 2: 실패하는 스키마 테스트를 만든다.**

Create `supabase/tests/hypothesis_tracking.test.sql` with this initial structure.

```sql
begin;

select plan(14);

select has_table('public', 'hypotheses', 'hypotheses exists');
select has_table('public', 'hypothesis_tags', 'hypothesis_tags exists');
select has_table('public', 'hypothesis_activities', 'hypothesis_activities exists');
select has_table('public', 'hypothesis_evidence', 'hypothesis_evidence exists');
select has_table('public', 'hypothesis_decisions', 'hypothesis_decisions exists');

select col_default_is('public', 'hypotheses', 'visibility', '''private''::text', 'visibility defaults private');
select col_is_fk('public', 'hypotheses', 'project_item_id', 'project uses FK');
select col_is_fk('public', 'hypotheses', 'category_id', 'category uses FK');
select col_is_fk('public', 'hypothesis_activities', 'related_content_item_id', 'related content uses FK');
select col_is_fk('public', 'hypothesis_evidence', 'activity_id', 'evidence uses activity FK');

select has_index('public', 'hypotheses', 'hypotheses_slug_key', 'slug is unique');
select has_index('public', 'hypothesis_decisions', 'hypothesis_decisions_one_current_idx', 'one current decision index exists');
select results_eq(
  $$select relrowsecurity from pg_catalog.pg_class
    where oid = 'public.hypotheses'::regclass$$,
  array[true],
  'hypotheses RLS enabled'
);
select results_eq(
  $$select has_function_privilege('anon', 'private.require_hypothesis_admin()', 'EXECUTE')$$,
  array[false],
  'private admin helper is not executable by anon'
);

select * from finish();
rollback;
```

- [ ] **Step 3: 테스트가 예상대로 실패하는지 확인한다.**

Run:

```bash
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
```

Expected: FAIL because `public.hypotheses` and the other hypothesis objects do not exist.

- [ ] **Step 4: CLI로 schema migration을 생성한다.**

Run:

```bash
supabase migration new create_hypothesis_schema
SCHEMA_MIGRATION="$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_schema.sql' -print)"
test -n "$SCHEMA_MIGRATION"
test "$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_schema.sql' | wc -l | tr -d ' ')" = "1"
printf '%s\n' "$SCHEMA_MIGRATION"
```

Expected: 정확히 한 경로가 출력된다. 이후 단계에서는 그 파일을 `SCHEMA_MIGRATION`으로 지칭한다.

- [ ] **Step 5: 다섯 테이블과 핵심 CHECK를 `SCHEMA_MIGRATION`에 작성한다.**

Use these exact columns and value sets.

```sql
create table public.hypotheses (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  project_item_id uuid references public.content_items(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  parent_hypothesis_id uuid references public.hypotheses(id) on delete restrict,
  parent_relation text,
  statement text not null,
  rationale text not null default '',
  success_criteria text not null,
  measurement_plan text not null default '',
  status text not null default 'draft',
  visibility text not null default 'private',
  public_summary text,
  confidence_before smallint,
  started_at timestamptz,
  review_due_at timestamptz,
  concluded_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hypotheses_slug_key unique (slug),
  constraint hypotheses_slug_check check (
    slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint hypotheses_statement_check check (btrim(statement) <> ''),
  constraint hypotheses_success_criteria_check check (btrim(success_criteria) <> ''),
  constraint hypotheses_status_check check (status in ('draft', 'planned', 'running', 'concluded', 'abandoned')),
  constraint hypotheses_visibility_check check (visibility in ('private', 'public')),
  constraint hypotheses_confidence_before_check check (confidence_before between 0 and 100),
  constraint hypotheses_parent_relation_check check (
    (parent_hypothesis_id is null and parent_relation is null)
    or (parent_hypothesis_id is not null and parent_relation in ('follow_up', 'pivot', 'retry', 'refinement'))
  ),
  constraint hypotheses_not_own_parent_check check (parent_hypothesis_id is distinct from id),
  constraint hypotheses_publication_check check (
    visibility = 'private'
    or (published_at is not null and btrim(coalesce(public_summary, '')) <> '')
  ),
  constraint hypotheses_conclusion_check check (
    (status in ('concluded', 'abandoned') and concluded_at is not null)
    or (status not in ('concluded', 'abandoned') and concluded_at is null)
  )
);

create table public.hypothesis_tags (
  hypothesis_id uuid not null references public.hypotheses(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  primary key (hypothesis_id, tag_id)
);

create table public.hypothesis_activities (
  id uuid primary key default gen_random_uuid(),
  hypothesis_id uuid not null references public.hypotheses(id) on delete cascade,
  related_content_item_id uuid references public.content_items(id) on delete restrict,
  activity_type text not null,
  title text not null,
  description text not null default '',
  started_at timestamptz not null,
  completed_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hypothesis_activities_type_check check (
    activity_type in ('experiment', 'interview', 'build', 'launch', 'analysis', 'other')
  ),
  constraint hypothesis_activities_title_check check (btrim(title) <> ''),
  constraint hypothesis_activities_timeline_check check (completed_at is null or completed_at >= started_at)
);

create table public.hypothesis_evidence (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.hypothesis_activities(id) on delete cascade,
  evidence_type text not null,
  summary text not null,
  details_markdown text not null default '',
  source_url text,
  observed_at timestamptz not null,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hypothesis_evidence_type_check check (
    evidence_type in ('metric', 'observation', 'feedback', 'artifact', 'source', 'other')
  ),
  constraint hypothesis_evidence_summary_check check (btrim(summary) <> ''),
  constraint hypothesis_evidence_source_url_check check (
    source_url is null or source_url ~ '^https?://'
  )
);

create table public.hypothesis_decisions (
  id uuid primary key default gen_random_uuid(),
  hypothesis_id uuid not null references public.hypotheses(id) on delete cascade,
  verdict text not null,
  reasoning text not null,
  confidence_after smallint,
  failure_type text,
  is_current boolean not null default true,
  decided_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint hypothesis_decisions_verdict_check check (
    verdict in ('supported', 'rejected', 'inconclusive', 'pivoted')
  ),
  constraint hypothesis_decisions_reasoning_check check (btrim(reasoning) <> ''),
  constraint hypothesis_decisions_confidence_check check (confidence_after between 0 and 100),
  constraint hypothesis_decisions_failure_type_check check (
    failure_type is null
    or failure_type in ('hypothesis_error', 'experiment_design', 'execution_incomplete', 'insufficient_data', 'external_condition')
  )
);
```

- [ ] **Step 6: 인덱스와 updated_at trigger를 추가한다.**

```sql
create index hypotheses_project_visibility_idx on public.hypotheses (project_item_id, visibility, published_at desc);
create index hypotheses_status_review_idx on public.hypotheses (status, review_due_at);
create index hypotheses_category_visibility_idx on public.hypotheses (category_id, visibility, published_at desc);
create index hypotheses_parent_idx on public.hypotheses (parent_hypothesis_id);
create index hypotheses_created_by_idx on public.hypotheses (created_by);
create index hypothesis_tags_tag_idx on public.hypothesis_tags (tag_id, hypothesis_id);
create index hypothesis_activities_hypothesis_started_idx on public.hypothesis_activities (hypothesis_id, started_at desc);
create index hypothesis_activities_hypothesis_published_idx on public.hypothesis_activities (hypothesis_id, published_at);
create index hypothesis_activities_related_content_idx on public.hypothesis_activities (related_content_item_id);
create index hypothesis_activities_created_by_idx on public.hypothesis_activities (created_by);
create index hypothesis_evidence_activity_observed_idx on public.hypothesis_evidence (activity_id, observed_at desc);
create index hypothesis_evidence_activity_published_idx on public.hypothesis_evidence (activity_id, published_at);
create index hypothesis_evidence_created_by_idx on public.hypothesis_evidence (created_by);
create index hypothesis_decisions_hypothesis_decided_idx on public.hypothesis_decisions (hypothesis_id, decided_at desc);
create unique index hypothesis_decisions_one_current_idx on public.hypothesis_decisions (hypothesis_id) where is_current;
create index hypothesis_decisions_created_by_idx on public.hypothesis_decisions (created_by);

create trigger hypotheses_set_updated_at before update on public.hypotheses
for each row execute function private.set_updated_at();
create trigger hypothesis_activities_set_updated_at before update on public.hypothesis_activities
for each row execute function private.set_updated_at();
create trigger hypothesis_evidence_set_updated_at before update on public.hypothesis_evidence
for each row execute function private.set_updated_at();
```

- [ ] **Step 7: kind, 관계 불변성, 상태 전이를 검증하는 private trigger를 추가한다.**

Implement focused functions with `set search_path = ''`.

```sql
create function private.require_hypothesis_admin()
returns void language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is null
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;
end;
$$;

create function private.validate_hypothesis_project()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.project_item_id is not null and not exists (
    select 1 from public.content_items as item
    where item.id = new.project_item_id and item.kind = 'project'
  ) then
    raise exception using errcode = '23514', message = 'Hypothesis project must reference a project content item';
  end if;
  return new;
end;
$$;

create function private.validate_hypothesis_related_content()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.related_content_item_id is not null and not exists (
    select 1 from public.content_items as item
    where item.id = new.related_content_item_id and item.kind in ('post', 'idea')
  ) then
    raise exception using errcode = '23514', message = 'Activity related content must reference a post or idea';
  end if;
  return new;
end;
$$;
```

Add these focused trigger functions.

```sql
create function private.prevent_referenced_content_kind_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.kind is not distinct from old.kind then
    return new;
  end if;
  if new.kind <> 'project' and exists (
    select 1 from public.hypotheses where project_item_id = old.id
  ) then
    raise exception using errcode = '23514', message = 'Referenced project kind cannot change';
  end if;
  if new.kind not in ('post', 'idea') and exists (
    select 1 from public.hypothesis_activities where related_content_item_id = old.id
  ) then
    raise exception using errcode = '23514', message = 'Referenced activity content kind cannot change';
  end if;
  return new;
end;
$$;

create function private.enforce_hypothesis_immutability_and_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.parent_hypothesis_id is distinct from old.parent_hypothesis_id
    or new.parent_relation is distinct from old.parent_relation then
    raise exception using errcode = '23514', message = 'Hypothesis lineage is immutable';
  end if;
  if old.published_at is not null and new.slug is distinct from old.slug then
    raise exception using errcode = '23514', message = 'Published hypothesis slug is immutable';
  end if;
  if new.status is distinct from old.status and not (
    (old.status = 'draft' and new.status in ('planned', 'running', 'abandoned'))
    or (old.status = 'planned' and new.status in ('running', 'abandoned'))
    or (old.status = 'running' and new.status in ('concluded', 'abandoned'))
  ) then
    raise exception using errcode = '23514', message = 'Invalid hypothesis status transition';
  end if;
  return new;
end;
$$;

create function private.validate_hypothesis_current_decision()
returns trigger language plpgsql set search_path = '' as $$
declare
  target_hypothesis_id uuid;
  target_status text;
  current_count integer;
begin
  target_hypothesis_id := case
    when tg_table_name = 'hypotheses' then coalesce(new.id, old.id)
    else coalesce(new.hypothesis_id, old.hypothesis_id)
  end;
  select status into target_status from public.hypotheses where id = target_hypothesis_id;
  if target_status is null then
    return null;
  end if;
  select count(*) into current_count
  from public.hypothesis_decisions
  where hypothesis_id = target_hypothesis_id and is_current;
  if (target_status = 'concluded' and current_count <> 1)
    or (target_status <> 'concluded' and current_count <> 0) then
    raise exception using errcode = '23514', message = 'Hypothesis current decision does not match status';
  end if;
  return null;
end;
$$;

create function private.validate_evidence_publication()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.published_at is not null
    and old.published_at is null
    and not exists (
      select 1 from public.hypothesis_activities
      where id = new.activity_id and published_at is not null
    ) then
    raise exception using errcode = '23514', message = 'Evidence cannot publish before its activity';
  end if;
  return new;
end;
$$;
```

Bind the functions with these exact trigger names.

```sql
create trigger hypotheses_validate_project
before insert or update of project_item_id on public.hypotheses
for each row execute function private.validate_hypothesis_project();

create trigger hypothesis_activities_validate_related_content
before insert or update of related_content_item_id on public.hypothesis_activities
for each row execute function private.validate_hypothesis_related_content();

create trigger content_items_prevent_hypothesis_reference_kind_change
before update of kind on public.content_items
for each row execute function private.prevent_referenced_content_kind_change();

create trigger hypotheses_enforce_immutability_and_transition
before update on public.hypotheses
for each row execute function private.enforce_hypothesis_immutability_and_transition();

create trigger hypothesis_evidence_validate_publication
before update of published_at on public.hypothesis_evidence
for each row execute function private.validate_evidence_publication();

create constraint trigger hypotheses_validate_current_decision
after insert or update of status on public.hypotheses
deferrable initially deferred
for each row execute function private.validate_hypothesis_current_decision();

create constraint trigger hypothesis_decisions_validate_current
after insert or update or delete on public.hypothesis_decisions
deferrable initially deferred
for each row execute function private.validate_hypothesis_current_decision();
```

- [ ] **Step 8: RLS와 최소 권한을 추가한다.**

```sql
alter table public.hypotheses enable row level security;
alter table public.hypothesis_tags enable row level security;
alter table public.hypothesis_activities enable row level security;
alter table public.hypothesis_evidence enable row level security;
alter table public.hypothesis_decisions enable row level security;

revoke all on public.hypotheses from anon, authenticated;
revoke all on public.hypothesis_tags from anon, authenticated;
revoke all on public.hypothesis_activities from anon, authenticated;
revoke all on public.hypothesis_evidence from anon, authenticated;
revoke all on public.hypothesis_decisions from anon, authenticated;

grant select on public.hypotheses to authenticated;
grant select on public.hypothesis_tags to authenticated;
grant select on public.hypothesis_activities to authenticated;
grant select on public.hypothesis_evidence to authenticated;
grant select on public.hypothesis_decisions to authenticated;
```

Create one SELECT policy per table with this predicate.

```sql
to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin')
```

Revoke access to every new private function from `public`, `anon`, and `authenticated`.

- [ ] **Step 9: reset과 pgTAP을 통과시킨다.**

Run:

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
supabase db advisors --local --type all --fail-on error
```

Expected: reset succeeds, 14 pgTAP assertions pass, advisors reports no error-level finding caused by this migration.

- [ ] **Step 10: schema task를 커밋한다.**

```bash
git add supabase/migrations/*_create_hypothesis_schema.sql supabase/tests/hypothesis_tracking.test.sql
git --no-pager diff --staged
git commit -m "feat(hypotheses): add database schema"
```

### Task 2: 관리자 mutation RPC와 판정 이력

**Files:**

- Create via CLI: `supabase/migrations/*_create_hypothesis_mutations.sql`.
- Modify: `supabase/tests/hypothesis_tracking.test.sql`.

**Interfaces:**

- Consumes: Task 1 tables and `private.require_hypothesis_admin()`.
- Produces: `create_hypothesis`, `update_hypothesis`, `create_hypothesis_activity`, `update_hypothesis_activity`, `create_hypothesis_evidence`, `update_hypothesis_evidence`, `conclude_hypothesis`, `correct_hypothesis_decision`.

- [ ] **Step 1: mutation 권한·원자성 실패 테스트를 추가한다.**

Increase `select plan(...)` by the number of new assertions. Before switching roles, create fixed auth and CMS fixtures as postgres.

```sql
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.com', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member@example.com', '', now(), now(), now());

insert into public.categories (id, slug, name)
values ('00000000-0000-0000-0000-000000000010', 'experiments', 'Experiments');

insert into public.tags (id, slug, name)
values ('00000000-0000-0000-0000-000000000011', 'validation', 'Validation');

insert into public.content_items (id, kind, slug, path)
values
  ('00000000-0000-0000-0000-000000000020', 'project', 'private-project', '/projects/private-project'),
  ('00000000-0000-0000-0000-000000000021', 'post', 'private-post', '/posts/private-post');

create temporary table hypothesis_test_ids (
  name text primary key,
  id uuid not null
) on commit drop;
```

Then add the admin JWT and raw-write assertions.

```sql
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select throws_ok(
  $$insert into public.hypotheses (slug, category_id, statement, success_criteria)
    values ('raw-write', '00000000-0000-0000-0000-000000000010', 'raw', 'blocked')$$,
  '42501',
  null,
  'admin cannot bypass mutation RPC with raw insert'
);

select lives_ok(
  $$insert into hypothesis_test_ids (name, id)
    select 'primary', public.create_hypothesis(
      'rpc-created', '00000000-0000-0000-0000-000000000020',
      '00000000-0000-0000-0000-000000000010', null, null,
      'A claim', '', 'A criterion', '', 'running', 60, null,
      array['00000000-0000-0000-0000-000000000011'::uuid]
    )$$,
  'admin can create hypothesis through RPC'
);
```

Add these concrete assertions after the primary hypothesis is created.

```sql
select results_eq(
  $$select count(*) from public.hypothesis_tags
    where hypothesis_id = (select id from hypothesis_test_ids where name = 'primary')$$,
  array[1::bigint],
  'create_hypothesis synchronizes tags'
);

select throws_ok(
  $$select public.create_hypothesis(
    'bad-project', '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000010', null, null,
    'Bad project claim', '', 'Criterion', '', 'planned', 40, null, array[]::uuid[]
  )$$,
  '23514',
  'Hypothesis project must reference a project content item',
  'non-project content cannot be used as project'
);

insert into hypothesis_test_ids (name, id)
select 'activity', public.create_hypothesis_activity(
  (select id from hypothesis_test_ids where name = 'primary'),
  '00000000-0000-0000-0000-000000000021',
  'experiment', 'Landing page test', '', now(), null
);

insert into hypothesis_test_ids (name, id)
select 'evidence', public.create_hypothesis_evidence(
  (select id from hypothesis_test_ids where name = 'activity'),
  'metric', 'Ten signups', '', 'https://example.com/evidence', now()
);

select results_eq(
  $$select count(*) from public.hypothesis_activities
    where id = (select id from hypothesis_test_ids where name = 'activity')
      and published_at is null$$,
  array[1::bigint],
  'new activity is pending publication'
);

select results_eq(
  $$select count(*) from public.hypothesis_evidence
    where id = (select id from hypothesis_test_ids where name = 'evidence')
      and published_at is null$$,
  array[1::bigint],
  'new evidence is pending publication'
);

insert into hypothesis_test_ids (name, id)
select 'decision-v1', public.conclude_hypothesis(
  (select id from hypothesis_test_ids where name = 'primary'),
  'supported', 'Criterion met', 80, null, now()
);

insert into hypothesis_test_ids (name, id)
select 'decision-v2', public.correct_hypothesis_decision(
  (select id from hypothesis_test_ids where name = 'primary'),
  'inconclusive', 'Sample was too small', 55, 'insufficient_data', now()
);

select results_eq(
  $$select count(*) from public.hypothesis_decisions
    where hypothesis_id = (select id from hypothesis_test_ids where name = 'primary')$$,
  array[2::bigint],
  'decision correction preserves history'
);

select results_eq(
  $$select count(*) from public.hypothesis_decisions
    where hypothesis_id = (select id from hypothesis_test_ids where name = 'primary')
      and is_current$$,
  array[1::bigint],
  'exactly one corrected decision is current'
);

select results_eq(
  $$select count(*) from pg_catalog.pg_proc
    where pronamespace = 'public'::regnamespace
      and proname like '%delete%hypothesis%'$$,
  array[0::bigint],
  'no hypothesis delete RPC exists'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-000000000002',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'member')
  )::text,
  true
);

select throws_ok(
  $$select public.create_hypothesis(
    'member-write', null, '00000000-0000-0000-0000-000000000010',
    null, null, 'Member claim', '', 'Criterion', '', 'planned', 50, null,
    array[]::uuid[]
  )$$,
  '42501',
  'Administrator access required',
  'normal authenticated user cannot call mutation RPC'
);
```

- [ ] **Step 2: 새 테스트가 함수 부재로 실패하는지 확인한다.**

Run:

```bash
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
```

Expected: FAIL with missing `public.create_hypothesis` and related RPCs.

- [ ] **Step 3: CLI로 mutation migration을 생성한다.**

```bash
supabase migration new create_hypothesis_mutations
MUTATION_MIGRATION="$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_mutations.sql' -print)"
test -n "$MUTATION_MIGRATION"
test "$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_mutations.sql' | wc -l | tr -d ' ')" = "1"
printf '%s\n' "$MUTATION_MIGRATION"
```

Expected: exactly one path.

- [ ] **Step 4: 가설 생성·수정 RPC를 구현한다.**

Use these signatures.

```sql
public.create_hypothesis(
  p_slug text,
  p_project_item_id uuid,
  p_category_id uuid,
  p_parent_hypothesis_id uuid,
  p_parent_relation text,
  p_statement text,
  p_rationale text,
  p_success_criteria text,
  p_measurement_plan text,
  p_status text,
  p_confidence_before smallint,
  p_review_due_at timestamptz,
  p_tag_ids uuid[]
) returns uuid

public.update_hypothesis(
  p_hypothesis_id uuid,
  p_slug text,
  p_project_item_id uuid,
  p_category_id uuid,
  p_statement text,
  p_rationale text,
  p_success_criteria text,
  p_measurement_plan text,
  p_status text,
  p_public_summary text,
  p_confidence_before smallint,
  p_started_at timestamptz,
  p_review_due_at timestamptz,
  p_tag_ids uuid[]
) returns void
```

Both functions must call `private.require_hypothesis_admin()` first, normalize trim-able fields, reject duplicate tag IDs, verify every tag ID exists, and synchronize `hypothesis_tags` in the same transaction. `create_hypothesis` accepts only `draft | planned | running`; it sets `started_at = now()` only for `running`. `update_hypothesis` must not accept `visibility`, `published_at`, `parent_hypothesis_id`, or `parent_relation`; when it receives `abandoned`, it sets `concluded_at = now()`, while `concluded` is allowed only as an unchanged status for editing an already concluded record.

- [ ] **Step 5: 활동·증거 RPC를 구현한다.**

```sql
public.create_hypothesis_activity(
  p_hypothesis_id uuid,
  p_related_content_item_id uuid,
  p_activity_type text,
  p_title text,
  p_description text,
  p_started_at timestamptz,
  p_completed_at timestamptz
) returns uuid

public.update_hypothesis_activity(
  p_activity_id uuid,
  p_related_content_item_id uuid,
  p_activity_type text,
  p_title text,
  p_description text,
  p_started_at timestamptz,
  p_completed_at timestamptz
) returns void

public.create_hypothesis_evidence(
  p_activity_id uuid,
  p_evidence_type text,
  p_summary text,
  p_details_markdown text,
  p_source_url text,
  p_observed_at timestamptz
) returns uuid

public.update_hypothesis_evidence(
  p_evidence_id uuid,
  p_evidence_type text,
  p_summary text,
  p_details_markdown text,
  p_source_url text,
  p_observed_at timestamptz
) returns void
```

Create functions always store `published_at = null`. Update functions always reset only the edited row's `published_at` to null. They never accept publication timestamps from callers.

- [ ] **Step 6: 판정 RPC를 구현한다.**

```sql
public.conclude_hypothesis(
  p_hypothesis_id uuid,
  p_verdict text,
  p_reasoning text,
  p_confidence_after smallint,
  p_failure_type text,
  p_decided_at timestamptz
) returns uuid

public.correct_hypothesis_decision(
  p_hypothesis_id uuid,
  p_verdict text,
  p_reasoning text,
  p_confidence_after smallint,
  p_failure_type text,
  p_decided_at timestamptz
) returns uuid
```

`conclude_hypothesis` requires a `running` hypothesis, inserts one current decision, then sets `status = 'concluded'` and `concluded_at = p_decided_at` in the same transaction. `correct_hypothesis_decision` requires `concluded`, marks the prior current row false, inserts a new current row, and never edits historical content.

- [ ] **Step 7: 모든 mutation 함수 권한을 잠근다.**

For every exact signature, apply this pattern.

```sql
revoke execute on function public.create_hypothesis(
  text, uuid, uuid, uuid, text, text, text, text, text, text, smallint, timestamptz, uuid[]
) from public, anon;
grant execute on function public.create_hypothesis(
  text, uuid, uuid, uuid, text, text, text, text, text, text, smallint, timestamptz, uuid[]
) to authenticated;
```

Every function must be `security definer set search_path = ''` and must call `private.require_hypothesis_admin()` before any read or write.

- [ ] **Step 8: mutation 테스트와 advisor를 통과시킨다.**

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
supabase db advisors --local --type all --fail-on error
```

Expected: admin RPC succeeds, raw table mutation and normal authenticated calls fail with `42501`, decision history and transaction rollback assertions pass.

- [ ] **Step 9: mutation task를 커밋한다.**

```bash
git add supabase/migrations/*_create_hypothesis_mutations.sql supabase/tests/hypothesis_tracking.test.sql
git --no-pager diff --staged
git commit -m "feat(hypotheses): add mutation workflows"
```

### Task 3: 공개 검토 게이트와 안전한 projection

**Files:**

- Create via CLI: `supabase/migrations/*_create_hypothesis_publication.sql`.
- Modify: `supabase/tests/hypothesis_tracking.test.sql`.

**Interfaces:**

- Consumes: Task 1 schema, Task 2 mutation records, existing published `content_versions`.
- Produces: `publish_hypothesis`, `publish_hypothesis_changes`, `unpublish_hypothesis`, `preview_hypothesis_publication`, `list_public_hypotheses`, `get_public_hypothesis_by_slug`, `list_public_hypotheses_by_project`.

- [ ] **Step 1: 공개 경계 실패 테스트를 추가한다.**

Add assertions covering all of these fixtures and outcomes.

```text
private hypothesis                         -> absent from every public RPC
public hypothesis                          -> present in list and slug detail
pending activity/evidence                  -> absent
published evidence under pending activity  -> absent
republished activity                       -> unchanged published evidence returns
pending evidence under republished activity-> absent
private project connection                 -> project id/title/slug/path absent
published project connection               -> public project title/slug/path present
unpublished related post/idea              -> related content metadata absent
published related post/idea                -> related content metadata present
private→public→private→public               -> original hypothesis/child published_at preserved
two public related hypotheses              -> relation present
one private related hypothesis              -> relation absent
```

Verify returned JSON keys exactly with `jsonb_object_keys`; private columns such as `created_by`, `rationale`, and raw CMS IDs must never appear.

Use the existing `primary`, `activity`, and `evidence` fixture IDs from Task 2 for the core publication assertions.

```sql
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'role', 'authenticated',
    'app_metadata', json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select public.update_hypothesis(
  (select id from hypothesis_test_ids where name = 'primary'),
  'rpc-created', '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'A claim', '', 'A criterion', '', 'concluded', 'Public result summary',
  60, null, null, array['00000000-0000-0000-0000-000000000011'::uuid]
);

select lives_ok(
  $$select public.publish_hypothesis(
    (select id from hypothesis_test_ids where name = 'primary')
  )$$,
  'admin can publish reviewed hypothesis and children'
);

select results_eq(
  $$select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'activities'
    )$$,
  array[1],
  'first publish exposes reviewed activity'
);

select results_eq(
  $$select public.get_public_hypothesis_by_slug('rpc-created') -> 'project'$$,
  array['null'::jsonb],
  'unpublished project metadata is omitted'
);

select results_eq(
  $$select array_agg(key order by key)
    from jsonb_object_keys(public.get_public_hypothesis_by_slug('rpc-created')) as key$$,
  array[array[
    'activities', 'category', 'decision', 'id', 'measurementPlan', 'project',
    'publicSummary', 'publishedAt', 'relations', 'slug', 'statement', 'status',
    'successCriteria', 'tags', 'updatedAt'
  ]::text[]],
  'public detail returns only declared top-level keys'
);

insert into hypothesis_test_ids (name, id)
select 'pending-activity', public.create_hypothesis_activity(
  (select id from hypothesis_test_ids where name = 'primary'),
  null, 'analysis', 'Pending analysis', '', now(), null
);

select results_eq(
  $$select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'activities'
    )$$,
  array[1],
  'new activity remains hidden until change publication'
);

select public.update_hypothesis_activity(
  (select id from hypothesis_test_ids where name = 'activity'),
  '00000000-0000-0000-0000-000000000021',
  'experiment', 'Landing page test corrected', '', now(), null
);

select results_eq(
  $$select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'activities'
    )$$,
  array[0],
  'editing a published activity hides it and its published evidence'
);

select public.publish_hypothesis_changes(
  (select id from hypothesis_test_ids where name = 'primary')
);

select results_eq(
  $$select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'activities'
    )$$,
  array[2],
  'change publication restores edited activity and publishes pending activity'
);

select public.unpublish_hypothesis(
  (select id from hypothesis_test_ids where name = 'primary')
);

select results_eq(
  $$select public.get_public_hypothesis_by_slug('rpc-created')$$,
  array[null::jsonb],
  'private hypothesis and missing hypothesis have the same null result'
);
```

Complete the CMS metadata and relation boundary with these assertions.

```sql
set local role postgres;

insert into public.content_versions (
  content_item_id, revision_number, state, title, body_markdown, published_at
) values
  ('00000000-0000-0000-0000-000000000020', 1, 'published', 'Published Project', '', now()),
  ('00000000-0000-0000-0000-000000000021', 1, 'published', 'Published Post', '', now());

set local role authenticated;

select public.publish_hypothesis(
  (select id from hypothesis_test_ids where name = 'primary')
);

select results_eq(
  $$select public.get_public_hypothesis_by_slug('rpc-created') #>> '{project,title}'$$,
  array['Published Project'::text],
  'published project metadata is visible'
);

select results_eq(
  $$select jsonb_path_query_first(
      public.get_public_hypothesis_by_slug('rpc-created'),
      '$.activities[*] ? (@.title == "Landing page test corrected").relatedContent.title'
    ) #>> '{}'$$,
  array['Published Post'::text],
  'published related content metadata is visible'
);

insert into hypothesis_test_ids (name, id)
select 'follow-up', public.create_hypothesis(
  'follow-up', null, '00000000-0000-0000-0000-000000000010',
  (select id from hypothesis_test_ids where name = 'primary'), 'follow_up',
  'A follow-up claim', '', 'A follow-up criterion', '', 'planned', 50, null,
  array[]::uuid[]
);

select public.update_hypothesis(
  (select id from hypothesis_test_ids where name = 'follow-up'),
  'follow-up', null, '00000000-0000-0000-0000-000000000010',
  'A follow-up claim', '', 'A follow-up criterion', '', 'planned',
  'Follow-up public summary', 50, null, null, array[]::uuid[]
);

select public.publish_hypothesis(
  (select id from hypothesis_test_ids where name = 'follow-up')
);

select results_eq(
  $$select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'relations'
    )$$,
  array[1],
  'relation appears when both hypotheses are public'
);

select public.unpublish_hypothesis(
  (select id from hypothesis_test_ids where name = 'follow-up')
);

select results_eq(
  $$select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'relations'
    )$$,
  array[0],
  'relation disappears when the related hypothesis is private'
);
```

- [ ] **Step 2: 공개 함수 부재로 테스트가 실패하는지 확인한다.**

```bash
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
```

Expected: FAIL with missing `public.publish_hypothesis` or public projection functions.

- [ ] **Step 3: CLI로 publication migration을 생성한다.**

```bash
supabase migration new create_hypothesis_publication
PUBLICATION_MIGRATION="$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_publication.sql' -print)"
test -n "$PUBLICATION_MIGRATION"
test "$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_publication.sql' | wc -l | tr -d ' ')" = "1"
printf '%s\n' "$PUBLICATION_MIGRATION"
```

Expected: exactly one path.

- [ ] **Step 4: 공개 projection serializer를 private schema에 구현한다.**

Use this signature.

```sql
private.build_hypothesis_public_projection(
  p_hypothesis_id uuid,
  p_include_pending boolean
) returns jsonb
```

The returned object has exactly these top-level keys.

```json
{
  "id": "uuid",
  "slug": "slug",
  "statement": "claim",
  "successCriteria": "criterion",
  "measurementPlan": "plan",
  "status": "running",
  "publicSummary": "summary",
  "publishedAt": "timestamp",
  "updatedAt": "timestamp",
  "category": { "slug": "category", "name": "Category" },
  "tags": [{ "slug": "tag", "name": "Tag" }],
  "project": null,
  "activities": [],
  "decision": null,
  "relations": []
}
```

Each activity object has exactly `id`, `activityType`, `title`, `description`, `startedAt`, `completedAt`, `publishedAt`, `relatedContent`, `evidence`. Each evidence object has exactly `id`, `evidenceType`, `summary`, `detailsMarkdown`, `sourceUrl`, `observedAt`, `publishedAt`. `relatedContent` is null or `{ "kind", "slug", "path", "title" }`. `decision` is null or `{ "verdict", "reasoning", "confidenceAfter", "failureType", "decidedAt" }`. Each relation is `{ "relation", "hypothesis": { "slug", "statement", "status", "publicSummary" } }`.

Activities sort by `started_at asc, id asc`; evidence sort by `observed_at asc, id asc`; tags sort by `sort_order asc, tag_id asc`; relations sort by related hypothesis `published_at desc, id desc`.

Project and related content metadata may be built only from a join to `content_versions` with `state = 'published'`. Activity inclusion requires `activity.published_at is not null` unless preview includes pending. Evidence inclusion in public mode requires both the parent activity and evidence `published_at` values. Relations require both hypotheses to have `visibility = 'public'`.

- [ ] **Step 5: 관리자 preview와 공개 전환 RPC를 구현한다.**

```sql
public.preview_hypothesis_publication(p_hypothesis_id uuid) returns jsonb
public.publish_hypothesis(p_hypothesis_id uuid) returns jsonb
public.publish_hypothesis_changes(p_hypothesis_id uuid) returns jsonb
public.unpublish_hypothesis(p_hypothesis_id uuid) returns void
```

All four are admin-only `SECURITY DEFINER` functions. Preview calls the shared serializer with `p_include_pending = true`. First publish validates nonblank `public_summary`, sets `visibility = 'public'`, preserves or creates the first `published_at`, stamps pending activities first, then stamps their pending evidence in the same transaction. Change publish only works for an already public hypothesis and uses the same activity-before-evidence order. Unpublish changes only `visibility` and retains all publication timestamps.

- [ ] **Step 6: 익명 공개 조회 RPC를 구현한다.**

```sql
public.list_public_hypotheses() returns setof jsonb
public.get_public_hypothesis_by_slug(p_slug text) returns jsonb
public.list_public_hypotheses_by_project(p_project_item_id uuid) returns setof jsonb
```

These three read functions are the intentional public `SECURITY DEFINER` boundary because anon has no source-table SELECT privilege. Each uses `set search_path = ''`, schema-qualified references, and filters `visibility = 'public'` before calling the serializer. Lists order by the hypothesis's first `published_at desc, id desc`. Slug lookup returns SQL NULL for private or missing rows so the application can map both to the same 404. Project listing returns a row only when the linked project itself has a `content_versions.state = 'published'` row.

- [ ] **Step 7: 공개 함수 권한을 명시한다.**

```text
private.build_hypothesis_public_projection -> no PUBLIC, anon, authenticated EXECUTE
preview/publish/publish_changes/unpublish   -> authenticated EXECUTE only; internal admin check required
list/get/list_by_project                    -> anon and authenticated EXECUTE
all functions                              -> PUBLIC EXECUTE revoked
```

Do not grant SELECT on any hypothesis source table to anon.

- [ ] **Step 8: public projection 테스트와 advisor를 통과시킨다.**

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
supabase db advisors --local --type all --fail-on error
```

Expected: every public/private transition, child review gate, CMS metadata omission, function privilege, JSON key assertion passes.

- [ ] **Step 9: publication task를 커밋한다.**

```bash
git add supabase/migrations/*_create_hypothesis_publication.sql supabase/tests/hypothesis_tracking.test.sql
git --no-pager diff --staged
git commit -m "feat(hypotheses): add publication boundary"
```

### Task 4: 롤백 증명과 최종 DB 검증

**Files:**

- Create: a SQL file under `supabase/rollbacks` whose basename equals the actual Task 1 schema migration basename.
- Modify: `supabase/tests/hypothesis_tracking.test.sql` only if final validation exposes a missing assertion.

**Interfaces:**

- Consumes: all three hypothesis migrations.
- Produces: reviewed rollback SQL and dry-run evidence; no remote database mutation.

- [ ] **Step 1: rollback SQL을 의존성 역순으로 작성한다.**

Resolve and validate the path first.

```bash
SCHEMA_MIGRATION="$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_schema.sql' -print)"
test -n "$SCHEMA_MIGRATION"
ROLLBACK_FILE="supabase/rollbacks/$(basename "$SCHEMA_MIGRATION")"
printf '%s\n' "$ROLLBACK_FILE"
```

Create the printed file with `apply_patch`. It must revoke public entry points before dropping objects.

```sql
revoke execute on function public.list_public_hypotheses() from public, anon, authenticated;
revoke execute on function public.get_public_hypothesis_by_slug(text) from public, anon, authenticated;
revoke execute on function public.list_public_hypotheses_by_project(uuid) from public, anon, authenticated;

drop function if exists public.list_public_hypotheses_by_project(uuid);
drop function if exists public.get_public_hypothesis_by_slug(text);
drop function if exists public.list_public_hypotheses();
drop function if exists public.preview_hypothesis_publication(uuid);
drop function if exists public.publish_hypothesis(uuid);
drop function if exists public.publish_hypothesis_changes(uuid);
drop function if exists public.unpublish_hypothesis(uuid);
drop function if exists private.build_hypothesis_public_projection(uuid, boolean);

drop function if exists public.correct_hypothesis_decision(uuid, text, text, smallint, text, timestamptz);
drop function if exists public.conclude_hypothesis(uuid, text, text, smallint, text, timestamptz);
drop function if exists public.update_hypothesis_evidence(uuid, text, text, text, text, timestamptz);
drop function if exists public.create_hypothesis_evidence(uuid, text, text, text, text, timestamptz);
drop function if exists public.update_hypothesis_activity(uuid, uuid, text, text, text, timestamptz, timestamptz);
drop function if exists public.create_hypothesis_activity(uuid, uuid, text, text, text, timestamptz, timestamptz);
drop function if exists public.update_hypothesis(uuid, text, uuid, uuid, text, text, text, text, text, text, smallint, timestamptz, timestamptz, uuid[]);
drop function if exists public.create_hypothesis(text, uuid, uuid, uuid, text, text, text, text, text, text, smallint, timestamptz, uuid[]);

drop trigger if exists content_items_prevent_hypothesis_reference_kind_change on public.content_items;

drop table if exists public.hypothesis_evidence;
drop table if exists public.hypothesis_activities;
drop table if exists public.hypothesis_tags;
drop table if exists public.hypothesis_decisions;
drop table if exists public.hypotheses;

drop function if exists private.validate_evidence_publication();
drop function if exists private.validate_hypothesis_current_decision();
drop function if exists private.enforce_hypothesis_immutability_and_transition();
drop function if exists private.prevent_referenced_content_kind_change();
drop function if exists private.validate_hypothesis_related_content();
drop function if exists private.validate_hypothesis_project();
drop function if exists private.require_hypothesis_admin();
```

Do not drop shared `private.set_updated_at()` or existing CMS objects.

- [ ] **Step 2: clean reset과 전체 pgTAP을 다시 실행한다.**

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
supabase db advisors --local --type all --fail-on error
supabase migration list --local
```

Expected: all tests pass, no advisor errors, all three new migrations are locally applied in timestamp order.

- [ ] **Step 3: migration drift가 없는지 확인한다.**

```bash
supabase db diff --local --schema public,private
```

Expected: empty diff. Non-empty output means a local ad-hoc change was not represented by the migrations; update the correct migration and repeat reset/test/diff.

- [ ] **Step 4: 원격 적용 계획만 dry-run한다.**

```bash
supabase db push --dry-run --linked
```

Expected: exactly the three new hypothesis migrations are listed as pending. Do not run `supabase db push` without `--dry-run`.

- [ ] **Step 5: rollback SQL을 임시 로컬 DB에서 증명한다.**

Apply the rollback companion only to the resettable local DB, verify the five tables and public functions are gone, then reset migrations back to the final state.

```bash
SCHEMA_MIGRATION="$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_schema.sql' -print)"
ROLLBACK_FILE="supabase/rollbacks/$(basename "$SCHEMA_MIGRATION")"
psql "postgresql://postgres:postgres@127.0.0.1:55322/postgres" -v ON_ERROR_STOP=1 -f "$ROLLBACK_FILE"
psql "postgresql://postgres:postgres@127.0.0.1:55322/postgres" -Atc "select to_regclass('public.hypotheses'), to_regprocedure('public.list_public_hypotheses()')"
supabase db reset --local --no-seed
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
```

Expected: the verification query returns two NULL values after rollback, then reset and pgTAP restore the final passing state.

- [ ] **Step 6: 최종 DB 기반을 커밋한다.**

```bash
SCHEMA_MIGRATION="$(find supabase/migrations -maxdepth 1 -name '*_create_hypothesis_schema.sql' -print)"
ROLLBACK_FILE="supabase/rollbacks/$(basename "$SCHEMA_MIGRATION")"
git add "$ROLLBACK_FILE" supabase/tests/hypothesis_tracking.test.sql
git --no-pager diff --staged
git commit -m "test(hypotheses): verify database rollback"
```

- [ ] **Step 7: handoff 증거를 기록한다.**

Report these independently.

```text
local reset: pass/fail
pgTAP assertion count: exact count and pass/fail
database advisors: exact error/warning count
schema diff: empty/non-empty
remote dry-run: pending migration names or exact blocker
rollback rehearsal: pass/fail
remote apply: not run
unrelated dirty files: preserved paths
```

Stop after this report. The next plan starts with the admin TypeScript domain and `/admin/hypotheses`; it must not be folded into this database commit series.
