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

alter table public.profiles
add column if not exists current_oluet bigint not null default 0;

alter table public.profiles
add column if not exists best_oluet bigint not null default 0;

alter table public.profiles
add column if not exists prestige_level integer not null default 0;

alter table public.profiles
add column if not exists lifetime_oluet bigint not null default 0;

alter table public.profiles
add column if not exists last_prestiged_at timestamptz;

update public.profiles
set
  nickname = btrim(regexp_replace(nickname, '\s+', ' ', 'g')),
  current_ryypyt = greatest(0, least(1000000000, coalesce(current_ryypyt, ryypyt, 0))),
  best_ryypyt = greatest(0, least(1000000000, greatest(coalesce(best_ryypyt, 0), coalesce(ryypyt, 0), coalesce(current_ryypyt, 0)))),
  ryypyt = greatest(0, least(1000000000, greatest(coalesce(best_ryypyt, 0), coalesce(ryypyt, 0), coalesce(current_ryypyt, 0)))),
  current_oluet = greatest(0, least(1000000000, coalesce(current_oluet, 0))),
  best_oluet = greatest(0, least(1000000000, greatest(coalesce(best_oluet, 0), coalesce(current_oluet, 0)))),
  prestige_level = greatest(0, least(10, coalesce(prestige_level, 0))),
  lifetime_oluet = greatest(0, least(1000000000000, coalesce(lifetime_oluet, 0)));

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
  and current_oluet between 0 and 1000000000
  and best_oluet between 0 and 1000000000
  and best_ryypyt >= current_ryypyt
  and best_oluet >= current_oluet
  and ryypyt = best_ryypyt
)
not valid;

alter table public.profiles
drop constraint if exists profiles_prestige_bounds;

