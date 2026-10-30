-- Separate user-scoped cloud snapshot for the FahrlehrerKalender NRW.
-- Apply only to the chosen 'pruefungsrouten' Supabase project after restoration.
create table if not exists public.fahrlehrer_calendar_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  calendar_data jsonb not null default '{}'::jsonb,
  gps_routes jsonb not null default '{}'::jsonb,
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now(),
  constraint calendar_data_object check (jsonb_typeof(calendar_data) = 'object'),
  constraint gps_routes_object check (jsonb_typeof(gps_routes) = 'object')
);
alter table public.fahrlehrer_calendar_state enable row level security;
revoke all on public.fahrlehrer_calendar_state from anon;
grant select, insert, update on public.fahrlehrer_calendar_state to authenticated;
create policy "calendar_read_own" on public.fahrlehrer_calendar_state
  for select to authenticated using (user_id = (select auth.uid()));
create policy "calendar_insert_own" on public.fahrlehrer_calendar_state
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "calendar_update_own" on public.fahrlehrer_calendar_state
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- No delete policy: removal must be a deliberate administrative operation.
