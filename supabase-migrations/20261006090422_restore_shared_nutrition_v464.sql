-- Keep saved nutrition available through existing private links.
alter table public.offline_clients add column if not exists nutrition_goal text
  check (nutrition_goal in ('cut', 'maintain', 'gain'));

create or replace function public.get_offline_progress_share_v334(p_token_hash text)
returns jsonb language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
  v_client public.offline_clients%rowtype;
  v_plan jsonb;
  v_nutrition jsonb;
  v_weight numeric;
  v_stale boolean := false;
begin
  v_result := public.get_offline_progress_share_v333(p_token_hash);
  if v_result is null then return null; end if;
  select c.* into v_client
  from public.offline_progress_shares s
  join public.offline_clients c on c.id=s.offline_client_id and c.trainer_id=s.trainer_id
  where s.token_hash=lower(p_token_hash) and s.revoked_at is null and s.expires_at>now()
  limit 1;
  if not found then return null; end if;
  v_plan := v_client.nutrition_plan;
  if jsonb_typeof(v_plan->'result'->'goals')='object' then
    select weight_kg into v_weight from public.offline_client_measurements
    where offline_client_id=v_client.id and trainer_id=v_client.trainer_id and weight_kg>0
    order by measure_date desc, created_at desc limit 1;
    if v_plan #>> '{inputs,weight}' ~ '^[0-9]+(\.[0-9]+)?$' and v_weight is not null then
      v_stale := abs((v_plan #>> '{inputs,weight}')::numeric-v_weight)>.05;
    end if;
    if v_plan #>> '{inputs,height}' ~ '^[0-9]+(\.[0-9]+)?$' and v_client.height_cm is not null then
      v_stale := v_stale or abs((v_plan #>> '{inputs,height}')::numeric-v_client.height_cm)>.05;
    end if;
    if v_plan #>> '{inputs,age}' ~ '^[0-9]+$' and v_client.birth_date is not null then
      v_stale := v_stale or (v_plan #>> '{inputs,age}')::integer <> extract(year from age(current_date,v_client.birth_date))::integer;
    end if;
    if v_client.sex in ('male','female') and v_plan #>> '{inputs,sex}' is not null then
      v_stale := v_stale or v_plan #>> '{inputs,sex}' <> v_client.sex;
    end if;
    v_nutrition := jsonb_build_object(
      'updatedAt',v_plan->'updatedAt','bmr',v_plan #> '{result,bmr,value}',
      'formula',v_plan #> '{result,bmr,formula}',
      'activityFactor',v_plan #> '{result,activity,factor}',
      'tdee',v_plan #> '{result,tdee}','goals',v_plan #> '{result,goals}',
      'stale',v_stale);
    v_result := jsonb_set(v_result,'{data,nutrition}',v_nutrition,true);
  end if;
  v_result := jsonb_set(v_result,'{data,nutritionGoal}',coalesce(to_jsonb(v_client.nutrition_goal),'null'::jsonb),true);
  v_result := jsonb_set(v_result,'{data,client,targetWeight}',coalesce(to_jsonb(v_client.target_weight_kg),'null'::jsonb),true);
  v_result := jsonb_set(v_result,'{data,version}',to_jsonb(334),true);
  return v_result;
end $$;

-- This capability endpoint intentionally supports clients without an account.
-- The unexpired, unrevoked private share is the authorization boundary.
create or replace function public.set_offline_nutrition_goal_v464(p_token_hash text,p_goal text)
returns jsonb language plpgsql volatile security definer
set search_path = pg_catalog, public
as $$
declare v_share public.offline_progress_shares%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Ссылка недействительна или устарела' using errcode='22023';
  end if;
  if p_goal is null or p_goal not in ('cut','maintain','gain') then
    raise exception 'Выбери цель питания' using errcode='22023';
  end if;
  select * into v_share from public.offline_progress_shares
  where token_hash=lower(p_token_hash) and revoked_at is null and expires_at>now()
  limit 1 for share;
  if not found then raise exception 'Ссылка недействительна или устарела' using errcode='22023'; end if;
  update public.offline_clients set nutrition_goal=p_goal
  where id=v_share.offline_client_id and trainer_id=v_share.trainer_id
    and jsonb_typeof(nutrition_plan->'result'->'goals'->p_goal)='object';
  if not found then raise exception 'Попроси тренера сохранить расчёт питания' using errcode='22023'; end if;
  return public.get_offline_progress_share_v334(p_token_hash);
end $$;
revoke all on function public.get_offline_progress_share_v334(text) from public;
revoke all on function public.set_offline_nutrition_goal_v464(text,text) from public;
grant execute on function public.get_offline_progress_share_v334(text) to anon, authenticated;
grant execute on function public.set_offline_nutrition_goal_v464(text,text) to anon, authenticated;