alter table public.profiles
add constraint profiles_prestige_bounds
check (
  prestige_level between 0 and 10
  and lifetime_oluet between 0 and 1000000000000
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

create or replace function public.safe_oluet_from_save(save_data jsonb)
returns bigint
language plpgsql
immutable
as $$
declare
  raw_value text;
  parsed_value numeric;
begin
  raw_value := save_data #>> '{state,oluet}';

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

with latest_saves as (
  select distinct on (user_id)
    user_id,
    public.safe_ryypyt_from_save(save_data) as ryypyt_score,
    public.safe_oluet_from_save(save_data) as oluet_score
  from public.game_saves
  order by user_id, updated_at desc
)
update public.profiles as profiles
set
  current_ryypyt = latest_saves.ryypyt_score,
  best_ryypyt = greatest(profiles.best_ryypyt, latest_saves.ryypyt_score),
  ryypyt = greatest(profiles.best_ryypyt, latest_saves.ryypyt_score),
  current_oluet = latest_saves.oluet_score,
  best_oluet = greatest(profiles.best_oluet, latest_saves.oluet_score)
from latest_saves
where profiles.user_id = latest_saves.user_id;

create or replace function public.sync_profile_score_from_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ryypyt_score bigint;
  oluet_score bigint;
begin
  ryypyt_score := public.safe_ryypyt_from_save(new.save_data);
  oluet_score := public.safe_oluet_from_save(new.save_data);

  update public.profiles
  set
    current_ryypyt = ryypyt_score,
    best_ryypyt = greatest(best_ryypyt, ryypyt_score),
    ryypyt = greatest(best_ryypyt, ryypyt_score),
    current_oluet = oluet_score,
    best_oluet = greatest(best_oluet, oluet_score),
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

create or replace function public.prestige_required_oluet(current_level integer)
returns bigint
language sql
immutable
as $$
  select case current_level
    when 0 then 1000
    when 1 then 2000
    when 2 then 3500
    when 3 then 6000
    when 4 then 10000
    when 5 then 16000
    when 6 then 25000
    when 7 then 40000
    when 8 then 65000
    when 9 then 100000
    else null
  end;
$$;

create or replace function public.claim_prestige(run_oluet bigint)
returns table (
  prestige_level integer,
  lifetime_oluet bigint,
  next_required_oluet bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  player_id uuid := auth.uid();
  profile_row public.profiles%rowtype;
  safe_run_oluet bigint;
  required_oluet bigint;
begin
  if player_id is null then
    raise exception 'Kirjaudu ensin ennen prestigeä.';
  end if;

  select *
  into profile_row
  from public.profiles
  where user_id = player_id
  for update;

  if not found then
    raise exception 'Valitse nimimerkki ennen prestigeä.';
  end if;

  if profile_row.prestige_level >= 10 then
    raise exception 'Korkein prestige-taso on jo saavutettu.';
  end if;

  safe_run_oluet := greatest(0, least(1000000000, coalesce(run_oluet, 0)));
  required_oluet := public.prestige_required_oluet(profile_row.prestige_level);

  if required_oluet is null or safe_run_oluet < required_oluet then
    raise exception 'Prestige vaatii % juotua olutta tällä kierroksella.', required_oluet;
  end if;

  update public.profiles
  set
    prestige_level = profile_row.prestige_level + 1,
    lifetime_oluet = least(1000000000000, coalesce(lifetime_oluet, 0) + safe_run_oluet),
    current_ryypyt = 0,
    best_ryypyt = 0,
    ryypyt = 0,
    current_oluet = 0,
    best_oluet = 0,
    last_prestiged_at = now(),
    updated_at = now()
  where user_id = player_id
  returning * into profile_row;

  delete from public.game_saves
  where user_id = player_id
    and slot = 'main';

  return query
  select
    profile_row.prestige_level,
    profile_row.lifetime_oluet,
    public.prestige_required_oluet(profile_row.prestige_level);
end;
$$;

revoke all on function public.prestige_required_oluet(integer) from public;
revoke all on function public.claim_prestige(bigint) from public;
grant execute on function public.claim_prestige(bigint) to authenticated;

drop view if exists public.scoreboard;

create view public.scoreboard as
select
  nickname,
  best_oluet as oluet,
  best_ryypyt as ryypyt,
  prestige_level,
  lifetime_oluet,
  updated_at
from public.profiles
where
  (best_oluet > 0 or prestige_level > 0)
  and nickname ~ '^[A-Za-z0-9ÅÄÖåäö _-]{2,24}$';

grant select on public.scoreboard to anon, authenticated;

create or replace function public.global_economy_next_shift(reference_time timestamptz default now())
returns timestamptz
language plpgsql
stable
as $$
declare
  local_time timestamp;
  candidate timestamp;
begin
  local_time := reference_time at time zone 'Europe/Helsinki';
  candidate := date_trunc('day', local_time) + interval '6 hours';

  if local_time >= candidate then
    candidate := candidate + interval '1 day';
  end if;

  return candidate at time zone 'Europe/Helsinki';
end;
$$;

create or replace function public.global_economy_mood(index_value numeric)
returns text
language sql
immutable
as $$
  select case
    when index_value <= 0.92 then 'Halpuutuspaniikki'
    when index_value <= 1.05 then 'Tavallinen nihkeys'
    when index_value <= 1.20 then 'Hintahumppa'
    when index_value <= 1.32 then 'Kuitinpolttokausi'
    else 'Indeksihorkka'
  end;
$$;

create table if not exists public.global_economy (
  id text primary key default 'main',
  current_index numeric(6,3) not null default 1.000,
  last_shift_at timestamptz not null default now(),
  next_shift_at timestamptz not null default public.global_economy_next_shift(now()),
  delta numeric(6,3) not null default 0,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint global_economy_singleton check (id = 'main'),
  constraint global_economy_index_bounds check (current_index between 0.85 and 1.40)
);

alter table public.global_economy enable row level security;

revoke all on public.global_economy from public;
revoke all on public.global_economy from anon;
revoke all on public.global_economy from authenticated;

create or replace function public.get_global_economy()
returns table (
  current_index numeric,
  mood text,
  last_shift_at timestamptz,
  next_shift_at timestamptz,
  delta numeric,
  updated_at timestamptz,
  history jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  economy public.global_economy%rowtype;
  changed boolean := false;
  shift_delta numeric;
  new_index numeric;
  new_history jsonb;
begin
  insert into public.global_economy (
    id,
    current_index,
    last_shift_at,
    next_shift_at,
    delta,
    history
  )
  values (
    'main',
    1.000,
    now(),
    public.global_economy_next_shift(now()),
    0,
    jsonb_build_array(jsonb_build_object('at', now(), 'index', 1.000, 'delta', 0))
  )
  on conflict (id) do nothing;

  select *
  into economy
  from public.global_economy
  where id = 'main'
  for update;

  while economy.next_shift_at <= now() loop
    shift_delta := (-0.04 + random() * 0.09)::numeric;

    if random() < 0.12 then
      shift_delta := shift_delta + (-0.03 + random() * 0.07)::numeric;
    end if;

    new_index := round(least(1.40, greatest(0.85, economy.current_index + shift_delta))::numeric, 3);
    shift_delta := round((new_index - economy.current_index)::numeric, 3);

    new_history := coalesce(economy.history, '[]'::jsonb)
      || jsonb_build_array(jsonb_build_object(
        'at', economy.next_shift_at,
        'index', new_index,
        'delta', shift_delta
      ));

    select coalesce(jsonb_agg(value order by ordinality), '[]'::jsonb)
    into new_history
    from (
      select value, ordinality
      from jsonb_array_elements(new_history) with ordinality
      order by ordinality desc
      limit 30
    ) recent;

    economy.current_index := new_index;
    economy.delta := shift_delta;
    economy.last_shift_at := economy.next_shift_at;
    economy.next_shift_at := public.global_economy_next_shift(economy.next_shift_at + interval '1 second');
    economy.updated_at := now();
    economy.history := new_history;
    changed := true;
  end loop;

  if changed then
    update public.global_economy
    set
      current_index = economy.current_index,
      last_shift_at = economy.last_shift_at,
      next_shift_at = economy.next_shift_at,
      delta = economy.delta,
      history = economy.history,
      updated_at = economy.updated_at
    where id = 'main'
    returning * into economy;
  end if;

  return query
  select
    economy.current_index,
    public.global_economy_mood(economy.current_index),
    economy.last_shift_at,
    economy.next_shift_at,
    economy.delta,
    economy.updated_at,
    economy.history;
end;
$$;

revoke all on function public.global_economy_next_shift(timestamptz) from public;
revoke all on function public.global_economy_mood(numeric) from public;
revoke all on function public.get_global_economy() from public;
grant execute on function public.get_global_economy() to anon, authenticated;
