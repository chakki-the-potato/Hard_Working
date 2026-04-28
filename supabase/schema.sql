-- Hard_Working blog comments schema.
-- Apply once via Supabase SQL Editor on a fresh project.
-- Idempotent enough to re-run during early dev (drops are commented out — uncomment if needed).

create extension if not exists pgcrypto;

-- drop policy if exists "anyone reads visible" on public.comments;
-- drop policy if exists "anyone inserts visible" on public.comments;
-- drop table if exists public.comments;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id text not null,
  author_name text not null check (char_length(author_name) between 1 and 30),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  status text not null default 'visible' check (status in ('visible', 'hidden'))
);

create index if not exists comments_post_id_created_at_idx
  on public.comments (post_id, created_at desc);

alter table public.comments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comments' and policyname = 'anyone reads visible'
  ) then
    create policy "anyone reads visible"
      on public.comments for select
      using (status = 'visible');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comments' and policyname = 'anyone inserts visible'
  ) then
    create policy "anyone inserts visible"
      on public.comments for insert
      with check (status = 'visible');
  end if;
end $$;

revoke update, delete on public.comments from anon, authenticated;
