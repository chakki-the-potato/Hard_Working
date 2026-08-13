create function private.build_hypothesis_public_evidence(
  p_activity_id uuid,
  p_include_pending boolean
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', evidence.id,
        'evidenceType', evidence.evidence_type,
        'summary', evidence.summary,
        'detailsMarkdown', evidence.details_markdown,
        'sourceUrl', evidence.source_url,
        'observedAt', evidence.observed_at,
        'publishedAt', evidence.published_at
      )
      order by evidence.observed_at asc, evidence.id asc
    ),
    '[]'::jsonb
  )
  from public.hypothesis_evidence as evidence
  where evidence.activity_id = p_activity_id
    and (p_include_pending or evidence.published_at is not null)
$$;

create function private.build_hypothesis_public_activities(
  p_hypothesis_id uuid,
  p_include_pending boolean
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', activity.id,
        'activityType', activity.activity_type,
        'title', activity.title,
        'description', activity.description,
        'startedAt', activity.started_at,
        'completedAt', activity.completed_at,
        'publishedAt', activity.published_at,
        'relatedContent', (
          select jsonb_build_object(
            'kind', item.kind,
            'slug', item.slug,
            'path', item.path,
            'title', version.title
          )
          from public.content_items as item
          join public.content_versions as version
            on version.content_item_id = item.id
           and version.state = 'published'
          where item.id = activity.related_content_item_id
        ),
        'evidence', private.build_hypothesis_public_evidence(
          activity.id,
          p_include_pending
        )
      )
      order by activity.started_at asc, activity.id asc
    ),
    '[]'::jsonb
  )
  from public.hypothesis_activities as activity
  where activity.hypothesis_id = p_hypothesis_id
    and (p_include_pending or activity.published_at is not null)
$$;

create function private.build_hypothesis_public_projection(
  p_hypothesis_id uuid,
  p_include_pending boolean
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', hypothesis.id,
    'slug', hypothesis.slug,
    'statement', hypothesis.statement,
    'successCriteria', hypothesis.success_criteria,
    'measurementPlan', hypothesis.measurement_plan,
    'status', hypothesis.status,
    'publicSummary', hypothesis.public_summary,
    'publishedAt', hypothesis.published_at,
    'updatedAt', hypothesis.updated_at,
    'category', jsonb_build_object(
      'slug', category.slug,
      'name', category.name
    ),
    'tags', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'slug', tag.slug,
            'name', tag.name
          )
          order by hypothesis_tag.sort_order asc, hypothesis_tag.tag_id asc
        ),
        '[]'::jsonb
      )
      from public.hypothesis_tags as hypothesis_tag
      join public.tags as tag
        on tag.id = hypothesis_tag.tag_id
      where hypothesis_tag.hypothesis_id = hypothesis.id
    ),
    'project', (
      select jsonb_build_object(
        'slug', item.slug,
        'path', item.path,
        'title', version.title
      )
      from public.content_items as item
      join public.content_versions as version
        on version.content_item_id = item.id
       and version.state = 'published'
      where item.id = hypothesis.project_item_id
        and item.kind = 'project'
    ),
    'activities', private.build_hypothesis_public_activities(
      hypothesis.id,
      p_include_pending
    ),
    'decision', (
      select jsonb_build_object(
        'verdict', decision.verdict,
        'reasoning', decision.reasoning,
        'confidenceAfter', decision.confidence_after,
        'failureType', decision.failure_type,
        'decidedAt', decision.decided_at
      )
      from public.hypothesis_decisions as decision
      where decision.hypothesis_id = hypothesis.id
        and decision.is_current
    ),
    'relations', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'relation', related.parent_relation,
            'hypothesis', jsonb_build_object(
              'slug', related.slug,
              'statement', related.statement,
              'status', related.status,
              'publicSummary', related.public_summary
            )
          )
          order by related.published_at desc, related.id desc
        ),
        '[]'::jsonb
      )
      from public.hypotheses as related
      where related.parent_hypothesis_id = hypothesis.id
        and related.visibility = 'public'
    )
  )
  from public.hypotheses as hypothesis
  join public.categories as category
    on category.id = hypothesis.category_id
  where hypothesis.id = p_hypothesis_id
$$;

