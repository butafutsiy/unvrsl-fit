-- Allow the original recipient to retry a previously accepted one-use invite
-- after a client-side storage failure. Never grant another account access to
-- a consumed token. Existing assignments, plans and invites are untouched.
create or replace function public.accept_plan_invite(p_token text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  r record;
  trainer_name text;
  already_assigned boolean;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select i.id, i.trainer_id, i.plan_id, i.uses, i.max_uses,
         i.expires_at, p.title, p.version, p.snapshot, p.is_active
  into r
  from public.plan_invites i
  join public.plans p on p.id = i.plan_id and p.trainer_id = i.trainer_id
  where i.token = p_token
  for update of i;
  if not found or r.expires_at <= now() or not r.is_active then
    raise exception 'INVITE_INVALID';
  end if;
  if uid = r.trainer_id then raise exception 'TRAINER_CANNOT_ACCEPT_OWN_INVITE'; end if;

  select exists (
    select 1 from public.plan_assignments a
    where a.plan_id = r.plan_id and a.client_id = uid
      and a.trainer_id = r.trainer_id and a.status = 'active'
  ) into already_assigned;
  if r.uses >= r.max_uses and not already_assigned then
    raise exception 'INVITE_INVALID';
  end if;

  if r.uses < r.max_uses then
    insert into public.trainer_clients(trainer_id, client_id, status)
    values(r.trainer_id, uid, 'active')
    on conflict(trainer_id, client_id) do update set status = 'active';

    insert into public.plan_assignments(plan_id, trainer_id, client_id, version, snapshot, status, updated_at)
    values(r.plan_id, r.trainer_id, uid, r.version, r.snapshot, 'active', now())
    on conflict(plan_id, client_id) do update
    set version = excluded.version, snapshot = excluded.snapshot,
        status = 'active', updated_at = now();

    update public.plan_invites set uses = uses + 1 where id = r.id;
  end if;
  select display_name into trainer_name from public.profiles where id = r.trainer_id;
  return jsonb_build_object('plan_id',r.plan_id,'title',r.title,
    'version',r.version,'trainer_id',r.trainer_id,
    'trainer',coalesce(trainer_name,'Тренер'),'snapshot',r.snapshot);
end;
$function$;
