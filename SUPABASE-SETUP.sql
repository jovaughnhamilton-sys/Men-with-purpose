-- Run in Supabase SQL Editor before enabling cloud-config.js.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
create policy "Users read only own data" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert only own data" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update only own data" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
