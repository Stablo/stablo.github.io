create extension if not exists pgcrypto;

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null default 'main',
  game_version text,
  save_data jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, slot)
);

alter table public.game_saves enable row level security;

grant select, insert, update, delete on public.game_saves to authenticated;

drop policy if exists "Players can read own saves" on public.game_saves;
drop policy if exists "Players can create own saves" on public.game_saves;
drop policy if exists "Players can update own saves" on public.game_saves;
drop policy if exists "Players can delete own saves" on public.game_saves;

create policy "Players can read own saves"
on public.game_saves
for select
to authenticated
using (auth.uid() = user_id);

create policy "Players can create own saves"
on public.game_saves
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Players can update own saves"
on public.game_saves
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Players can delete own saves"
on public.game_saves
for delete
to authenticated
using (auth.uid() = user_id);
