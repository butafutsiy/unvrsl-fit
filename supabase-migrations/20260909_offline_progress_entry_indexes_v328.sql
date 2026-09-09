create index if not exists offline_client_measurements_trainer_id_idx
  on public.offline_client_measurements(trainer_id);

create index if not exists offline_client_measurements_share_id_idx
  on public.offline_client_measurements(submitted_via_share_id)
  where submitted_via_share_id is not null;

create index if not exists offline_client_strengths_trainer_id_idx
  on public.offline_client_strengths(trainer_id);

create index if not exists offline_client_strengths_share_id_idx
  on public.offline_client_strengths(submitted_via_share_id)
  where submitted_via_share_id is not null;
