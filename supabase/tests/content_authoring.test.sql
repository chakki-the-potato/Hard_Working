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

select throws_ok(
  format(
    $sql$
      select * from public.save_content_draft(
        null, 'idea', 'invalid-parent', null, %L,
        'Invalid parent', null, null, 'Body',
        null, null, null, null, null, null, 0, false
      )
    $sql$,
    (select item_id from published_post)
  ),
  '22023',
  'Idea parent must be an idea',
  'idea parent kind is enforced'
);

create temporary table saved_parent as
select * from public.save_content_draft(
  null, 'idea', 'parent-idea',
  (select id from public.categories where slug = 'works'), null,
  'Parent idea', null, null, 'Parent body',
  null, null, null, null, null, null, 0, true
);

select is(
  (select canonical_path from saved_parent),
  '/ideas/works/parent-idea',
  'top-level idea uses its category path'
);

create temporary table saved_child as
select * from public.save_content_draft(
  null, 'idea', 'child-idea', null,
  (select item_id from saved_parent),
  'Child idea', null, null, 'Child body',
  null, null, null, null, null, null, 0, true
);

create temporary table saved_grandchild as
select * from public.save_content_draft(
  null, 'idea', 'grandchild-idea', null,
  (select item_id from saved_child),
  'Grandchild idea', null, null, 'Grandchild body',
  null, null, null, null, null, null, 0, true
);

select is(
  (select canonical_path from saved_child),
  '/ideas/works/parent-idea/child-idea',
  'child idea inherits the parent path'
);
select is(
  (
    select categories.slug
    from public.content_versions
    join public.categories on categories.id = content_versions.category_id
    where content_versions.id = (select published_version_id from saved_child)
  ),
  'works',
  'child idea inherits the parent category'
);

select throws_ok(
  format(
    $sql$
      select * from public.save_content_draft(
        %L, 'idea', 'parent-idea',
        (select id from public.categories where slug = 'works'), %L,
        'Parent idea', null, null, 'Parent body',
        null, null, null, null, null, null, 0, false
      )
    $sql$,
    (select item_id from saved_parent),
    (select item_id from saved_parent)
  ),
  '22023',
  'Idea cannot be its own parent',
  'idea cannot parent itself'
);

select throws_ok(
  format(
    $sql$
      select * from public.save_content_draft(
        %L, 'idea', 'parent-idea', null, %L,
        'Parent idea', null, null, 'Parent body',
        null, null, null, null, null, null, 0, false
      )
    $sql$,
    (select item_id from saved_parent),
    (select item_id from saved_grandchild)
  ),
  '22023',
  'Idea parent cannot be a descendant',
  'idea descendant cycle is rejected'
);

create temporary table republished_child as
select * from public.save_content_draft(
  (select item_id from saved_child), 'idea', 'child-idea', null,
  (select item_id from saved_parent),
  'Child idea revision two', null, null, 'Child body revision two',
  null, null, null, null, null, null, 0, true
);

create temporary table renamed_parent as
select * from public.save_content_draft(
  (select item_id from saved_parent), 'idea', 'renamed-parent',
  (select id from public.categories where slug = 'design'), null,
  'Renamed parent', null, null, 'Renamed parent body',
  null, null, null, null, null, null, 0, false
);

select is(
  (select canonical_path from renamed_parent),
  '/ideas/design/renamed-parent',
  'parent rename changes its canonical path'
);
select is(
  (select path from public.content_items where id = (select item_id from saved_child)),
  '/ideas/design/renamed-parent/child-idea',
  'parent rename cascades to a child path'
);
select is(
  (select path from public.content_items where id = (select item_id from saved_grandchild)),
  '/ideas/design/renamed-parent/child-idea/grandchild-idea',
  'parent rename cascades through multiple levels'
);
select is(
  (
    select count(*)::integer
    from public.content_versions
    join public.categories on categories.id = content_versions.category_id
    where content_versions.content_item_id in (
      (select item_id from saved_child),
      (select item_id from saved_grandchild)
    )
      and content_versions.state in ('draft', 'published')
      and categories.slug = 'design'
  ),
  4,
  'descendant draft and published versions inherit the new category'
);
select is(
  (
    select categories.slug
    from public.content_versions
    join public.categories on categories.id = content_versions.category_id
    where content_versions.content_item_id = (select item_id from saved_child)
      and content_versions.state = 'archived'
  ),
  'works',
  'archived descendant versions preserve their category'
);
select is(
  (
    select count(*)::integer
    from public.content_redirects
    where source_path in (
      '/ideas/works/parent-idea',
      '/ideas/works/parent-idea/child-idea',
      '/ideas/works/parent-idea/child-idea/grandchild-idea'
    )
  ),
  3,
  'idea cascade creates one redirect per changed path'
);

