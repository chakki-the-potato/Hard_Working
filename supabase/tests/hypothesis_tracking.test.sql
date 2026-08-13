begin;

select plan(62);

select has_table('public', 'hypotheses', 'hypotheses exists');
select has_table('public', 'hypothesis_tags', 'hypothesis_tags exists');
select has_table('public', 'hypothesis_activities', 'hypothesis_activities exists');
select has_table('public', 'hypothesis_evidence', 'hypothesis_evidence exists');
select has_table('public', 'hypothesis_decisions', 'hypothesis_decisions exists');

select col_default_is(
  'public',
  'hypotheses',
  'visibility',
  'private',
  'visibility defaults private'
);
select col_is_fk('public', 'hypotheses', 'project_item_id', 'project uses FK');
select col_is_fk('public', 'hypotheses', 'category_id', 'category uses FK');
select col_is_fk(
  'public',
  'hypothesis_activities',
  'related_content_item_id',
  'related content uses FK'
);
select col_is_fk(
  'public',
  'hypothesis_evidence',
  'activity_id',
  'evidence uses activity FK'
);

select has_index('public', 'hypotheses', 'hypotheses_slug_key', 'slug is unique');
select has_index(
  'public',
  'hypothesis_decisions',
  'hypothesis_decisions_one_current_idx',
  'one current decision index exists'
);
select results_eq(
  $$
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = to_regclass('public.hypotheses')
  $$,
  array[true],
  'hypotheses RLS enabled'
);
select results_eq(
  $$
    select has_function_privilege(
      'anon',
      to_regprocedure('private.require_hypothesis_admin()'),
      'EXECUTE'
    )
  $$,
  array[false],
  'private admin helper is not executable by anon'
);

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
    '00000000-0000-0000-0000-000000000001',
    'admin@example.com',
    false,
    false,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'member@example.com',
    false,
    false,
    now(),
    now()
  );

insert into public.categories (id, slug, name)
values (
  '00000000-0000-0000-0000-000000000010',
  'experiments',
  'Experiments'
);

insert into public.tags (id, slug, name)
values (
  '00000000-0000-0000-0000-000000000011',
  'validation',
  'Validation'
);

insert into public.content_items (id, kind, slug, path)
values
  (
    '00000000-0000-0000-0000-000000000020',
    'project',
    'private-project',
    '/projects/private-project'
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    'post',
    'private-post',
    '/posts/private-post'
  );

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
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
    insert into public.hypotheses (
      slug,
      category_id,
      statement,
      success_criteria
    )
    values (
      'raw-write',
      '00000000-0000-0000-0000-000000000010',
      'Raw claim',
      'Raw criterion'
    )
  $$,
  '42501',
  null,
  'admin cannot bypass mutation RPC with raw insert'
);

select lives_ok(
  $$
    select public.create_hypothesis(
      'rpc-created',
      '00000000-0000-0000-0000-000000000020',
      '00000000-0000-0000-0000-000000000010',
      null,
      null,
      'A claim',
      '',
      'A criterion',
      '',
      'running',
      60::smallint,
      null,
      array['00000000-0000-0000-0000-000000000011'::uuid]
    )
  $$,
  'admin can create hypothesis through RPC'
);

select results_eq(
  $$
    select count(*)
    from public.hypothesis_tags
    where hypothesis_id = (
      select id
      from public.hypotheses
      where slug = 'rpc-created'
    )
  $$,
  array[1::bigint],
  'create_hypothesis synchronizes tags'
);

select throws_ok(
  $$
    select public.create_hypothesis(
      'bad-project',
      '00000000-0000-0000-0000-000000000021',
      '00000000-0000-0000-0000-000000000010',
      null,
      null,
      'Bad project claim',
      '',
      'Criterion',
      '',
      'planned',
      40::smallint,
      null,
      array[]::uuid[]
    )
  $$,
  '23514',
  'Hypothesis project must reference a project content item',
  'non-project content cannot be used as project'
);

