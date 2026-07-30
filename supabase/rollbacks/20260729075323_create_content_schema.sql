revoke execute on function public.publish_content_version(uuid) from authenticated;
drop function if exists public.publish_content_version(uuid);

drop policy if exists content_assets_storage_admin_delete on storage.objects;
drop policy if exists content_assets_storage_admin_update on storage.objects;
drop policy if exists content_assets_storage_admin_insert on storage.objects;
drop policy if exists content_assets_storage_admin_select on storage.objects;

drop policy if exists content_items_public_select on public.content_items;
drop policy if exists content_assets_public_select on public.content_assets;

drop table if exists public.content_version_tags;
drop table if exists public.project_version_details;
drop table if exists public.content_redirects;
drop table if exists public.content_versions;
drop table if exists public.content_assets;
drop table if exists public.tags;
drop table if exists public.categories;
drop table if exists public.content_items;

drop function if exists private.validate_project_version();
drop function if exists private.validate_hero_asset();
drop function if exists private.set_updated_at();
