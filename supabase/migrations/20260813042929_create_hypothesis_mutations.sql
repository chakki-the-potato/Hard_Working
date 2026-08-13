create function public.create_hypothesis(
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
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hypothesis_id uuid;
  normalized_tag_ids uuid[] := coalesce(p_tag_ids, array[]::uuid[]);
begin
  perform private.require_hypothesis_admin();

  if p_status is null
    or p_status not in ('draft', 'planned', 'running') then
    raise exception using
      errcode = '23514',
      message = 'New hypothesis status must be draft, planned, or running';
  end if;

  if cardinality(normalized_tag_ids) <> (
    select count(distinct tag_id)
    from unnest(normalized_tag_ids) as tag_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'Hypothesis tag IDs must be unique';
  end if;

  if exists (
    select 1
    from unnest(normalized_tag_ids) as requested(tag_id)
    where not exists (
      select 1
      from public.tags
      where id = requested.tag_id
    )
  ) then
    raise exception using
      errcode = '23503',
      message = 'Hypothesis tag does not exist';
  end if;

  insert into public.hypotheses (
    slug,
    project_item_id,
    category_id,
    parent_hypothesis_id,
    parent_relation,
    statement,
    rationale,
    success_criteria,
    measurement_plan,
    status,
    confidence_before,
    started_at,
    review_due_at,
    created_by
  )
  values (
    btrim(p_slug),
    p_project_item_id,
    p_category_id,
    p_parent_hypothesis_id,
    p_parent_relation,
    btrim(p_statement),
    btrim(coalesce(p_rationale, '')),
    btrim(p_success_criteria),
    btrim(coalesce(p_measurement_plan, '')),
    p_status,
    p_confidence_before,
    case when p_status = 'running' then now() else null end,
    p_review_due_at,
    (select auth.uid())
  )
  returning id into hypothesis_id;

  insert into public.hypothesis_tags (
    hypothesis_id,
    tag_id,
    sort_order
  )
  select
    hypothesis_id,
    requested.tag_id,
    requested.ordinality - 1
  from unnest(normalized_tag_ids) with ordinality as requested(tag_id, ordinality);

  return hypothesis_id;
end;
$$;

create function public.update_hypothesis(
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
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_hypothesis public.hypotheses%rowtype;
  normalized_tag_ids uuid[] := coalesce(p_tag_ids, array[]::uuid[]);
begin
  perform private.require_hypothesis_admin();

  select *
  into existing_hypothesis
  from public.hypotheses
  where id = p_hypothesis_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Hypothesis does not exist';
  end if;

  if p_status is null
    or p_status not in ('draft', 'planned', 'running', 'concluded', 'abandoned') then
    raise exception using
      errcode = '23514',
      message = 'Unsupported hypothesis status';
  end if;

  if p_status = 'concluded'
    and existing_hypothesis.status <> 'concluded' then
    raise exception using
      errcode = '23514',
      message = 'Use conclude_hypothesis to conclude a hypothesis';
  end if;

  if cardinality(normalized_tag_ids) <> (
    select count(distinct tag_id)
    from unnest(normalized_tag_ids) as tag_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'Hypothesis tag IDs must be unique';
  end if;

  if exists (
    select 1
    from unnest(normalized_tag_ids) as requested(tag_id)
    where not exists (
      select 1
      from public.tags
      where id = requested.tag_id
    )
  ) then
    raise exception using
      errcode = '23503',
      message = 'Hypothesis tag does not exist';
  end if;

  update public.hypotheses
  set
    slug = btrim(p_slug),
    project_item_id = p_project_item_id,
    category_id = p_category_id,
    statement = btrim(p_statement),
    rationale = btrim(coalesce(p_rationale, '')),
    success_criteria = btrim(p_success_criteria),
    measurement_plan = btrim(coalesce(p_measurement_plan, '')),
    status = p_status,
    public_summary = nullif(btrim(coalesce(p_public_summary, '')), ''),
    confidence_before = p_confidence_before,
    started_at = case
      when p_status = 'running' then coalesce(p_started_at, existing_hypothesis.started_at, now())
      else p_started_at
    end,
    review_due_at = p_review_due_at,
    concluded_at = case
      when p_status = 'abandoned' then coalesce(existing_hypothesis.concluded_at, now())
      when p_status = 'concluded' then existing_hypothesis.concluded_at
      else null
    end
  where id = p_hypothesis_id;

  delete from public.hypothesis_tags
  where hypothesis_id = p_hypothesis_id;

  insert into public.hypothesis_tags (
    hypothesis_id,
    tag_id,
    sort_order
  )
  select
    p_hypothesis_id,
    requested.tag_id,
    requested.ordinality - 1
  from unnest(normalized_tag_ids) with ordinality as requested(tag_id, ordinality);
end;
$$;

create function public.create_hypothesis_activity(
  p_hypothesis_id uuid,
  p_related_content_item_id uuid,
  p_activity_type text,
  p_title text,
  p_description text,
  p_started_at timestamptz,
  p_completed_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_id uuid;
begin
  perform private.require_hypothesis_admin();

  insert into public.hypothesis_activities (
    hypothesis_id,
    related_content_item_id,
    activity_type,
    title,
    description,
    started_at,
    completed_at,
    published_at,
    created_by
  )
  values (
    p_hypothesis_id,
    p_related_content_item_id,
    p_activity_type,
    btrim(p_title),
    btrim(coalesce(p_description, '')),
    p_started_at,
    p_completed_at,
    null,
    (select auth.uid())
  )
  returning id into activity_id;

  return activity_id;
end;
$$;

create function public.update_hypothesis_activity(
  p_activity_id uuid,
  p_related_content_item_id uuid,
  p_activity_type text,
  p_title text,
  p_description text,
  p_started_at timestamptz,
  p_completed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_hypothesis_admin();

  update public.hypothesis_activities
  set
    related_content_item_id = p_related_content_item_id,
    activity_type = p_activity_type,
    title = btrim(p_title),
    description = btrim(coalesce(p_description, '')),
    started_at = p_started_at,
    completed_at = p_completed_at,
    published_at = null
  where id = p_activity_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Hypothesis activity does not exist';
  end if;
end;
$$;

create function public.create_hypothesis_evidence(
  p_activity_id uuid,
  p_evidence_type text,
  p_summary text,
  p_details_markdown text,
  p_source_url text,
  p_observed_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  evidence_id uuid;
begin
  perform private.require_hypothesis_admin();

  insert into public.hypothesis_evidence (
    activity_id,
    evidence_type,
    summary,
    details_markdown,
    source_url,
    observed_at,
    published_at,
    created_by
  )
  values (
    p_activity_id,
    p_evidence_type,
    btrim(p_summary),
    coalesce(p_details_markdown, ''),
    nullif(btrim(coalesce(p_source_url, '')), ''),
    p_observed_at,
    null,
    (select auth.uid())
  )
  returning id into evidence_id;

  return evidence_id;
end;
$$;

create function public.update_hypothesis_evidence(
  p_evidence_id uuid,
  p_evidence_type text,
  p_summary text,
  p_details_markdown text,
  p_source_url text,
  p_observed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_hypothesis_admin();

  update public.hypothesis_evidence
  set
    evidence_type = p_evidence_type,
    summary = btrim(p_summary),
    details_markdown = coalesce(p_details_markdown, ''),
    source_url = nullif(btrim(coalesce(p_source_url, '')), ''),
    observed_at = p_observed_at,
    published_at = null
  where id = p_evidence_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Hypothesis evidence does not exist';
  end if;
end;
$$;

create function public.conclude_hypothesis(
  p_hypothesis_id uuid,
  p_verdict text,
  p_reasoning text,
  p_confidence_after smallint,
  p_failure_type text,
  p_decided_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hypothesis_status text;
  decision_id uuid;
begin
  perform private.require_hypothesis_admin();

  select status
  into hypothesis_status
  from public.hypotheses
  where id = p_hypothesis_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Hypothesis does not exist';
  end if;

  if hypothesis_status <> 'running' then
    raise exception using
      errcode = '23514',
      message = 'Only a running hypothesis can be concluded';
  end if;

  insert into public.hypothesis_decisions (
    hypothesis_id,
    verdict,
    reasoning,
    confidence_after,
    failure_type,
    is_current,
    decided_at,
    created_by
  )
  values (
    p_hypothesis_id,
    p_verdict,
    btrim(p_reasoning),
    p_confidence_after,
    p_failure_type,
    true,
    p_decided_at,
    (select auth.uid())
  )
  returning id into decision_id;

  update public.hypotheses
  set
    status = 'concluded',
    concluded_at = p_decided_at
  where id = p_hypothesis_id;

  return decision_id;
end;
$$;

create function public.correct_hypothesis_decision(
  p_hypothesis_id uuid,
  p_verdict text,
  p_reasoning text,
  p_confidence_after smallint,
  p_failure_type text,
  p_decided_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hypothesis_status text;
  decision_id uuid;
begin
  perform private.require_hypothesis_admin();

  select status
  into hypothesis_status
  from public.hypotheses
  where id = p_hypothesis_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Hypothesis does not exist';
  end if;

  if hypothesis_status <> 'concluded' then
    raise exception using
      errcode = '23514',
      message = 'Only a concluded hypothesis decision can be corrected';
  end if;

  update public.hypothesis_decisions
  set is_current = false
  where hypothesis_id = p_hypothesis_id
    and is_current;

  if not found then
    raise exception using
      errcode = '23514',
      message = 'Current hypothesis decision does not exist';
  end if;

  insert into public.hypothesis_decisions (
    hypothesis_id,
    verdict,
    reasoning,
    confidence_after,
    failure_type,
    is_current,
    decided_at,
    created_by
  )
  values (
    p_hypothesis_id,
    p_verdict,
    btrim(p_reasoning),
    p_confidence_after,
    p_failure_type,
    true,
    p_decided_at,
    (select auth.uid())
  )
  returning id into decision_id;

  return decision_id;
end;
$$;

revoke execute on function public.create_hypothesis(
  text,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  smallint,
  timestamptz,
  uuid[]
) from public, anon;
grant execute on function public.create_hypothesis(
  text,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  smallint,
  timestamptz,
  uuid[]
) to authenticated;

revoke execute on function public.update_hypothesis(
  uuid,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  smallint,
  timestamptz,
  timestamptz,
  uuid[]
) from public, anon;
grant execute on function public.update_hypothesis(
  uuid,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  smallint,
  timestamptz,
  timestamptz,
  uuid[]
) to authenticated;

revoke execute on function public.create_hypothesis_activity(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) from public, anon;
grant execute on function public.create_hypothesis_activity(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) to authenticated;

revoke execute on function public.update_hypothesis_activity(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) from public, anon;
grant execute on function public.update_hypothesis_activity(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) to authenticated;

revoke execute on function public.create_hypothesis_evidence(
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon;
grant execute on function public.create_hypothesis_evidence(
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) to authenticated;

revoke execute on function public.update_hypothesis_evidence(
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon;
grant execute on function public.update_hypothesis_evidence(
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) to authenticated;

revoke execute on function public.conclude_hypothesis(
  uuid,
  text,
  text,
  smallint,
  text,
  timestamptz
) from public, anon;
grant execute on function public.conclude_hypothesis(
  uuid,
  text,
  text,
  smallint,
  text,
  timestamptz
) to authenticated;

revoke execute on function public.correct_hypothesis_decision(
  uuid,
  text,
  text,
  smallint,
  text,
  timestamptz
) from public, anon;
grant execute on function public.correct_hypothesis_decision(
  uuid,
  text,
  text,
  smallint,
  text,
  timestamptz
) to authenticated;