select lives_ok(
  $$
    select public.create_hypothesis_activity(
      (select id from public.hypotheses where slug = 'rpc-created'),
      '00000000-0000-0000-0000-000000000021',
      'experiment',
      'Landing page test',
      '',
      now(),
      null
    )
  $$,
  'admin can create an activity'
);

select lives_ok(
  $$
    select public.create_hypothesis_evidence(
      (
        select id
        from public.hypothesis_activities
        where title = 'Landing page test'
      ),
      'metric',
      'Ten signups',
      '',
      'https://example.com/evidence',
      now()
    )
  $$,
  'admin can create evidence'
);

select results_eq(
  $$
    select count(*)
    from public.hypothesis_activities
    where title = 'Landing page test'
      and published_at is null
  $$,
  array[1::bigint],
  'new activity is pending publication'
);

select results_eq(
  $$
    select count(*)
    from public.hypothesis_evidence
    where summary = 'Ten signups'
      and published_at is null
  $$,
  array[1::bigint],
  'new evidence is pending publication'
);

select throws_ok(
  $$
    update public.content_items
    set kind = 'post'
    where id = '00000000-0000-0000-0000-000000000020'
  $$,
  '23514',
  'Referenced project kind cannot change',
  'referenced project kind cannot change'
);

select throws_ok(
  $$
    update public.content_items
    set kind = 'project'
    where id = '00000000-0000-0000-0000-000000000021'
  $$,
  '23514',
  'Referenced activity content kind cannot change',
  'referenced related content kind cannot change'
);

select lives_ok(
  $$
    select public.conclude_hypothesis(
      (select id from public.hypotheses where slug = 'rpc-created'),
      'supported',
      'Criterion met',
      80::smallint,
      null,
      now()
    )
  $$,
  'running hypothesis can be concluded'
);

select lives_ok(
  $$
    select public.correct_hypothesis_decision(
      (select id from public.hypotheses where slug = 'rpc-created'),
      'inconclusive',
      'Sample was too small',
      55::smallint,
      'insufficient_data',
      now()
    )
  $$,
  'current decision can be corrected append-only'
);

select results_eq(
  $$
    select count(*)
    from public.hypothesis_decisions
    where hypothesis_id = (
      select id
      from public.hypotheses
      where slug = 'rpc-created'
    )
  $$,
  array[2::bigint],
  'decision correction preserves history'
);

select results_eq(
  $$
    select count(*)
    from public.hypothesis_decisions
    where hypothesis_id = (
      select id
      from public.hypotheses
      where slug = 'rpc-created'
    )
      and is_current
  $$,
  array[1::bigint],
  'exactly one corrected decision is current'
);

select throws_ok(
  $$
    select public.update_hypothesis(
      (select id from public.hypotheses where slug = 'rpc-created'),
      'rpc-created',
      '00000000-0000-0000-0000-000000000020',
      '00000000-0000-0000-0000-000000000010',
      'A claim',
      '',
      'A criterion',
      '',
      'running',
      null,
      60::smallint,
      null,
      null,
      array['00000000-0000-0000-0000-000000000011'::uuid]
    )
  $$,
  '23514',
  'Invalid hypothesis status transition',
  'terminal hypothesis cannot return to running'
);

