-- Rewritten startup descriptions, so our pages aren't a 1:1 copy of trustmrr.com.
-- Written by scripts/rewrite-descriptions.js (GitHub Actions), read by api/enrich.js.
-- Run once in the Supabase SQL Editor.

create table if not exists public.startup_descriptions (
  slug        text primary key,
  description text not null,          -- the rewritten version we display
  original    text,                   -- TrustMRR's original (for reference / change detection)
  model       text,
  updated_at  timestamptz not null default now()
);

-- Lock the table to the service role only: enrich.js reads it with the service-role
-- key (which bypasses RLS), and the rewrite script writes with it too. Enabling RLS
-- with no policy means anon/auth clients get nothing — descriptions are exposed only
-- through our own /api/enrich endpoint.
alter table public.startup_descriptions enable row level security;
