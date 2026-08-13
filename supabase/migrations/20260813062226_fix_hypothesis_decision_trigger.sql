create or replace function private.validate_hypothesis_current_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hypothesis_id uuid;
  target_status text;
  current_count integer;
begin
  if tg_table_name = 'hypotheses' then
    target_hypothesis_id := coalesce(new.id, old.id);
  else
    target_hypothesis_id := coalesce(new.hypothesis_id, old.hypothesis_id);
  end if;

  select status
  into target_status
  from public.hypotheses
  where id = target_hypothesis_id;

  if target_status is null then
    return null;
  end if;

  select count(*)
  into current_count
  from public.hypothesis_decisions
  where hypothesis_id = target_hypothesis_id
    and is_current;

  if (target_status = 'concluded' and current_count <> 1)
    or (target_status <> 'concluded' and current_count <> 0) then
    raise exception using
      errcode = '23514',
      message = 'Hypothesis current decision does not match status';
  end if;

  return null;
end;
$$;

revoke all on function private.validate_hypothesis_current_decision()
from public, anon, authenticated;