select results_eq(
  $$
    select count(*)
    from pg_catalog.pg_proc
    where pronamespace = 'public'::regnamespace
      and proname like '%delete%hypothesis%'
  $$,
  array[0::bigint],
  'no hypothesis delete RPC exists'
);

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select results_eq(
  $$select public.get_public_hypothesis_by_slug('rpc-created')$$,
  array[null::jsonb],
  'private hypothesis is absent from public detail'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select public.update_hypothesis(
  (select id from public.hypotheses where slug = 'rpc-created'),
  'rpc-created',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'A claim',
  '',
  'A criterion',
  '',
  'concluded',
  'Public result summary',
  60::smallint,
  null,
  null,
  array['00000000-0000-0000-0000-000000000011'::uuid]
);

select results_eq(
  $$
    select jsonb_array_length(
      public.preview_hypothesis_publication(
        (select id from public.hypotheses where slug = 'rpc-created')
      ) -> 'activities'
    )
  $$,
  array[1],
  'publication preview includes pending activity'
);

select lives_ok(
  $$
    select public.publish_hypothesis(
      (select id from public.hypotheses where slug = 'rpc-created')
    )
  $$,
  'admin can publish reviewed hypothesis and children'
);

select set_config(
  'test.first_hypothesis_published_at',
  (
    select published_at::text
    from public.hypotheses
    where slug = 'rpc-created'
  ),
  true
);

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select isnt(
  public.get_public_hypothesis_by_slug('rpc-created'),
  null::jsonb,
  'public hypothesis is returned by slug'
);

select results_eq(
  $$
    select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'activities'
    )
  $$,
  array[1],
  'first publish exposes reviewed activity'
);

select results_eq(
  $$select public.get_public_hypothesis_by_slug('rpc-created') -> 'project'$$,
  array['null'::jsonb],
  'unpublished project metadata is omitted'
);

select results_eq(
  $$
    select jsonb_path_query_first(
      public.get_public_hypothesis_by_slug('rpc-created'),
      '$.activities[*] ? (@.title == "Landing page test").relatedContent'
    )
  $$,
  array['null'::jsonb],
  'unpublished related content metadata is omitted'
);

select results_eq(
  $$
    select key
    from jsonb_object_keys(
      public.get_public_hypothesis_by_slug('rpc-created')
    ) as key
    order by key
  $$,
  array[
    'activities',
    'category',
    'decision',
    'id',
    'measurementPlan',
    'project',
    'publicSummary',
    'publishedAt',
    'relations',
    'slug',
    'statement',
    'status',
    'successCriteria',
    'tags',
    'updatedAt'
  ],
  'public detail returns only declared top-level keys'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.create_hypothesis_activity(
      (select id from public.hypotheses where slug = 'rpc-created'),
      null,
      'analysis',
      'Pending analysis',
      '',
      now(),
      null
    )
  $$,
  'admin can append a pending activity after publication'
);

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select results_eq(
  $$
    select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'activities'
    )
  $$,
  array[1],
  'new activity remains hidden until change publication'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.update_hypothesis_activity(
      (
        select id
        from public.hypothesis_activities
        where title = 'Landing page test'
      ),
      '00000000-0000-0000-0000-000000000021',
      'experiment',
      'Landing page test corrected',
      '',
      (
        select started_at
        from public.hypothesis_activities
        where title = 'Landing page test'
      ),
      null
    )
  $$,
  'editing a published activity returns it to pending'
);

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select results_eq(
  $$
    select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'activities'
    )
  $$,
  array[0],
  'pending parent activity hides its published evidence'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.publish_hypothesis_changes(
      (select id from public.hypotheses where slug = 'rpc-created')
    )
  $$,
  'admin can publish all pending changes atomically'
);

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select results_eq(
  $$
    select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'activities'
    )
  $$,
  array[2],
  'change publication exposes edited and new activities'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.unpublish_hypothesis(
      (select id from public.hypotheses where slug = 'rpc-created')
    )
  $$,
  'admin can make a public hypothesis private'
);

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select results_eq(
  $$select public.get_public_hypothesis_by_slug('rpc-created')$$,
  array[null::jsonb],
  'unpublished hypothesis disappears immediately'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.publish_hypothesis(
      (select id from public.hypotheses where slug = 'rpc-created')
    )
  $$,
  'admin can republish a private hypothesis'
);

select results_eq(
  $$
    select published_at
    from public.hypotheses
    where slug = 'rpc-created'
  $$,
  array[current_setting('test.first_hypothesis_published_at')::timestamptz],
  'republishing preserves first hypothesis publication time'
);

set local role postgres;

