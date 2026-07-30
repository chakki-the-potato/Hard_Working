create function public.import_content_snapshot(
  p_items jsonb,
  p_redirects jsonb,
  p_dry_run boolean default true
)
returns table (
  created_items integer,
  updated_items integer,
  created_versions integer,
  updated_versions integer,
  assigned_tags integer,
  upserted_redirects integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item_payload jsonb;
  redirect_payload jsonb;
  tag_payload jsonb;
  tag_position integer;
  content_item public.content_items%rowtype;
  published_version public.content_versions%rowtype;
  draft_version public.content_versions%rowtype;
  resolved_category_id uuid;
  resolved_parent_item_id uuid;
  tag_id uuid;
  target_item_id uuid;
  normalized_kind text;
  normalized_slug text;
  canonical_path text;
  parent_path text;
  normalized_title text;
  normalized_description text;
  normalized_summary text;
  normalized_body text;
  normalized_version_label text;
  normalized_demo_url text;
  normalized_repository_url text;
  normalized_role text;
  normalized_period text;
  normalized_outcome text;
  normalized_project_status text;
  original_published_at timestamptz;
  next_revision integer;
  created_items_count integer := 0;
  updated_items_count integer := 0;
  created_versions_count integer := 0;
  updated_versions_count integer := 0;
  assigned_tags_count integer := 0;
  upserted_redirects_count integer := 0;
begin
  if (select auth.uid()) is null
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin'
  then
    raise exception using
      errcode = '42501',
      message = 'Administrator access is required';
  end if;

  if jsonb_typeof(p_items) <> 'array'
    or jsonb_typeof(p_redirects) <> 'array'
  then
    raise exception using
      errcode = '22023',
      message = 'Content items and redirects must be arrays';
  end if;

  if jsonb_array_length(p_items) > 500
    or jsonb_array_length(p_redirects) > 1000
  then
    raise exception using
      errcode = '22023',
      message = 'Content import exceeds the allowed batch size';
  end if;

  begin
    for item_payload in
      select value
      from jsonb_array_elements(p_items)
    loop
      normalized_kind := btrim(coalesce(item_payload ->> 'kind', ''));
      normalized_slug := lower(btrim(coalesce(item_payload ->> 'slug', '')));
      canonical_path := btrim(coalesce(item_payload ->> 'path', ''));
      parent_path := nullif(btrim(coalesce(item_payload ->> 'parentPath', '')), '');
      normalized_title := btrim(coalesce(item_payload ->> 'title', ''));
      normalized_description := nullif(btrim(coalesce(item_payload ->> 'description', '')), '');
      normalized_summary := nullif(btrim(coalesce(item_payload ->> 'summary', '')), '');
      normalized_body := coalesce(item_payload ->> 'bodyMarkdown', '');
      normalized_version_label := nullif(btrim(coalesce(item_payload ->> 'versionLabel', '')), '');
      normalized_demo_url := nullif(btrim(coalesce(item_payload ->> 'demoUrl', '')), '');
      normalized_repository_url := nullif(btrim(coalesce(item_payload ->> 'repositoryUrl', '')), '');
      normalized_role := nullif(btrim(coalesce(item_payload ->> 'role', '')), '');
      normalized_period := nullif(btrim(coalesce(item_payload ->> 'period', '')), '');
      normalized_outcome := nullif(btrim(coalesce(item_payload ->> 'outcome', '')), '');
      normalized_project_status := coalesce(
        nullif(btrim(coalesce(item_payload ->> 'projectStatus', '')), ''),
        'active'
      );
      original_published_at := (item_payload ->> 'publishedAt')::timestamptz;

      if normalized_kind not in ('post', 'idea', 'project') then
        raise exception using
          errcode = '22023',
          message = 'Content kind is invalid',
          detail = canonical_path;
      end if;

      if normalized_slug = ''
        or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        or char_length(normalized_slug) > 120
      then
        raise exception using
          errcode = '22023',
          message = 'Content slug is invalid',
          detail = canonical_path;
      end if;

      if canonical_path = ''
        or canonical_path not like '/%'
        or canonical_path like '%/'
        or canonical_path like '%//%'
        or char_length(canonical_path) > 500
      then
        raise exception using
          errcode = '22023',
          message = 'Content path is invalid',
          detail = canonical_path;
      end if;

      if normalized_title = '' or char_length(normalized_title) > 200 then
        raise exception using
          errcode = '22023',
          message = 'Content title is invalid',
          detail = canonical_path;
      end if;

      if original_published_at is null then
        raise exception using
          errcode = '22023',
          message = 'Published content requires an original publication date',
          detail = canonical_path;
      end if;

      if char_length(coalesce(normalized_description, '')) > 500
        or char_length(coalesce(normalized_summary, '')) > 500
        or char_length(normalized_body) > 500000
      then
        raise exception using
          errcode = '22023',
          message = 'Content text exceeds the allowed length',
          detail = canonical_path;
      end if;

      if normalized_kind = 'project'
        and normalized_project_status not in ('active', 'archived', 'paused')
      then
        raise exception using
          errcode = '22023',
          message = 'Project status is invalid',
          detail = canonical_path;
      end if;

      resolved_category_id := null;
      if nullif(item_payload ->> 'categorySlug', '') is not null then
        select categories.id
        into resolved_category_id
        from public.categories
        where categories.slug = item_payload ->> 'categorySlug';

        if not found then
          raise exception using
            errcode = '22023',
            message = 'Content category is invalid',
            detail = canonical_path;
        end if;
      end if;

      resolved_parent_item_id := null;
      if parent_path is not null then
        select items.id
        into resolved_parent_item_id
        from public.content_items as items
        where items.path = parent_path
          and items.kind = 'project';

        if not found then
          raise exception using
            errcode = '22023',
            message = 'Parent project was not found',
            detail = canonical_path || ' -> ' || parent_path;
        end if;
      end if;

      select *
      into content_item
      from public.content_items as items
      where items.path = canonical_path
      for update;

      if not found then
        insert into public.content_items (
          kind,
          slug,
          path,
          parent_item_id,
          created_by,
          created_at,
          updated_at
        )
        values (
          normalized_kind,
          normalized_slug,
          canonical_path,
          resolved_parent_item_id,
          (select auth.uid()),
          original_published_at,
          original_published_at
        )
        returning * into content_item;

        created_items_count := created_items_count + 1;
      else
        if content_item.kind <> normalized_kind then
          raise exception using
            errcode = '22023',
            message = 'Existing content kind does not match the import',
            detail = canonical_path;
        end if;

        update public.content_items
        set
          slug = normalized_slug,
          parent_item_id = resolved_parent_item_id
        where id = content_item.id
        returning * into content_item;

        updated_items_count := updated_items_count + 1;
      end if;

      select *
      into published_version
      from public.content_versions as versions
      where versions.content_item_id = content_item.id
        and versions.state = 'published'
      for update;

      if not found then
        select coalesce(max(versions.revision_number), 0) + 1
        into next_revision
        from public.content_versions as versions
        where versions.content_item_id = content_item.id;

        insert into public.content_versions (
          content_item_id,
          revision_number,
          state,
          version_label,
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
          published_at,
          created_by,
          created_at,
          updated_at
        )
        values (
          content_item.id,
          next_revision,
          'published',
          normalized_version_label,
          normalized_title,
          normalized_description,
          normalized_summary,
          normalized_body,
          resolved_category_id,
          normalized_demo_url,
          normalized_repository_url,
          normalized_role,
          normalized_period,
          normalized_outcome,
          original_published_at,
          (select auth.uid()),
          original_published_at,
          original_published_at
        )
        returning * into published_version;

        created_versions_count := created_versions_count + 1;
      else
        update public.content_versions
        set
          version_label = normalized_version_label,
          title = normalized_title,
          description = normalized_description,
          summary = normalized_summary,
          body_markdown = normalized_body,
          category_id = resolved_category_id,
          demo_url = normalized_demo_url,
          repository_url = normalized_repository_url,
          role = normalized_role,
          period = normalized_period,
          outcome = normalized_outcome,
          published_at = original_published_at
        where id = published_version.id
        returning * into published_version;

        updated_versions_count := updated_versions_count + 1;
      end if;

      select *
      into draft_version
      from public.content_versions as versions
      where versions.content_item_id = content_item.id
        and versions.state = 'draft'
      for update;

      if not found then
        select coalesce(max(versions.revision_number), 0) + 1
        into next_revision
        from public.content_versions as versions
        where versions.content_item_id = content_item.id;

        insert into public.content_versions (
          content_item_id,
          revision_number,
          state,
          version_label,
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
          created_by,
          created_at,
          updated_at
        )
        values (
          content_item.id,
          next_revision,
          'draft',
          normalized_version_label,
          normalized_title,
          normalized_description,
          normalized_summary,
          normalized_body,
          resolved_category_id,
          normalized_demo_url,
          normalized_repository_url,
          normalized_role,
          normalized_period,
          normalized_outcome,
          (select auth.uid()),
          original_published_at,
          original_published_at
        )
        returning * into draft_version;

        created_versions_count := created_versions_count + 1;
      else
        update public.content_versions
        set
          version_label = normalized_version_label,
          title = normalized_title,
          description = normalized_description,
          summary = normalized_summary,
          body_markdown = normalized_body,
          category_id = resolved_category_id,
          demo_url = normalized_demo_url,
          repository_url = normalized_repository_url,
          role = normalized_role,
          period = normalized_period,
          outcome = normalized_outcome
        where id = draft_version.id
        returning * into draft_version;

        updated_versions_count := updated_versions_count + 1;
      end if;

      if normalized_kind = 'project' then
        insert into public.project_version_details (
          content_version_id,
          status,
          sort_order
        )
        values (
          published_version.id,
          normalized_project_status,
          coalesce((item_payload ->> 'projectSortOrder')::integer, 0)
        )
        on conflict (content_version_id) do update
        set
          status = excluded.status,
          sort_order = excluded.sort_order;

        insert into public.project_version_details (
          content_version_id,
          status,
          sort_order
        )
        values (
          draft_version.id,
          normalized_project_status,
          coalesce((item_payload ->> 'projectSortOrder')::integer, 0)
        )
        on conflict (content_version_id) do update
        set
          status = excluded.status,
          sort_order = excluded.sort_order;
      end if;

      delete from public.content_version_tags
      where content_version_id in (published_version.id, draft_version.id);

      for tag_payload, tag_position in
        select value, ordinality::integer
        from jsonb_array_elements(coalesce(item_payload -> 'tags', '[]'::jsonb))
        with ordinality
      loop
        if btrim(coalesce(tag_payload ->> 'name', '')) = ''
          or lower(btrim(coalesce(tag_payload ->> 'slug', '')))
            !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        then
          raise exception using
            errcode = '22023',
            message = 'Content tag is invalid',
            detail = canonical_path;
        end if;

        insert into public.tags (
          slug,
          name
        )
        values (
          lower(btrim(tag_payload ->> 'slug')),
          btrim(tag_payload ->> 'name')
        )
        on conflict (slug) do update
        set name = excluded.name
        returning id into tag_id;

        insert into public.content_version_tags (
          content_version_id,
          tag_id,
          sort_order
        )
        values
          (published_version.id, tag_id, tag_position - 1),
          (draft_version.id, tag_id, tag_position - 1);

        assigned_tags_count := assigned_tags_count + 2;
      end loop;
    end loop;

    for redirect_payload in
      select value
      from jsonb_array_elements(p_redirects)
    loop
      select items.id
      into target_item_id
      from public.content_items as items
      where items.path = btrim(coalesce(redirect_payload ->> 'targetPath', ''));

      if not found then
        raise exception using
          errcode = '22023',
          message = 'Redirect target was not found',
          detail = coalesce(redirect_payload ->> 'sourcePath', '');
      end if;

      insert into public.content_redirects (
        source_path,
        target_item_id,
        status_code,
        is_active,
        created_by
      )
      values (
        btrim(redirect_payload ->> 'sourcePath'),
        target_item_id,
        308,
        true,
        (select auth.uid())
      )
      on conflict (source_path) do update
      set
        target_item_id = excluded.target_item_id,
        status_code = excluded.status_code,
        is_active = excluded.is_active;

      upserted_redirects_count := upserted_redirects_count + 1;
    end loop;

    if p_dry_run then
      raise exception using
        errcode = 'P0001',
        message = 'content_import_dry_run';
    end if;
  exception
    when raise_exception then
      if sqlerrm <> 'content_import_dry_run' then
        raise;
      end if;
  end;

  return query
  select
    created_items_count,
    updated_items_count,
    created_versions_count,
    updated_versions_count,
    assigned_tags_count,
    upserted_redirects_count;
end;
$$;

revoke execute on function public.import_content_snapshot(
  jsonb,
  jsonb,
  boolean
) from public;

revoke execute on function public.import_content_snapshot(
  jsonb,
  jsonb,
  boolean
) from anon;

grant execute on function public.import_content_snapshot(
  jsonb,
  jsonb,
  boolean
) to authenticated;
