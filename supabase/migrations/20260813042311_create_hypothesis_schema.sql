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
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint hypotheses_statement_check check (btrim(statement) <> ''),
  constraint hypotheses_success_criteria_check check (btrim(success_criteria) <> ''),
  constraint hypotheses_status_check check (
    status in ('draft', 'planned', 'running', 'concluded', 'abandoned')
  ),
  constraint hypotheses_visibility_check check (visibility in ('private', 'public')),
  constraint hypotheses_confidence_before_check check (
    confidence_before between 0 and 100
  ),
  constraint hypotheses_parent_relation_check check (
    (
      parent_hypothesis_id is null
      and parent_relation is null
    )
    or (
      parent_hypothesis_id is not null
      and parent_relation in ('follow_up', 'pivot', 'retry', 'refinement')
    )
  ),
  constraint hypotheses_not_own_parent_check check (
    parent_hypothesis_id is distinct from id
  ),
  constraint hypotheses_publication_check check (
    visibility = 'private'
    or (
      published_at is not null
      and btrim(coalesce(public_summary, '')) <> ''
    )
  ),
  constraint hypotheses_conclusion_check check (
    (
      status in ('concluded', 'abandoned')
      and concluded_at is not null
    )
    or (
      status not in ('concluded', 'abandoned')
      and concluded_at is null
    )
  )
);

