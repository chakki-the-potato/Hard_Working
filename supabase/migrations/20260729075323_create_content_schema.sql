create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  slug text not null,
  path text not null,
  parent_item_id uuid references public.content_items(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_kind_check check (kind in ('post', 'idea', 'project')),
  constraint content_items_slug_check check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint content_items_path_check check (
    path like '/%'
    and path not like '%/'
    and path not like '%//%'
  ),
  constraint content_items_path_key unique (path)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_check check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint categories_name_check check (btrim(name) <> ''),
  constraint categories_slug_key unique (slug)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_slug_check check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint tags_name_check check (btrim(name) <> ''),
  constraint tags_slug_key unique (slug)
);

create unique index tags_name_lower_key on public.tags (lower(name));

create table public.content_assets (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  bucket_id text not null default 'content-assets',
  storage_path text not null,
  alt_text text,
  mime_type text,
  byte_size bigint,
  width integer,
  height integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint content_assets_bucket_check check (btrim(bucket_id) <> ''),
  constraint content_assets_storage_path_check check (
    btrim(storage_path) <> ''
    and storage_path not like '/%'
    and storage_path not like '%//%'
  ),
  constraint content_assets_byte_size_check check (byte_size is null or byte_size >= 0),
  constraint content_assets_width_check check (width is null or width > 0),
  constraint content_assets_height_check check (height is null or height > 0),
  constraint content_assets_bucket_path_key unique (bucket_id, storage_path)
);

create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  revision_number integer not null,
  state text not null default 'draft',
  version_label text,
  title text not null,
  description text,
  summary text,
  body_markdown text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  hero_asset_id uuid references public.content_assets(id) on delete set null,
  seo_title text,
  seo_description text,
  demo_url text,
  repository_url text,
  role text,
  period text,
  outcome text,
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_versions_revision_number_check check (revision_number > 0),
  constraint content_versions_state_check check (state in ('draft', 'published', 'archived')),
  constraint content_versions_title_check check (btrim(title) <> ''),
  constraint content_versions_timeline_check check (
    (
      state = 'draft'
      and published_at is null
      and archived_at is null
    )
    or (
      state = 'published'
      and published_at is not null
      and archived_at is null
    )
    or (
      state = 'archived'
      and published_at is not null
      and archived_at is not null
    )
  ),
  constraint content_versions_item_revision_key unique (content_item_id, revision_number)
);

create unique index content_versions_one_draft_per_item
  on public.content_versions (content_item_id)
  where state = 'draft';

create unique index content_versions_one_published_per_item
  on public.content_versions (content_item_id)
  where state = 'published';

create index content_versions_public_listing_idx
  on public.content_versions (state, published_at desc);

create table public.project_version_details (
  content_version_id uuid primary key references public.content_versions(id) on delete cascade,
  status text not null default 'active',
  sort_order integer not null default 0,
  constraint project_version_details_status_check check (
    status in ('active', 'archived', 'paused')
  )
);

create table public.content_version_tags (
  content_version_id uuid not null references public.content_versions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (content_version_id, tag_id)
);

create index content_version_tags_tag_idx
  on public.content_version_tags (tag_id, content_version_id);

create table public.content_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null,
  target_item_id uuid not null references public.content_items(id) on delete cascade,
  status_code integer not null default 308,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_redirects_source_path_check check (
    source_path like '/%'
    and source_path not like '%/'
    and source_path not like '%//%'
  ),
  constraint content_redirects_status_code_check check (status_code in (301, 308)),
  constraint content_redirects_source_path_key unique (source_path)
);

create index content_items_parent_idx on public.content_items (parent_item_id);
create index content_assets_item_idx on public.content_assets (content_item_id);
create index content_redirects_target_idx on public.content_redirects (target_item_id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

create function private.validate_hero_asset()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.hero_asset_id is not null and not exists (
    select 1
    from public.content_assets
    where id = new.hero_asset_id
      and content_item_id = new.content_item_id
  ) then
    raise exception 'Hero asset % does not belong to content item %', new.hero_asset_id, new.content_item_id;
  end if;

  return new;
end;
$$;

create function private.validate_project_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.content_versions as versions
    join public.content_items as items
      on items.id = versions.content_item_id
    where versions.id = new.content_version_id
      and items.kind = 'project'
  ) then
    raise exception 'Content version % does not belong to a project', new.content_version_id;
  end if;

  return new;
end;
$$;

create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function private.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function private.set_updated_at();

create trigger tags_set_updated_at
before update on public.tags
for each row execute function private.set_updated_at();

create trigger content_versions_set_updated_at
before update on public.content_versions
for each row execute function private.set_updated_at();

create trigger content_redirects_set_updated_at
before update on public.content_redirects
for each row execute function private.set_updated_at();

create trigger content_versions_validate_hero_asset
before insert or update of hero_asset_id, content_item_id on public.content_versions
for each row execute function private.validate_hero_asset();

create trigger project_version_details_validate_version
before insert or update of content_version_id on public.project_version_details
for each row execute function private.validate_project_version();

alter table public.content_items enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.content_assets enable row level security;
alter table public.content_versions enable row level security;
alter table public.project_version_details enable row level security;
alter table public.content_version_tags enable row level security;
alter table public.content_redirects enable row level security;

grant select on public.content_items to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.tags to anon, authenticated;
grant select on public.content_assets to anon, authenticated;
grant select on public.content_versions to anon, authenticated;
grant select on public.project_version_details to anon, authenticated;
grant select on public.content_version_tags to anon, authenticated;
grant select on public.content_redirects to anon, authenticated;

