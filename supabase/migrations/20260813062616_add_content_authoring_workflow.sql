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
    raise exception using
      errcode = '42501',
      message = 'Administrator access is required';
  end if;

  if normalized_kind not in ('post', 'idea', 'project') then
    raise exception using
      errcode = '22023',
      message = 'A valid content kind is required';
  end if;

  if normalized_slug = ''
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or char_length(normalized_slug) > 120
  then
    raise exception using
      errcode = '22023',
      message = 'A valid content slug is required';
  end if;

  if btrim(coalesce(p_title, '')) = ''
    or char_length(p_title) > 200
  then
    raise exception using
      errcode = '22023',
      message = 'A valid content title is required';
  end if;

  if char_length(coalesce(p_description, '')) > 500 then
    raise exception using
      errcode = '22023',
      message = 'Content description must be 500 characters or fewer';
  end if;

  if char_length(coalesce(p_body_markdown, '')) > 500000 then
    raise exception using
      errcode = '22023',
      message = 'Content body must be 500000 characters or fewer';
  end if;

  if p_publish and btrim(coalesce(p_body_markdown, '')) = '' then
    raise exception using
      errcode = '22023',
      message = 'Published content requires a body';
  end if;

  if normalized_kind <> 'post' then
    raise exception using
      errcode = '0A000',
      message = 'Content kind is not implemented yet';
  end if;

  select categories.slug
  into resolved_category_slug
  from public.categories
  where categories.id = p_category_id;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'A valid post category is required';
  end if;

  next_path := '/posts/' || resolved_category_slug || '/' || normalized_slug;

  if p_item_id is null then
    insert into public.content_items (
      kind,
      slug,
      path,
      created_by
    )
    values (
      'post',
      normalized_slug,
      next_path,
      (select auth.uid())
    )
    returning * into content_item;

    insert into public.content_versions (
      content_item_id,
      revision_number,
      state,
      title,
      description,
      body_markdown,
      category_id,
      created_by
    )
    values (
      content_item.id,
      1,
      'draft',
      btrim(p_title),
      nullif(btrim(coalesce(p_description, '')), ''),
      coalesce(p_body_markdown, ''),
      p_category_id,
      (select auth.uid())
    )
    returning * into draft_version;
  else
    select *
    into content_item
    from public.content_items
    where id = p_item_id
      and content_items.kind = 'post'
    for update;

    if not found then
      raise exception using
        errcode = 'P0002',
        message = 'Post was not found';
    end if;

    previous_path := content_item.path;

    select *
    into draft_version
    from public.content_versions
    where content_item_id = content_item.id
      and state = 'draft'
    for update;

    if not found then
      raise exception using
        errcode = 'P0002',
        message = 'Post draft was not found';
    end if;

    update public.content_items
    set
      slug = normalized_slug,
      path = next_path
    where id = content_item.id
    returning * into content_item;

    update public.content_versions
    set
      title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      body_markdown = coalesce(p_body_markdown, ''),
      category_id = p_category_id
    where id = draft_version.id
    returning * into draft_version;

    if previous_path <> next_path then
      if exists (
        select 1
        from public.content_redirects
        where source_path = previous_path
          and target_item_id <> content_item.id
      ) then
        raise exception using
          errcode = '23505',
          message = 'Previous content path is already used by another redirect';
      end if;

      insert into public.content_redirects (
        source_path,
        target_item_id,
        status_code,
        is_active,
        created_by
      )
      values (
        previous_path,
        content_item.id,
        308,
        true,
        (select auth.uid())
      )
      on conflict (source_path) do update
      set
        target_item_id = excluded.target_item_id,
        status_code = excluded.status_code,
        is_active = excluded.is_active;
    end if;
  end if;

  if p_publish then
    select *
    into published_version
    from public.publish_content_version(draft_version.id);

    select *
    into draft_version
    from public.content_versions
    where content_item_id = content_item.id
      and state = 'draft';
  end if;

  return query
  select
    content_item.id,
    content_item.kind,
    draft_version.id,
    published_version.id,
    content_item.path;
end;
$$;

revoke execute on function public.save_content_draft(
  uuid,
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  boolean
) from public;

revoke execute on function public.save_content_draft(
  uuid,
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  boolean
) from anon;

grant execute on function public.save_content_draft(
  uuid,
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  boolean
) to authenticated;