create table public.hypothesis_tags (
  hypothesis_id uuid not null references public.hypotheses(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (hypothesis_id, tag_id),
  constraint hypothesis_tags_sort_order_check check (sort_order >= 0)
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
  constraint hypothesis_activities_timeline_check check (
    completed_at is null
    or completed_at >= started_at
  )
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
    source_url is null
    or source_url ~ '^https?://'
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
  constraint hypothesis_decisions_confidence_check check (
    confidence_after between 0 and 100
  ),
  constraint hypothesis_decisions_failure_type_check check (
    failure_type is null
    or failure_type in (
      'hypothesis_error',
      'experiment_design',
      'execution_incomplete',
      'insufficient_data',
      'external_condition'
    )
  )
);

create index hypotheses_project_visibility_idx
  on public.hypotheses (project_item_id, visibility, published_at desc);
create index hypotheses_status_review_idx
  on public.hypotheses (status, review_due_at);
create index hypotheses_category_visibility_idx
  on public.hypotheses (category_id, visibility, published_at desc);
create index hypotheses_parent_idx
  on public.hypotheses (parent_hypothesis_id);
create index hypotheses_created_by_idx
  on public.hypotheses (created_by);
create index hypothesis_tags_tag_idx
  on public.hypothesis_tags (tag_id, hypothesis_id);
create index hypothesis_activities_hypothesis_started_idx
  on public.hypothesis_activities (hypothesis_id, started_at desc);
create index hypothesis_activities_hypothesis_published_idx
  on public.hypothesis_activities (hypothesis_id, published_at);
create index hypothesis_activities_related_content_idx
  on public.hypothesis_activities (related_content_item_id);
create index hypothesis_activities_created_by_idx
  on public.hypothesis_activities (created_by);
create index hypothesis_evidence_activity_observed_idx
  on public.hypothesis_evidence (activity_id, observed_at desc);
create index hypothesis_evidence_activity_published_idx
  on public.hypothesis_evidence (activity_id, published_at);
create index hypothesis_evidence_created_by_idx
  on public.hypothesis_evidence (created_by);
create index hypothesis_decisions_hypothesis_decided_idx
  on public.hypothesis_decisions (hypothesis_id, decided_at desc);
create unique index hypothesis_decisions_one_current_idx
  on public.hypothesis_decisions (hypothesis_id)
  where is_current;
create index hypothesis_decisions_created_by_idx
  on public.hypothesis_decisions (created_by);

create function private.require_hypothesis_admin()
returns void
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception using
      errcode = '42501',
      message = 'Administrator access required';
  end if;
end;
$$;

create function private.validate_hypothesis_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.project_item_id is not null
    and not exists (
      select 1
      from public.content_items as item
      where item.id = new.project_item_id
        and item.kind = 'project'
    ) then
    raise exception using
      errcode = '23514',
      message = 'Hypothesis project must reference a project content item';
  end if;

  return new;
end;
$$;

create function private.validate_hypothesis_related_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.related_content_item_id is not null
    and not exists (
      select 1
      from public.content_items as item
      where item.id = new.related_content_item_id
        and item.kind in ('post', 'idea')
    ) then
    raise exception using
      errcode = '23514',
      message = 'Activity related content must reference a post or idea';
  end if;

  return new;
end;
$$;

create function private.prevent_referenced_content_kind_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind is not distinct from old.kind then
    return new;
  end if;

  if new.kind <> 'project'
    and exists (
      select 1
      from public.hypotheses
      where project_item_id = old.id
    ) then
    raise exception using
      errcode = '23514',
      message = 'Referenced project kind cannot change';
  end if;

  if new.kind not in ('post', 'idea')
    and exists (
      select 1
      from public.hypothesis_activities
      where related_content_item_id = old.id
    ) then
    raise exception using
      errcode = '23514',
      message = 'Referenced activity content kind cannot change';
  end if;

  return new;
end;
$$;

create function private.enforce_hypothesis_immutability_and_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_hypothesis_id is distinct from old.parent_hypothesis_id
    or new.parent_relation is distinct from old.parent_relation then
    raise exception using
      errcode = '23514',
      message = 'Hypothesis lineage is immutable';
  end if;

  if old.published_at is not null
    and new.slug is distinct from old.slug then
    raise exception using
      errcode = '23514',
      message = 'Published hypothesis slug is immutable';
  end if;

  if new.status is distinct from old.status
    and not (
      (old.status = 'draft' and new.status in ('planned', 'running', 'abandoned'))
      or (old.status = 'planned' and new.status in ('running', 'abandoned'))
      or (old.status = 'running' and new.status in ('concluded', 'abandoned'))
    ) then
    raise exception using
      errcode = '23514',
      message = 'Invalid hypothesis status transition';
  end if;

  return new;
end;
$$;

create function private.validate_hypothesis_current_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hypothesis_id uuid;
  target_status text;
  current_count integer;
begin
  target_hypothesis_id := case
    when tg_table_name = 'hypotheses' then coalesce(new.id, old.id)
    else coalesce(new.hypothesis_id, old.hypothesis_id)
  end;

  select status
  into target_status
  from public.hypotheses
  where id = target_hypothesis_id;

  if target_status is null then
    return null;
  end if;

  select count(*)
  into current_count
  from public.hypothesis_decisions
  where hypothesis_id = target_hypothesis_id
    and is_current;

  if (target_status = 'concluded' and current_count <> 1)
    or (target_status <> 'concluded' and current_count <> 0) then
    raise exception using
      errcode = '23514',
      message = 'Hypothesis current decision does not match status';
  end if;

  return null;
end;
$$;

create function private.validate_evidence_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.published_at is not null
    and old.published_at is null
    and not exists (
      select 1
      from public.hypothesis_activities
      where id = new.activity_id
        and published_at is not null
    ) then
    raise exception using
      errcode = '23514',
      message = 'Evidence cannot publish before its activity';
  end if;

  return new;
end;
$$;

create trigger hypotheses_set_updated_at
before update on public.hypotheses
for each row execute function private.set_updated_at();

create trigger hypothesis_activities_set_updated_at
before update on public.hypothesis_activities
for each row execute function private.set_updated_at();

create trigger hypothesis_evidence_set_updated_at
before update on public.hypothesis_evidence
for each row execute function private.set_updated_at();

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

create policy hypotheses_admin_select
on public.hypotheses
for select
to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy hypothesis_tags_admin_select
on public.hypothesis_tags
for select
to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy hypothesis_activities_admin_select
on public.hypothesis_activities
for select
to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy hypothesis_evidence_admin_select
on public.hypothesis_evidence
for select
to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

create policy hypothesis_decisions_admin_select
on public.hypothesis_decisions
for select
to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

revoke all on function private.require_hypothesis_admin() from public, anon, authenticated;
revoke all on function private.validate_hypothesis_project() from public, anon, authenticated;
revoke all on function private.validate_hypothesis_related_content() from public, anon, authenticated;
revoke all on function private.prevent_referenced_content_kind_change() from public, anon, authenticated;
revoke all on function private.enforce_hypothesis_immutability_and_transition() from public, anon, authenticated;
revoke all on function private.validate_hypothesis_current_decision() from public, anon, authenticated;
revoke all on function private.validate_evidence_publication() from public, anon, authenticated;
