begin;

select plan(2);

insert into auth.users (
  id,
  email,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at
)
values (
  '10000000-0000-0000-0000-000000000001',
  'hypothesis-commit@example.com',
  false,
  false,
  now(),
  now()
);

insert into public.categories (id, slug, name)
values (
  '10000000-0000-0000-0000-000000000010',
  'hypothesis-commit',
  'Hypothesis commit'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '10000000-0000-0000-0000-000000000001',
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
      'commit-trigger-check',
      null,
      '10000000-0000-0000-0000-000000000010',
      null,
      null,
      'A commit-level claim',
      '',
      'A commit-level criterion',
      '',
      'planned',
      50::smallint,
      null,
      array[]::uuid[]
    )
  $$,
  'hypothesis creation reaches the deferred constraint trigger'
);

commit;

begin;

select ok(
  exists (
    select 1
    from public.hypotheses
    where slug = 'commit-trigger-check'
  ),
  'hypothesis creation commits successfully'
);

reset role;

delete from public.hypotheses
where slug = 'commit-trigger-check';

delete from public.categories
where id = '10000000-0000-0000-0000-000000000010';

delete from auth.users
where id = '10000000-0000-0000-0000-000000000001';

select * from finish();

commit;