insert into public.content_items (kind, slug, path)
values (
  'idea',
  'occupied-descendant',
  '/ideas/thinking/conflicting-parent/child-idea'
);

select throws_ok(
  format(
    $sql$
      select * from public.save_content_draft(
        %L, 'idea', 'conflicting-parent',
        (select id from public.categories where slug = 'thinking'), null,
        'Conflicting parent', null, null, 'Body',
        null, null, null, null, null, null, 0, false
      )
    $sql$,
    (select item_id from saved_parent)
  ),
  '23505',
  'Idea destination path is already in use',
  'idea cascade rejects a conflicting descendant destination'
);
select is(
  (select path from public.content_items where id = (select item_id from saved_parent)),
  '/ideas/design/renamed-parent',
  'idea cascade conflict rolls back every path change'
);

select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'project', 'insecure-project', null, null,
      'Insecure project', null, 'Summary', 'Body',
      'http://example.com', null, null, null, null, 'active', 0, false
    )
  $$,
  '22023',
  'Project URLs must use HTTPS',
  'project rejects HTTP URLs'
);
select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'project', 'invalid-status', null, null,
      'Invalid status', null, 'Summary', 'Body',
      null, null, null, null, null, 'finished', 0, false
    )
  $$,
  '22023',
  'A valid project status is required',
  'project rejects an invalid status'
);
select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'project', 'invalid-order', null, null,
      'Invalid order', null, 'Summary', 'Body',
      null, null, null, null, null, 'active', -1, false
    )
  $$,
  '22023',
  'Project sort order cannot be negative',
  'project rejects a negative sort order'
);
select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'project', 'missing-summary', null, null,
      'Missing summary', null, null, 'Body',
      null, null, null, null, null, 'active', 0, true
    )
  $$,
  '22023',
  'Published projects require a summary',
  'published project requires a summary'
);
select throws_ok(
  $$
    select * from public.save_content_draft(
      null, 'project', 'missing-body', null, null,
      'Missing body', null, 'Summary', '',
      null, null, null, null, null, 'active', 0, true
    )
  $$,
  '22023',
  'Published content requires a body',
  'published project requires a body'
);

create temporary table saved_project as
select * from public.save_content_draft(
  null, 'project', 'authoring-project',
  (select id from public.categories where slug = 'works'), null,
  'Authoring project', 'Project description', 'Project summary', 'Project body',
  'https://example.com/demo', 'https://github.com/example/repo',
  'Builder', '2026', 'Shipped', 'paused', 7, true
);

select is(
  (select canonical_path from saved_project),
  '/projects/authoring-project',
  'project uses its canonical path'
);
select is(
  (
    select row(
      title, description, summary, body_markdown, demo_url,
      repository_url, role, period, outcome
    )::text
    from public.content_versions
    where id = (select published_version_id from saved_project)
  ),
  row(
    'Authoring project', 'Project description', 'Project summary', 'Project body',
    'https://example.com/demo', 'https://github.com/example/repo',
    'Builder', '2026', 'Shipped'
  )::text,
  'project stores every content version field'
);
select is(
  (
    select row(status, sort_order)::text
    from public.project_version_details
    where content_version_id = (select published_version_id from saved_project)
  ),
  row('paused', 7)::text,
  'project stores its published detail row'
);
select is(
  (
    select row(status, sort_order)::text
    from public.project_version_details
    where content_version_id = (select draft_version_id from saved_project)
  ),
  row('paused', 7)::text,
  'publishing clones project details to the next draft'
);

create temporary table updated_project as
select * from public.save_content_draft(
  (select item_id from saved_project), 'project', 'renamed-project', null, null,
  'Renamed project', null, 'Updated summary', 'Updated body',
  null, null, null, null, null, 'active', 2, false
);

select is(
  (select canonical_path from updated_project),
  '/projects/renamed-project',
  'project update changes the canonical path'
);
select is(
  (
    select target_item_id
    from public.content_redirects
    where source_path = '/projects/authoring-project'
  ),
  (select item_id from saved_project),
  'project update creates a redirect'
);
select is(
  (
    select row(summary, body_markdown)::text
    from public.content_versions
    where id = (select draft_version_id from updated_project)
  ),
  row('Updated summary', 'Updated body')::text,
  'project update changes its draft fields'
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
