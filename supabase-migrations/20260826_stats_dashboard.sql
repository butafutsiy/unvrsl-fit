-- UNVRSL FIT statistics dashboard additions
alter table public.profiles
  add column if not exists target_weight_kg numeric
  check (target_weight_kg is null or (target_weight_kg >= 30 and target_weight_kg <= 350));

-- Program removal uses a soft-revoked assignment so workout/progress history is preserved.
alter table public.plan_assignments drop constraint if exists plan_assignments_status_check;
alter table public.plan_assignments
  add constraint plan_assignments_status_check
  check (status in ('active','completed','archived','revoked'));
