create index content_items_created_by_idx
  on public.content_items (created_by);

create index content_assets_created_by_idx
  on public.content_assets (created_by);

create index content_versions_category_idx
  on public.content_versions (category_id);

create index content_versions_hero_asset_idx
  on public.content_versions (hero_asset_id);

create index content_versions_created_by_idx
  on public.content_versions (created_by);

create index content_redirects_created_by_idx
  on public.content_redirects (created_by);
