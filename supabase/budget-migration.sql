alter table public.trips
  add column if not exists budget_minor bigint not null default 0;

alter table public.trips
  add constraint trips_budget_minor_nonnegative
  check (budget_minor >= 0);