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

alter table public.game_saves
drop constraint if exists game_saves_slot_format;

alter table public.game_saves
add constraint game_saves_slot_format
check (slot ~ '^[a-z0-9_-]{1,32}$')
not valid;

alter table public.game_saves
drop constraint if exists game_saves_payload_size;

alter table public.game_saves
add constraint game_saves_payload_size
check (octet_length(save_data::text) <= 250000)
not valid;

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

create or replace function public.rate_limit_game_save()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.updated_at > now() - interval '5 seconds' then
    raise exception 'Odota hetki ennen seuraavaa tallennusta.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists rate_limit_game_save_before_write on public.game_saves;

create trigger rate_limit_game_save_before_write
before insert or update
on public.game_saves
for each row
execute function public.rate_limit_game_save();

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  ryypyt bigint not null default 0,
  updated_at timestamptz not null default now(),
  check (char_length(btrim(nickname)) between 2 and 24)
);

alter table public.profiles
add column if not exists current_ryypyt bigint not null default 0;

alter table public.profiles
add column if not exists best_ryypyt bigint not null default 0;

update public.profiles
set
  nickname = btrim(regexp_replace(nickname, '\s+', ' ', 'g')),
  current_ryypyt = greatest(0, least(1000000000, coalesce(current_ryypyt, ryypyt, 0))),
  best_ryypyt = greatest(0, least(1000000000, greatest(coalesce(best_ryypyt, 0), coalesce(ryypyt, 0), coalesce(current_ryypyt, 0)))),
  ryypyt = greatest(0, least(1000000000, greatest(coalesce(best_ryypyt, 0), coalesce(ryypyt, 0), coalesce(current_ryypyt, 0))));

alter table public.profiles
drop constraint if exists profiles_nickname_format;

alter table public.profiles
add constraint profiles_nickname_format
check (
  nickname = btrim(nickname)
  and nickname ~ '^[A-Za-z0-9ÅÄÖåäö _-]{2,24}$'
)
not valid;

alter table public.profiles
drop constraint if exists profiles_score_bounds;

alter table public.profiles
add constraint profiles_score_bounds
check (
  current_ryypyt between 0 and 1000000000
  and best_ryypyt between 0 and 1000000000
  and ryypyt between 0 and 1000000000
  and best_ryypyt >= current_ryypyt
  and ryypyt = best_ryypyt
)
not valid;

create unique index if not exists profiles_nickname_lower_key
on public.profiles (lower(nickname));

alter table public.profiles enable row level security;

revoke all on public.profiles from public;
revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant insert (user_id, nickname, updated_at) on public.profiles to authenticated;
grant update (nickname, updated_at) on public.profiles to authenticated;

drop policy if exists "Scoreboard is public" on public.profiles;
drop policy if exists "Players can read own profile" on public.profiles;
drop policy if exists "Players can create own profile" on public.profiles;
drop policy if exists "Players can update own profile" on public.profiles;

create policy "Players can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Players can create own profile"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = user_id
  and nickname = btrim(nickname)
  and nickname ~ '^[A-Za-z0-9ÅÄÖåäö _-]{2,24}$'
);

create policy "Players can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and nickname = btrim(nickname)
  and nickname ~ '^[A-Za-z0-9ÅÄÖåäö _-]{2,24}$'
);

create or replace function public.rate_limit_profile_nickname()
returns trigger
language plpgsql
as $$
begin
  if old.nickname is distinct from new.nickname and old.updated_at > now() - interval '5 seconds' then
    raise exception 'Odota hetki ennen nimimerkin vaihtamista.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists rate_limit_profile_nickname_before_update on public.profiles;

create trigger rate_limit_profile_nickname_before_update
before update of nickname
on public.profiles
for each row
execute function public.rate_limit_profile_nickname();

create or replace function public.safe_ryypyt_from_save(save_data jsonb)
returns bigint
language plpgsql
immutable
as $$
declare
  raw_value text;
  parsed_value numeric;
begin
  raw_value := save_data #>> '{state,ryypyt}';

  if raw_value is null or raw_value !~ '^-?[0-9]+(\.[0-9]+)?$' then
    return 0;
  end if;

  parsed_value := floor(raw_value::numeric);

  if parsed_value < 0 then
    return 0;
  end if;

  if parsed_value > 1000000000 then
    return 1000000000;
  end if;

  return parsed_value::bigint;
end;
$$;

create or replace function public.sync_profile_score_from_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  score bigint;
begin
  score := public.safe_ryypyt_from_save(new.save_data);

  update public.profiles
  set
    current_ryypyt = score,
    best_ryypyt = greatest(best_ryypyt, score),
    ryypyt = greatest(best_ryypyt, score),
    updated_at = now()
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists sync_profile_score_after_save on public.game_saves;

create trigger sync_profile_score_after_save
after insert or update of save_data
on public.game_saves
for each row
execute function public.sync_profile_score_from_save();

drop view if exists public.scoreboard;

create view public.scoreboard as
select
  nickname,
  best_ryypyt as ryypyt,
  updated_at
from public.profiles
where
  best_ryypyt > 0
  and nickname ~ '^[A-Za-z0-9ÅÄÖåäö _-]{2,24}$';

grant select on public.scoreboard to anon, authenticated;
