begin;

select no_plan();

insert into auth.users (
  id,
  email,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authoring-admin@example.com',
    false,
    false,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authoring-member@example.com',
    false,
    false,
    now(),
    now()
  );

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '10000000-0000-4000-8000-000000000002',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'member')
  )::text,
  true
);
set local role authenticated;

select throws_ok(
  $$
    select *
    from public.save_content_draft(
      null,
      'post',
      'blocked',
      (select id from public.categories where slug = 'thinking'),
      null,
      'Blocked',
      null,
      null,
      '',
      null,
      null,
      null,
      null,
      null,
      null,
      0,
      false
    )
  $$,
  '42501',
  'Administrator access is required',
  'member cannot save content'
);

reset role;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '10000000-0000-4000-8000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'note', 'invalid-kind',
      (select id from public.categories where slug = 'thinking'), null,
      'Invalid kind', null, null, '',
      null, null, null, null, null, null, 0, false
    )
  $$,
  '22023',
  'A valid content kind is required',
  'unsupported kind is rejected'
);

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'post', 'Invalid Slug',
      (select id from public.categories where slug = 'thinking'), null,
      'Invalid slug', null, null, '',
      null, null, null, null, null, null, 0, false
    )
  $$,
  '22023',
  'A valid content slug is required',
  'invalid slug is rejected'
);

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'post', 'blank-title',
      (select id from public.categories where slug = 'thinking'), null,
      ' ', null, null, '',
      null, null, null, null, null, null, 0, false
    )
  $$,
  '22023',
  'A valid content title is required',
  'blank title is rejected'
);

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'post', 'long-description',
      (select id from public.categories where slug = 'thinking'), null,
      'Long description', repeat('d', 501), null, '',
      null, null, null, null, null, null, 0, false
    )
  $$,
  '22023',
  'Content description must be 500 characters or fewer',
  '501-character description is rejected'
);

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'post', 'long-body',
      (select id from public.categories where slug = 'thinking'), null,
      'Long body', null, null, repeat('b', 500001),
      null, null, null, null, null, null, 0, false
    )
  $$,
  '22023',
  'Content body must be 500000 characters or fewer',
  '500001-character body is rejected'
);

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'post', 'missing-category',
      '10000000-0000-4000-8000-000000000099', null,
      'Missing category', null, null, '',
      null, null, null, null, null, null, 0, false
    )
  $$,
  '22023',
  'A valid post category is required',
  'missing post category is rejected'
);

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'post', 'empty-published-body',
      (select id from public.categories where slug = 'thinking'), null,
      'Empty published body', null, null, '',
      null, null, null, null, null, null, 0, true
    )
  $$,
  '22023',
  'Published content requires a body',
  'published post requires a body'
);

create temporary table saved_post as
select * from public.save_content_draft(
  null,
  'post',
  'authoring-post',
  (select id from public.categories where slug = 'thinking'),
  null,
  'Authoring post',
  'Description',
  null,
  'Body',
  null,
  null,
  null,
  null,
  null,
  null,
  0,
  false
);

select is((select kind from saved_post), 'post', 'post draft returns its kind');
select is(
  (select canonical_path from saved_post),
  '/posts/thinking/authoring-post',
  'post path is server-derived'
);
select is(
  (select state from public.content_versions where id = (select draft_version_id from saved_post)),
  'draft',
  'post creates a draft'
);

create temporary table updated_post as
select * from public.save_content_draft(
  (select item_id from saved_post),
  'post',
  'renamed-authoring-post',
  (select id from public.categories where slug = 'design'),
  null,
  'Updated authoring post',
  'Updated description',
  null,
  'Updated body',
  null,
  null,
  null,
  null,
  null,
  null,
  0,
  false
);

select is(
  (select title from public.content_versions where id = (select draft_version_id from updated_post)),
  'Updated authoring post',
  'post draft is updated in place'
);
select results_eq(
  $$
    select source_path, status_code
    from public.content_redirects
    where target_item_id = (select item_id from updated_post)
  $$,
  $$ values ('/posts/thinking/authoring-post'::text, 308) $$,
  'old post path receives a 308 redirect'
);

create temporary table published_post as
select * from public.save_content_draft(
  (select item_id from updated_post),
  'post',
  'renamed-authoring-post',
  (select id from public.categories where slug = 'design'),
  null,
  'Published authoring post',
  'Published description',
  null,
  'Published body',
  null,
  null,
  null,
  null,
  null,
  null,
  0,
  true
);

select ok(
  (select published_version_id is not null from published_post),
  'publishing returns the published version'
);
select is(
  (select state from public.content_versions where id = (select published_version_id from published_post)),
  'published',
  'post draft becomes published'
);
select is(
  (select state from public.content_versions where id = (select draft_version_id from published_post)),
  'draft',
  'publishing creates the next draft'
);

insert into public.content_items (kind, slug, path)
values ('idea', 'occupied-path', '/posts/works/occupied-path');

select throws_ok(
  format(
    $sql$
      select * from public.save_content_draft(
        %L, 'post', 'occupied-path',
        (select id from public.categories where slug = 'works'), null,
        'Conflict', null, null, 'Body',
        null, null, null, null, null, null, 0, false
      )
    $sql$,
    (select item_id from published_post)
  ),
  '23505',
  null,
  'duplicate content path is rejected'
);
select is(
  (select path from public.content_items where id = (select item_id from published_post)),
  '/posts/design/renamed-authoring-post',
  'duplicate path failure rolls back the item path'
);

reset role;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
set local role anon;

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'post', 'anon-blocked', null, null,
      'Anon blocked', null, null, '',
      null, null, null, null, null, null, 0, false
    )
  $$,
  '42501',
  null,
  'anon cannot execute content mutation'
);

select * from finish();
rollback;
