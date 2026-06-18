-- Multilingual startup descriptions.
-- Extends startup_descriptions so each row carries our English rephrase PLUS
-- per-language translations of it. Everything is generated offline (by Claude Code,
-- see scripts/descriptions/) and served by api/enrich.js — no runtime API calls.
--
-- Run once in the Supabase SQL Editor. Additive and safe to re-run.

alter table public.startup_descriptions
  add column if not exists translations jsonb  not null default '{}'::jsonb,
  add column if not exists status       text    not null default 'pending',
  add column if not exists tr_updated_at timestamptz;

-- translations: { "<lang>": "<translated rephrase>" }, e.g. {"ru":"…","de":"…"}.
--   Target languages: ru, de, fr, it, zh, ar (en lives in `description`).
-- status:
--   'pending' — row exists but translations are missing/incomplete
--               (covers every existing English-only rewrite after this migration);
--   'done'    — English rephrase + all target-language translations are present.
comment on column public.startup_descriptions.translations is
  'lang code -> translated rephrase, e.g. {"ru":"...","de":"..."}';
comment on column public.startup_descriptions.status is
  'pending = needs translation; done = rephrase + all translations present';

-- Speeds up the admin "needs work" counter (status=eq.pending / done).
create index if not exists startup_descriptions_status_idx
  on public.startup_descriptions (status);