insert into public.content_versions (
  content_item_id,
  revision_number,
  state,
  title,
  body_markdown,
  published_at
)
values
  (
    '00000000-0000-0000-0000-000000000020',
    1,
    'published',
    'Published Project',
    '',
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    1,
    'published',
    'Published Post',
    '',
    now()
  );

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select results_eq(
  $$
    select public.get_public_hypothesis_by_slug('rpc-created')
      #>> '{project,title}'
  $$,
  array['Published Project'::text],
  'published project metadata is visible'
);

select results_eq(
  $$
    select jsonb_path_query_first(
      public.get_public_hypothesis_by_slug('rpc-created'),
      '$.activities[*] ? (@.title == "Landing page test corrected").relatedContent.title'
    ) #>> '{}'
  $$,
  array['Published Post'::text],
  'published related content metadata is visible'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.create_hypothesis(
      'follow-up',
      null,
      '00000000-0000-0000-0000-000000000010',
      (select id from public.hypotheses where slug = 'rpc-created'),
      'follow_up',
      'A follow-up claim',
      '',
      'A follow-up criterion',
      '',
      'planned',
      50::smallint,
      null,
      array[]::uuid[]
    )
  $$,
  'admin can create a follow-up hypothesis'
);

select public.update_hypothesis(
  (select id from public.hypotheses where slug = 'follow-up'),
  'follow-up',
  null,
  '00000000-0000-0000-0000-000000000010',
  'A follow-up claim',
  '',
  'A follow-up criterion',
  '',
  'planned',
  'Follow-up public summary',
  50::smallint,
  null,
  null,
  array[]::uuid[]
);

select lives_ok(
  $$
    select public.publish_hypothesis(
      (select id from public.hypotheses where slug = 'follow-up')
    )
  $$,
  'admin can publish a follow-up hypothesis'
);

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select results_eq(
  $$
    select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'relations'
    )
  $$,
  array[1],
  'relation appears when both hypotheses are public'
);

select results_eq(
  $$select count(*) from public.list_public_hypotheses()$$,
  array[2::bigint],
  'public list returns both public hypotheses'
);

select results_eq(
  $$
    select count(*)
    from public.list_public_hypotheses_by_project(
      '00000000-0000-0000-0000-000000000020'
    )
  $$,
  array[1::bigint],
  'published project list returns its public hypothesis'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'admin')
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.unpublish_hypothesis(
      (select id from public.hypotheses where slug = 'follow-up')
    )
  $$,
  'admin can unpublish a related hypothesis'
);

select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text,
  true
);
set local role anon;

select results_eq(
  $$
    select jsonb_array_length(
      public.get_public_hypothesis_by_slug('rpc-created') -> 'relations'
    )
  $$,
  array[0],
  'relation disappears when the related hypothesis is private'
);

select throws_ok(
  $$select * from public.hypotheses$$,
  '42501',
  null,
  'anon cannot select hypothesis source rows'
);

select ok(
  has_function_privilege(
    'anon',
    'public.get_public_hypothesis_by_slug(text)',
    'EXECUTE'
  ),
  'anon can execute public detail RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.publish_hypothesis(uuid)',
    'EXECUTE'
  ),
  'anon cannot execute publication mutation'
);

set local role authenticated;

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000002',
    'role',
    'authenticated',
    'app_metadata',
    json_build_object('role', 'member')
  )::text,
  true
);

select throws_ok(
  $$
    select public.create_hypothesis(
      'member-write',
      null,
      '00000000-0000-0000-0000-000000000010',
      null,
      null,
      'Member claim',
      '',
      'Criterion',
      '',
      'planned',
      50::smallint,
      null,
      array[]::uuid[]
    )
  $$,
  '42501',
  'Administrator access required',
  'normal authenticated user cannot call mutation RPC'
);

select results_eq(
  $$select count(*) from public.hypotheses$$,
  array[0::bigint],
  'normal authenticated user cannot read hypothesis source rows'
);

set local role postgres;

select * from finish();
rollback;
