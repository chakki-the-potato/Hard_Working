begin;

select plan(14);

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

select * from finish();
rollback;
