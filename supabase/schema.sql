create extension if not exists "pgcrypto";

do $$
begin
  create type public.expense_split_status as enum ('not_requested', 'requesting', 'settled');
exception
  when duplicate_object then null;
end $$;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  share_token text unique default encode(gen_random_bytes(18), 'hex'),
  route text,
  start_date date,
  end_date date,
  base_currency text not null default 'THB',
  budget_minor bigint not null default 0 check (budget_minor >= 0),
  created_at timestamptz not null default now()
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  color text,
  unique(owner_id, name)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  note text,
  raw_input text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'THB',
  base_amount_minor bigint not null check (base_amount_minor >= 0),
  paid_by uuid not null references auth.users(id) on delete restrict,
  split_status public.expense_split_status not null default 'not_requested',
  spent_at timestamptz not null default now(),
  location_name text,
  created_at timestamptz not null default now()
);

create table public.expense_participants (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  share_minor bigint not null check (share_minor >= 0),
  amount_owed_minor bigint not null default 0 check (amount_owed_minor >= 0),
  is_excluded boolean not null default false,
  check (person_id is not null or user_id is not null)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  expense_id uuid references public.expenses(id) on delete set null,
  person_id uuid references public.people(id) on delete set null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'THB',
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;
alter table public.people enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_participants enable row level security;
alter table public.settlements enable row level security;

create policy "Users manage their trips" on public.trips for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users manage their people" on public.people for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users manage their categories" on public.categories for all using (owner_id is null or owner_id = auth.uid()) with check (owner_id is null or owner_id = auth.uid());
create policy "Users manage trip expenses" on public.expenses for all using (exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.owner_id = auth.uid())) with check (exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.owner_id = auth.uid()));
create policy "Users manage expense participants" on public.expense_participants for all using (exists (select 1 from public.expenses join public.trips on trips.id = expenses.trip_id where expenses.id = expense_participants.expense_id and trips.owner_id = auth.uid())) with check (exists (select 1 from public.expenses join public.trips on trips.id = expenses.trip_id where expenses.id = expense_participants.expense_id and trips.owner_id = auth.uid()));
create policy "Users manage settlements" on public.settlements for all using (exists (select 1 from public.trips where trips.id = settlements.trip_id and trips.owner_id = auth.uid())) with check (exists (select 1 from public.trips where trips.id = settlements.trip_id and trips.owner_id = auth.uid()));

alter table public.trips add column if not exists share_token text;
create unique index if not exists trips_share_token_idx on public.trips (share_token) where share_token is not null;

create or replace function public.get_shared_trip(p_share_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'trip', to_jsonb(trip) - 'owner_id' - 'share_token',
    'expenses', coalesce(
      (
        select jsonb_agg(to_jsonb(expense) - 'paid_by' order by expense.spent_at desc)
        from public.expenses as expense
        where expense.trip_id = trip.id
      ),
      '[]'::jsonb
    )
  )
  from public.trips as trip
  where trip.share_token = p_share_token;
$$;

grant execute on function public.get_shared_trip(text) to anon, authenticated;
