create table if not exists public.strategies (
  id text primary key,
  rank integer not null default 9999,
  name text not null,
  type text not null,
  assetClass text not null,
  accountValue double precision not null default 10000,
  returnPct double precision not null default 0,
  totalPnL double precision not null default 0,
  fees double precision not null default 0,
  winRate double precision not null default 0,
  hwm double precision not null default 10000,
  maxDrawdown double precision not null default 0,
  sharpe double precision not null default 0,
  trades integer not null default 0,
  creator text not null default 'unknown',
  sourceUrl text not null default '',
  validationStatus text not null default 'pending',
  deployStatus text not null default 'draft',
  createdAt text not null,
  description text not null default '',
  skillProfile jsonb,
  sourceChannel text not null default 'Web',
  stage text,
  ownerKey text,
  ownerIp text,
  browserFingerprint text,
  deviceUuid text,
  inserted_at timestamptz not null default now()
);

alter table public.strategies enable row level security;

create policy "Public read strategies"
on public.strategies
for select
using (true);

create policy "Public write strategies"
on public.strategies
for all
using (true)
with check (true);
