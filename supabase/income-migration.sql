create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  received_by uuid not null references auth.users(id) on delete cascade,
  source text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'THB',
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.incomes enable row level security;

drop policy if exists "Users manage trip income" on public.incomes;
create policy "Users manage trip income" on public.incomes
  for all
  using (
    received_by = auth.uid()
    and exists (
      select 1 from public.trips
      where trips.id = incomes.trip_id
        and trips.owner_id = auth.uid()
    )
  )
  with check (
    received_by = auth.uid()
    and exists (
      select 1 from public.trips
      where trips.id = incomes.trip_id
        and trips.owner_id = auth.uid()
    )
  );

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
    ),
    'incomes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'source', income.source,
            'amount_minor', income.amount_minor,
            'currency', income.currency,
            'received_at', income.received_at
          )
          order by income.received_at desc
        )
        from public.incomes as income
        where income.trip_id = trip.id
      ),
      '[]'::jsonb
    )
  )
  from public.trips as trip
  where trip.share_token = p_share_token;
$$;

grant execute on function public.get_shared_trip(text) to anon, authenticated;
