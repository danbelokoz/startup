# Startup descriptions — rephrase + translate (no API key, no runtime cost)

Each startup detail page shows a description that is **(a)** rephrased in our own
words (so the page isn't a 1:1 copy of trustmrr.com) and **(b)** translated into the
UI language. All of it is generated **offline, by Claude Code in a session** and
stored in Supabase `startup_descriptions`. `api/enrich.js` just serves the right
language from that table — there are **no translation API calls at request time**.

| column        | meaning                                                        |
|---------------|----------------------------------------------------------------|
| `slug`        | startup slug (PK)                                              |
| `original`    | TrustMRR's original English text (reference / change detection)|
| `description` | our English **rephrase**                                       |
| `translations`| `{ ru, de, fr, it, zh, ar }` — translated rephrases (jsonb)    |
| `status`      | `done` = rephrase + all 6 translations · `pending` otherwise   |

Target languages: **ru, de, fr, it, zh, ar** (English is `description`).

## One-time setup
1. Run [`supabase-descriptions-i18n.sql`](../../supabase-descriptions-i18n.sql) in the
   Supabase SQL Editor (adds `translations`, `status`, index).
2. `cp .env.local.example .env.local` and paste the **service_role** key
   (Supabase dashboard → Project Settings → API). `.env.local` is gitignored.

## Each generation run (you trigger Claude Code)
```bash
# 1. Grab the next batch of startups still needing work (on-sale first).
python3 scripts/descriptions/fetch_pending.py --limit 12
#    → writes _work/pending.json  (slug + name + original English description)

# 2. Claude reads _work/pending.json, writes _work/batch.json with, per startup:
#       { slug, original, description (English rephrase),
#         translations: { ru, de, fr, it, zh, ar } }

# 3. Upsert the batch into Supabase.
python3 scripts/descriptions/upsert.py _work/batch.json
```

- **Never overwrites finished work:** `fetch_pending.py` skips `status='done'`, and the
  nightly catalog refresh never writes this table — so a startup's stored description
  survives TrustMRR updates.
- **New startups** surface automatically: anything in the catalog without a `done` row
  is picked up on the next `fetch_pending` run. The admin "Обзор" shows
  *Описания готовы* and *Ждут перефраза/перевода* counts.
- Scope is on-sale by default (`--all` for the whole catalog). Batches of ~10–15 keep
  quality high; ~1800 on-sale startups → process over several sessions.
