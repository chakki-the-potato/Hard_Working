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
  parent_item public.content_items%rowtype;
  draft_version public.content_versions%rowtype;
  published_version public.content_versions%rowtype;
  normalized_kind text := lower(btrim(coalesce(p_kind, '')));
  normalized_slug text := lower(btrim(coalesce(p_slug, '')));
  normalized_project_status text := lower(btrim(coalesce(p_project_status, 'active')));
  resolved_category_id uuid;
  resolved_category_slug text;
  resolved_project_sort_order integer := coalesce(p_project_sort_order, 0);
  next_path text;
  previous_path text;
  descendant_ids uuid[];
  descendant_paths text[];
  descendant_index integer;
  descendant_next_path text;
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

  if normalized_kind = 'project' then
    if nullif(btrim(coalesce(p_demo_url, '')), '') is not null
      and btrim(p_demo_url) !~ '^https://[^[:space:]]+$'
    then
      raise exception using
        errcode = '22023',
        message = 'Project URLs must use HTTPS';
    end if;

    if nullif(btrim(coalesce(p_repository_url, '')), '') is not null
      and btrim(p_repository_url) !~ '^https://[^[:space:]]+$'
    then
      raise exception using
        errcode = '22023',
        message = 'Project URLs must use HTTPS';
    end if;

    if normalized_project_status not in ('active', 'paused', 'archived') then
      raise exception using
        errcode = '22023',
        message = 'A valid project status is required';
    end if;

    if resolved_project_sort_order < 0 then
      raise exception using
        errcode = '22023',
        message = 'Project sort order cannot be negative';
    end if;

    if p_publish and btrim(coalesce(p_summary, '')) = '' then
      raise exception using
        errcode = '22023',
        message = 'Published projects require a summary';
    end if;
  end if;

  if p_item_id is not null then
    select *
    into content_item
    from public.content_items as items
    where items.id = p_item_id
    for update;

    if not found or content_item.kind <> normalized_kind then
      raise exception using
        errcode = 'P0002',
        message = 'Content item was not found';
    end if;
  end if;

  if normalized_kind = 'post' then
    select categories.id, categories.slug
    into resolved_category_id, resolved_category_slug
    from public.categories
    where categories.id = p_category_id;

    if not found then
      raise exception using
        errcode = '22023',
        message = 'A valid post category is required';
    end if;

    next_path := '/posts/' || resolved_category_slug || '/' || normalized_slug;
  elsif normalized_kind = 'project' then
    if p_category_id is not null then
      select categories.id
      into resolved_category_id
      from public.categories
      where categories.id = p_category_id;

      if not found then
        raise exception using
          errcode = '22023',
          message = 'A valid project category is required';
      end if;
    end if;

    next_path := '/projects/' || normalized_slug;
  elsif p_parent_item_id is null then
    select categories.id, categories.slug
    into resolved_category_id, resolved_category_slug
    from public.categories
    where categories.id = p_category_id;

    if not found then
      raise exception using
        errcode = '22023',
        message = 'A valid idea category is required';
    end if;

    next_path := '/ideas/' || resolved_category_slug || '/' || normalized_slug;
  else
    if p_item_id = p_parent_item_id then
      raise exception using
        errcode = '22023',
        message = 'Idea cannot be its own parent';
    end if;

    select *
    into parent_item
    from public.content_items as items
    where items.id = p_parent_item_id
      and items.kind = 'idea';

    if not found then
      raise exception using
        errcode = '22023',
        message = 'Idea parent must be an idea';
    end if;

    if p_item_id is not null and exists (
      with recursive idea_descendants as (
        select items.id
        from public.content_items as items
        where items.parent_item_id = p_item_id
          and items.kind = 'idea'
        union all
        select child.id
        from public.content_items as child
        join idea_descendants as descendants
          on child.parent_item_id = descendants.id
        where child.kind = 'idea'
      )
      select 1
      from idea_descendants
      where idea_descendants.id = p_parent_item_id
    ) then
      raise exception using
        errcode = '22023',
        message = 'Idea parent cannot be a descendant';
    end if;

    select versions.category_id
    into resolved_category_id
    from public.content_versions as versions
    where versions.content_item_id = parent_item.id
      and versions.state = 'draft';

    if resolved_category_id is null then
      raise exception using
        errcode = '22023',
        message = 'Idea parent must have a category';
    end if;

    next_path := parent_item.path || '/' || normalized_slug;
  end if;

  if p_item_id is null then
    insert into public.content_items (
      kind,
      slug,
      path,
      parent_item_id,
      created_by
    )
    values (
      normalized_kind,
      normalized_slug,
      next_path,
      case when normalized_kind = 'idea' then p_parent_item_id end,
      (select auth.uid())
    )
    returning * into content_item;

    insert into public.content_versions (
      content_item_id,
      revision_number,
      state,
      title,
      description,
      summary,
      body_markdown,
      category_id,
      demo_url,
      repository_url,
      role,
      period,
      outcome,
      created_by
    )
    values (
      content_item.id,
      1,
      'draft',
      btrim(p_title),
      nullif(btrim(coalesce(p_description, '')), ''),
      nullif(btrim(coalesce(p_summary, '')), ''),
      coalesce(p_body_markdown, ''),
      resolved_category_id,
      nullif(btrim(coalesce(p_demo_url, '')), ''),
      nullif(btrim(coalesce(p_repository_url, '')), ''),
      nullif(btrim(coalesce(p_role, '')), ''),
      nullif(btrim(coalesce(p_period, '')), ''),
      nullif(btrim(coalesce(p_outcome, '')), ''),
      (select auth.uid())
    )
    returning * into draft_version;
  else
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
        message = 'Content draft was not found';
    end if;

    if normalized_kind = 'idea' then
      select
        array_agg(tree.id order by tree.path),
        array_agg(tree.path order by tree.path)
      into descendant_ids, descendant_paths
      from (
        with recursive idea_tree as (
          select id, parent_item_id, path
          from public.content_items
          where id = content_item.id
          union all
          select child.id, child.parent_item_id, child.path
          from public.content_items as child
          join idea_tree as tree on child.parent_item_id = tree.id
          where child.kind = 'idea'
        )
        select id, path
        from idea_tree
      ) as tree;

      perform 1
      from public.content_items
      where id = any(descendant_ids)
      order by path
      for update;

      for descendant_index in 1..array_length(descendant_ids, 1) loop
        descendant_next_path := next_path || substr(
          descendant_paths[descendant_index],
          char_length(previous_path) + 1
        );

        if exists (
          select 1
          from public.content_items
          where path = descendant_next_path
            and id <> all(descendant_ids)
        ) or exists (
          select 1
          from public.content_redirects
          where source_path = descendant_next_path
            and target_item_id <> descendant_ids[descendant_index]
        ) then
          raise exception using
            errcode = '23505',
            message = 'Idea destination path is already in use';
        end if;

        if descendant_paths[descendant_index] <> descendant_next_path
          and exists (
            select 1
            from public.content_redirects
            where source_path = descendant_paths[descendant_index]
              and target_item_id <> descendant_ids[descendant_index]
          )
        then
          raise exception using
            errcode = '23505',
            message = 'Previous content path is already used by another redirect';
        end if;
      end loop;

      for descendant_index in 1..array_length(descendant_ids, 1) loop
        descendant_next_path := next_path || substr(
          descendant_paths[descendant_index],
          char_length(previous_path) + 1
        );

        if descendant_paths[descendant_index] <> descendant_next_path then
          insert into public.content_redirects (
            source_path,
            target_item_id,
            status_code,
            is_active,
            created_by
          )
          values (
            descendant_paths[descendant_index],
            descendant_ids[descendant_index],
            308,
            true,
            (select auth.uid())
          )
          on conflict (source_path) do update
          set
            target_item_id = excluded.target_item_id,
            status_code = excluded.status_code,
            is_active = excluded.is_active;

          update public.content_items
          set path = descendant_next_path
          where id = descendant_ids[descendant_index];
        end if;
      end loop;

      update public.content_items
      set
        slug = normalized_slug,
        parent_item_id = p_parent_item_id
      where id = content_item.id
      returning * into content_item;

      update public.content_versions
      set category_id = resolved_category_id
      where content_item_id = any(descendant_ids)
        and state in ('draft', 'published');
    else
      if exists (
        select 1
        from public.content_items
        where path = next_path
          and id <> content_item.id
      ) then
        raise exception using
          errcode = '23505',
          message = 'Content destination path is already in use';
      end if;

      update public.content_items
      set
        slug = normalized_slug,
        path = next_path
      where id = content_item.id
      returning * into content_item;

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

    update public.content_versions
    set
      title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      summary = nullif(btrim(coalesce(p_summary, '')), ''),
      body_markdown = coalesce(p_body_markdown, ''),
      category_id = resolved_category_id,
      demo_url = nullif(btrim(coalesce(p_demo_url, '')), ''),
      repository_url = nullif(btrim(coalesce(p_repository_url, '')), ''),
      role = nullif(btrim(coalesce(p_role, '')), ''),
      period = nullif(btrim(coalesce(p_period, '')), ''),
      outcome = nullif(btrim(coalesce(p_outcome, '')), '')
    where id = draft_version.id
    returning * into draft_version;
  end if;

  if normalized_kind = 'project' then
    insert into public.project_version_details (
      content_version_id,
      status,
      sort_order
    )
    values (
      draft_version.id,
      normalized_project_status,
      resolved_project_sort_order
    )
    on conflict (content_version_id) do update
    set
      status = excluded.status,
      sort_order = excluded.sort_order;
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
