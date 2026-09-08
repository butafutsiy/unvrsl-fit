create index if not exists offline_progress_shares_client_idx
  on public.offline_progress_shares(offline_client_id);

-- The read-only progress page always uses an anonymous Supabase client.
-- Keep this SECURITY DEFINER entry point unavailable to signed-in roles.
revoke execute on function public.get_offline_progress_share(text)
  from authenticated, service_role;
grant execute on function public.get_offline_progress_share(text)
  to anon;

notify pgrst, 'reload schema';