grant insert, update, delete on public.content_items to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.tags to authenticated;
grant insert, update, delete on public.content_assets to authenticated;
grant insert, update, delete on public.content_versions to authenticated;
grant insert, update, delete on public.project_version_details to authenticated;
grant insert, update, delete on public.content_version_tags to authenticated;
grant insert, update, delete on public.content_redirects to authenticated;

create policy content_items_public_select
on public.content_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_versions
    where content_versions.content_item_id = content_items.id
      and content_versions.state in ('published', 'archived')
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_items_admin_insert
on public.content_items
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_items_admin_update
on public.content_items
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_items_admin_delete
on public.content_items
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy categories_public_select
on public.categories
for select
to anon, authenticated
using (true);

create policy categories_admin_insert
on public.categories
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy categories_admin_update
on public.categories
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy categories_admin_delete
on public.categories
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy tags_public_select
on public.tags
for select
to anon, authenticated
using (true);

create policy tags_admin_insert
on public.tags
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy tags_admin_update
on public.tags
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy tags_admin_delete
on public.tags
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_versions_public_select
on public.content_versions
for select
to anon, authenticated
using (
  state in ('published', 'archived')
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_versions_admin_insert
on public.content_versions
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_versions_admin_update
on public.content_versions
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_versions_admin_delete
on public.content_versions
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_assets_public_select
on public.content_assets
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_versions
    where content_versions.content_item_id = content_assets.content_item_id
      and content_versions.state in ('published', 'archived')
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_assets_admin_insert
on public.content_assets
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_assets_admin_update
on public.content_assets
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_assets_admin_delete
on public.content_assets
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy project_version_details_public_select
on public.project_version_details
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_versions
    where content_versions.id = project_version_details.content_version_id
      and content_versions.state in ('published', 'archived')
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy project_version_details_admin_insert
on public.project_version_details
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy project_version_details_admin_update
on public.project_version_details
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy project_version_details_admin_delete
on public.project_version_details
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_version_tags_public_select
on public.content_version_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_versions
    where content_versions.id = content_version_tags.content_version_id
      and content_versions.state in ('published', 'archived')
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_version_tags_admin_insert
on public.content_version_tags
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_version_tags_admin_update
on public.content_version_tags
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_version_tags_admin_delete
on public.content_version_tags
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_redirects_public_select
on public.content_redirects
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.content_versions
    where content_versions.content_item_id = content_redirects.target_item_id
      and content_versions.state in ('published', 'archived')
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_redirects_admin_insert
on public.content_redirects
for insert
to authenticated
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_redirects_admin_update
on public.content_redirects
for update
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_redirects_admin_delete
on public.content_redirects
for delete
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_assets_storage_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'content-assets'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_assets_storage_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'content-assets'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_assets_storage_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'content-assets'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  bucket_id = 'content-assets'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy content_assets_storage_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'content-assets'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create function public.publish_content_version(p_version_id uuid)
returns public.content_versions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  draft_version public.content_versions%rowtype;
  published_version public.content_versions%rowtype;
  new_draft_id uuid;
  next_revision_number integer;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access is required';
  end if;

  select *
  into draft_version
  from public.content_versions
  where id = p_version_id
    and state = 'draft';

  if not found then
    raise exception 'Draft content version % was not found', p_version_id;
  end if;

  perform 1
  from public.content_items
  where id = draft_version.content_item_id
  for update;

  select *
  into draft_version
  from public.content_versions
  where id = p_version_id
    and state = 'draft'
  for update;

  if not found then
    raise exception 'Draft content version % is no longer available', p_version_id;
  end if;

  update public.content_versions
  set
    state = 'archived',
    archived_at = clock_timestamp()
  where content_item_id = draft_version.content_item_id
    and state = 'published';

  update public.content_versions
  set
    state = 'published',
    published_at = clock_timestamp(),
    archived_at = null
  where id = draft_version.id
  returning * into published_version;

  select coalesce(max(revision_number), 0) + 1
  into next_revision_number
  from public.content_versions
  where content_item_id = draft_version.content_item_id;

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
    hero_asset_id,
    seo_title,
    seo_description,
    demo_url,
    repository_url,
    role,
    period,
    outcome,
    created_by
  )
  values (
    published_version.content_item_id,
    next_revision_number,
    'draft',
    null,
    published_version.title,
    published_version.description,
    published_version.summary,
    published_version.body_markdown,
    published_version.category_id,
    published_version.hero_asset_id,
    published_version.seo_title,
    published_version.seo_description,
    published_version.demo_url,
    published_version.repository_url,
    published_version.role,
    published_version.period,
    published_version.outcome,
    (select auth.uid())
  )
  returning id into new_draft_id;

  insert into public.content_version_tags (
    content_version_id,
    tag_id,
    sort_order
  )
  select
    new_draft_id,
    tag_id,
    sort_order
  from public.content_version_tags
  where content_version_id = published_version.id;

  insert into public.project_version_details (
    content_version_id,
    status,
    sort_order
  )
  select
    new_draft_id,
    status,
    sort_order
  from public.project_version_details
  where content_version_id = published_version.id;

  return published_version;
end;
$$;

revoke execute on function public.publish_content_version(uuid) from public;
revoke execute on function public.publish_content_version(uuid) from anon;
grant execute on function public.publish_content_version(uuid) to authenticated;
