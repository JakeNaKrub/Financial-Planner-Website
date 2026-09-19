alter table public.trips
  add column if not exists share_token text;

update public.trips
set share_token = encode(gen_random_bytes(18), 'hex')
where share_token is null;

create unique index if not exists trips_share_token_idx
  on public.trips (share_token)
  where share_token is not null;

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
