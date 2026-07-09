-- "Date added" support for the catalog "Added within N days" filter.
--
-- TrustMRR never tells us when a startup was listed, so we approximate the
-- listing/added date with the earliest day WE saw it. That signal already lives
-- in two places: daily_snapshots (one row per startup per day, pruned at 180d)
-- and startup_archive (one persistent row per startup, upserted nightly).
--
-- We add first_seen to startup_archive and make it *insert-only*: the nightly
-- sweep (scripts/refresh-catalog.js) never sends first_seen in its upsert
-- payload, so PostgREST's ON CONFLICT DO UPDATE leaves it untouched — it's
-- stamped once, when the row is first inserted, and then keeps growing accurate
-- forever (unlike daily_snapshots, whose earliest date drifts as old rows are
-- pruned).
--
-- Run once in the Supabase SQL Editor (service-role bypasses RLS).

alter table startup_archive add column if not exists first_seen date;

-- Backfill existing rows from the best signal available today: the earliest
-- snapshot we have (up to ~180 days back), falling back to the row's own
-- updated_at date, then today. New rows created after this migration get the
-- default (current_date) on insert.
update startup_archive a
set first_seen = coalesce(
  (select min(d.snap_date) from daily_snapshots d where d.slug = a.slug),
  a.updated_at::date,
  current_date
)
where a.first_seen is null;

alter table startup_archive alter column first_seen set default current_date;

create index if not exists startup_archive_first_seen_idx on startup_archive (first_seen desc);
