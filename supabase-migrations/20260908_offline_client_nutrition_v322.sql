alter table public.offline_clients
  add column if not exists nutrition_plan jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offline_clients_nutrition_plan_shape'
      and conrelid = 'public.offline_clients'::regclass
  ) then
    alter table public.offline_clients
      add constraint offline_clients_nutrition_plan_shape
      check (
        nutrition_plan is null
        or (
          jsonb_typeof(nutrition_plan) = 'object'
          and octet_length(nutrition_plan::text) <= 262144
        )
      );
  end if;
end
$$;

comment on column public.offline_clients.nutrition_plan is
  'Latest trainer-only calorie and macro calculation for an offline client.';

notify pgrst, 'reload schema';
