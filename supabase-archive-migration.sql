-- Persistent per-startup snapshot so detail pages survive deletion from TrustMRR.
-- cron-refresh.js upserts every live startup here each night (full object + the
-- last date we still saw it upstream). When TrustMRR later 404s a startup,
-- api/startup.js serves this snapshot with { archived:true, lastSeen } so the
-- page keeps its name, price and metrics instead of going blank.
--
-- Run once in the Supabase SQL Editor. Service-role (server) bypasses RLS;
-- enabling RLS with no policies keeps the anon key from reading it directly.

create table if not exists startup_archive (
  slug       text primary key,
  data       jsonb       not null,                 -- last full startup object from TrustMRR
  last_seen  date        not null default current_date, -- last day it appeared upstream
  updated_at timestamptz not null default now()
);

-- Lets us list/count archived (delisted) startups by recency in the admin panel later.
create index if not exists startup_archive_last_seen_idx on startup_archive (last_seen desc);

alter table startup_archive enable row level security;
