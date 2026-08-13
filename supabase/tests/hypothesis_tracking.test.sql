begin;

select plan(32);

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