create function public.preview_hypothesis_publication(
  p_hypothesis_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  projection jsonb;
begin
  perform private.require_hypothesis_admin();

  select private.build_hypothesis_public_projection(
    p_hypothesis_id,
    true
  )
  into projection;

  if projection is null then
    raise exception using
      errcode = 'P0002',
      message = 'Hypothesis does not exist';
  end if;

  return projection;
end;
$$;

create function public.publish_hypothesis(
  p_hypothesis_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_hypothesis public.hypotheses%rowtype;
  publication_time timestamptz := now();
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

  if btrim(coalesce(existing_hypothesis.public_summary, '')) = '' then
    raise exception using
      errcode = '23514',
      message = 'Public hypothesis summary is required';
  end if;

  update public.hypotheses
  set
    visibility = 'public',
    published_at = coalesce(published_at, publication_time)
  where id = p_hypothesis_id;

  update public.hypothesis_activities
  set published_at = publication_time
  where hypothesis_id = p_hypothesis_id
    and published_at is null;

  update public.hypothesis_evidence as evidence
  set published_at = publication_time
  from public.hypothesis_activities as activity
  where evidence.activity_id = activity.id
    and activity.hypothesis_id = p_hypothesis_id
    and activity.published_at is not null
    and evidence.published_at is null;

  return private.build_hypothesis_public_projection(
    p_hypothesis_id,
    false
  );
end;
$$;

create function public.publish_hypothesis_changes(
  p_hypothesis_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  publication_time timestamptz := now();
begin
  perform private.require_hypothesis_admin();

  perform 1
  from public.hypotheses
  where id = p_hypothesis_id
    and visibility = 'public'
  for update;

  if not found then
    raise exception using
      errcode = '23514',
      message = 'Only a public hypothesis can publish changes';
  end if;

  update public.hypothesis_activities
  set published_at = publication_time
  where hypothesis_id = p_hypothesis_id
    and published_at is null;

  update public.hypothesis_evidence as evidence
  set published_at = publication_time
  from public.hypothesis_activities as activity
  where evidence.activity_id = activity.id
    and activity.hypothesis_id = p_hypothesis_id
    and activity.published_at is not null
    and evidence.published_at is null;

  return private.build_hypothesis_public_projection(
    p_hypothesis_id,
    false
  );
end;
$$;

create function public.unpublish_hypothesis(
  p_hypothesis_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_hypothesis_admin();

  update public.hypotheses
  set visibility = 'private'
  where id = p_hypothesis_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Hypothesis does not exist';
  end if;
end;
$$;

create function public.list_public_hypotheses()
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.build_hypothesis_public_projection(
    hypothesis.id,
    false
  )
  from public.hypotheses as hypothesis
  where hypothesis.visibility = 'public'
  order by hypothesis.published_at desc, hypothesis.id desc
$$;

create function public.get_public_hypothesis_by_slug(
  p_slug text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.build_hypothesis_public_projection(
    hypothesis.id,
    false
  )
  from public.hypotheses as hypothesis
  where hypothesis.slug = p_slug
    and hypothesis.visibility = 'public'
$$;

create function public.list_public_hypotheses_by_project(
  p_project_item_id uuid
)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.build_hypothesis_public_projection(
    hypothesis.id,
    false
  )
  from public.hypotheses as hypothesis
  where hypothesis.project_item_id = p_project_item_id
    and hypothesis.visibility = 'public'
    and exists (
      select 1
      from public.content_items as project
      join public.content_versions as version
        on version.content_item_id = project.id
       and version.state = 'published'
      where project.id = p_project_item_id
        and project.kind = 'project'
    )
  order by hypothesis.published_at desc, hypothesis.id desc
$$;

revoke execute on function private.build_hypothesis_public_evidence(
  uuid,
  boolean
) from public, anon, authenticated;
revoke execute on function private.build_hypothesis_public_activities(
  uuid,
  boolean
) from public, anon, authenticated;
revoke execute on function private.build_hypothesis_public_projection(
  uuid,
  boolean
) from public, anon, authenticated;

revoke execute on function public.preview_hypothesis_publication(uuid)
from public, anon, authenticated;
grant execute on function public.preview_hypothesis_publication(uuid)
to authenticated;

revoke execute on function public.publish_hypothesis(uuid)
from public, anon, authenticated;
grant execute on function public.publish_hypothesis(uuid)
to authenticated;

revoke execute on function public.publish_hypothesis_changes(uuid)
from public, anon, authenticated;
grant execute on function public.publish_hypothesis_changes(uuid)
to authenticated;

revoke execute on function public.unpublish_hypothesis(uuid)
from public, anon, authenticated;
grant execute on function public.unpublish_hypothesis(uuid)
to authenticated;

revoke execute on function public.list_public_hypotheses()
from public, anon, authenticated;
grant execute on function public.list_public_hypotheses()
to anon, authenticated;

revoke execute on function public.get_public_hypothesis_by_slug(text)
from public, anon, authenticated;
grant execute on function public.get_public_hypothesis_by_slug(text)
to anon, authenticated;

revoke execute on function public.list_public_hypotheses_by_project(uuid)
from public, anon, authenticated;
grant execute on function public.list_public_hypotheses_by_project(uuid)
to anon, authenticated;
