revoke execute on function public.list_public_hypotheses()
from public, anon, authenticated;
revoke execute on function public.get_public_hypothesis_by_slug(text)
from public, anon, authenticated;
revoke execute on function public.list_public_hypotheses_by_project(uuid)
from public, anon, authenticated;
revoke execute on function public.preview_hypothesis_publication(uuid)
from public, anon, authenticated;
revoke execute on function public.publish_hypothesis(uuid)
from public, anon, authenticated;
revoke execute on function public.publish_hypothesis_changes(uuid)
from public, anon, authenticated;
revoke execute on function public.unpublish_hypothesis(uuid)
from public, anon, authenticated;

revoke execute on function public.correct_hypothesis_decision(
  uuid,
  text,
  text,
  smallint,
  text,
  timestamptz
) from public, anon, authenticated;
revoke execute on function public.conclude_hypothesis(
  uuid,
  text,
  text,
  smallint,
  text,
  timestamptz
) from public, anon, authenticated;
revoke execute on function public.update_hypothesis_evidence(
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated;
revoke execute on function public.create_hypothesis_evidence(
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated;
revoke execute on function public.update_hypothesis_activity(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) from public, anon, authenticated;
revoke execute on function public.create_hypothesis_activity(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz
) from public, anon, authenticated;
revoke execute on function public.update_hypothesis(
  uuid,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  smallint,
  timestamptz,
  timestamptz,
  uuid[]
) from public, anon, authenticated;
revoke execute on function public.create_hypothesis(
  text,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  smallint,
  timestamptz,
  uuid[]
) from public, anon, authenticated;

drop function if exists public.list_public_hypotheses_by_project(uuid);
drop function if exists public.get_public_hypothesis_by_slug(text);
drop function if exists public.list_public_hypotheses();
drop function if exists public.preview_hypothesis_publication(uuid);
drop function if exists public.publish_hypothesis(uuid);
drop function if exists public.publish_hypothesis_changes(uuid);
drop function if exists public.unpublish_hypothesis(uuid);
drop function if exists private.build_hypothesis_public_projection(uuid, boolean);
drop function if exists private.build_hypothesis_public_activities(uuid, boolean);
drop function if exists private.build_hypothesis_public_evidence(uuid, boolean);

drop function if exists public.correct_hypothesis_decision(
  uuid,
  text,
  text,
  smallint,
  text,
  timestamptz
);
drop function if exists public.conclude_hypothesis(
  uuid,
  text,
  text,
  smallint,
  text,
  timestamptz
);
drop function if exists public.update_hypothesis_evidence(
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
);
drop function if exists public.create_hypothesis_evidence(
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
);
drop function if exists public.update_hypothesis_activity(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz
);
drop function if exists public.create_hypothesis_activity(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz
);
drop function if exists public.update_hypothesis(
  uuid,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  smallint,
  timestamptz,
  timestamptz,
  uuid[]
);
drop function if exists public.create_hypothesis(
  text,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  smallint,
  timestamptz,
  uuid[]
);

drop trigger if exists content_items_prevent_hypothesis_reference_kind_change
on public.content_items;

drop table if exists public.hypothesis_evidence;
drop table if exists public.hypothesis_activities;
drop table if exists public.hypothesis_tags;
drop table if exists public.hypothesis_decisions;
drop table if exists public.hypotheses;

drop function if exists private.validate_evidence_publication();
drop function if exists private.validate_hypothesis_current_decision();
drop function if exists private.enforce_hypothesis_immutability_and_transition();
drop function if exists private.prevent_referenced_content_kind_change();
drop function if exists private.validate_hypothesis_related_content();
drop function if exists private.validate_hypothesis_project();
drop function if exists private.require_hypothesis_admin();
