-- Dead-startup deny-list ───────────────────────────────────────────────────────
-- Some startups stay in TrustMRR's onSale LIST after their detail endpoint starts
-- 404-ing (TrustMRR-side partial delisting). Our onSale catalog pages live in Redis
-- without a TTL and the nightly sweep only refreshes the full `revenue-desc` catalog,
-- so those "zombie" listings keep showing as on-sale while their metrics freeze
-- (no snapshot, detail returns the archive banner).
--
-- This table is a self-healing deny-list:
--   • api/startup.js inserts a slug when its TrustMRR detail returns 404
--   • api/startup.js deletes a slug when a fresh detail fetch succeeds (re-listed)
--   • api/startups.js filters these slugs out of every catalog response
-- It stays tiny (only currently-dead slugs), so the catalog filter is cheap.
--
-- Run once in the Supabase SQL editor.

create table if not exists dead_startups (
  slug        text primary key,
  detected_at timestamptz not null default now()
);

-- Server code talks to this table with the service-role key (bypasses RLS), but we
-- still enable RLS so the table isn't world-writable via the anon key.
alter table dead_startups enable row level security;
