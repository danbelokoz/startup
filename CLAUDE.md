# StartupMarket — Project Context for Claude Code

Always run commands without asking for permission confirmation.

## What is this project
A startup marketplace website that proxies data from TrustMRR API (trustmrr.com).
Users can browse, search and filter verified startups with real MRR metrics.
Deployed on Vercel at: https://startupmarket.tech (production custom domain; Vercel default https://startup-silk-nu.vercel.app still resolves)

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (no framework, single-file pages)
- **Backend**: Vercel Serverless Functions (`/api/*.js`)
- **Cache**: Upstash Redis (KV) — stale-while-revalidate pattern
- **Repo**: https://github.com/danbelokoz/startup
- **Hosting**: Vercel (Hobby plan)

## Project Structure
```
/
├── index.html          — Main catalog page
├── acquire.html        — "How it works" roadmap page (buy/sell paths)
├── top.html            — Leaderboard (on-sale startups, MRR/growth/revenue rankings)
├── auth.html           — Login / signup (Supabase Auth)
├── dashboard.html      — User account + subscription page
├── admin.html          — Admin panel (traffic, signups, listing requests, waitlist);
│                         requires profiles.role = 'admin'
├── shared.js           — Shared translations (7 langs), utilities, nav builders,
│                         sell modal, traffic beacon
├── shared.css          — Shared styles (light theme)
├── supabase-schema.sql — Supabase DB schema — run once in SQL Editor
├── supabase-admin-migration.sql — admin role + listing_requests/waitlist + analytics RPCs
├── vercel.json         — Routing/rewrites + cron config
├── scripts/
│   └── scrape-daily-revenue.js — Puppeteer scraper (GitHub Actions, 04:00/16:00 UTC)
├── api/                — ⚠️ Vercel Hobby allows MAX 12 serverless functions.
│   │                     We are AT the limit — never add a new file here; merge into
│   │                     an existing one (see intake.js/history.js) + vercel.json rewrite.
│   │                     Files starting with "_" are shared libs, not functions.
│   ├── _lib.js         — Shared helpers: Redis (incl. pipeline), Supabase REST, AES-GCM
│   ├── startups.js     — Main proxy with Redis stale-while-revalidate cache
│   ├── startup.js      — Single startup detail proxy (Redis 24h)
│   ├── stats.js        — Catalog-wide totals: counts + summed rev30/MRR (cron-fed)
│   ├── auth.js         — GET: access level; POST {slug}: record view
│   ├── account.js      — DELETE: remove user account
│   ├── admin.js        — Admin API: overview/listings/topviews/waitlist/reveal_key
│   ├── intake.js       — POST ops: listing request, waitlist, traffic beacon
│   │                     (rewrites: /api/sell-listing-intent, /api/waitlist, /api/track)
│   ├── cron-refresh.js — Nightly full-catalog sweep → Redis + Supabase snapshots + totals
│   ├── enrich.js       — Scrapes TrustMRR public page extras (AI fields, score) — 24h
│   ├── scrape-site.js  — Scrapes startup's own site (OG, tech, socials) — 7d
│   ├── warmup-sites.js — Bulk warmer for scrape-site (manual)
│   └── history.js      — ?type=mrr|revenue|price — all history series
│                         (rewrites: /api/revenue-history, /api/price-history)
└── startup/
    └── [slug].html     — Startup detail page
```

## Environment Variables (set in Vercel Dashboard)
| Variable | Description |
|----------|-------------|
| `KV_REST_API_URL` | Upstash Redis REST URL (auto-added by Upstash integration) |
| `KV_REST_API_TOKEN` | Upstash Redis token (auto-added) |
| `KV_REST_API_READ_ONLY_TOKEN` | Read-only token (auto-added) |
| `KV_URL` | Redis URL (auto-added) |
| `REDIS_URL` | Redis URL (auto-added) |
| `TRUSTMRR_API_KEY` | TrustMRR API key — get from trustmrr.com/dashboard-dev |
| `CRON_SECRET` | Secret for cron endpoint: `startup-cron-2024` |
| `SUPABASE_URL` | Supabase project URL, e.g. `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server-only, bypasses RLS |
| `SUPABASE_ANON_KEY` | Supabase anon/public key — safe to embed in client HTML |
| `LISTING_KEY_SECRET` | Secret for AES-GCM encryption of seller payment-provider API keys in `listing_requests` (e.g. `openssl rand -hex 32`). Without it requests are stored with the masked hint only |

## Key Architecture Decisions

### Caching Strategy (stale-while-revalidate)
- Redis stores each API page for **7 days** (so data always available)
- A "fresh" flag key lives for **1 hour**
- When fresh: return cached data instantly
- When stale: return cached data instantly + refresh in background
- When no cache: fetch fresh (only on first ever load)

### localStorage Cache
- Full dataset cached in browser `localStorage` with 24h TTL
- On page load: show from localStorage instantly (no loading)
- Background refresh only if cache >6 hours old
- Cache version key `sm_cache_version = v3` — bump to force-clear all browsers

### Rate Limiting
- TrustMRR allows 20 req/min
- We fetch 50 items per page with 3.2s delay between pages
- ~7000+ startups = ~140 pages = ~8 min first load (then cached forever)

### Multilanguage (7 languages)
All translations in `shared.js` in the `T` object:
- `en`, `de`, `fr`, `it`, `ru`, `zh`, `ar`
- Arabic (`ar`) uses RTL layout
- Language saved to `localStorage` key `lang`

### Routing
- `/` → `index.html`
- `/acquire.html` → buy page (only onSale startups)
- `/auth.html` → login/signup (Supabase Auth)
- `/dashboard.html` → user account + subscription
- `/startup/some-slug` → `startup/[slug].html` (via vercel.json rewrite)
- `/api/startups` → proxy to TrustMRR API with Redis cache
- `/api/startup?slug=X` → single startup proxy
- `/api/auth` → GET: access level check; POST `{slug}`: record startup view

### Access Tiers
- **Guest** (unauthenticated) → 3 startup detail views/day (tracked in localStorage)
- **User** (registered) → 8 startup detail views/day (tracked in `startup_views` DB table)
- **Subscriber** (paid) → unlimited for 1 month (`subscriptions` table)
- **Admin** → unlimited + access to `/admin.html` (set manually: `UPDATE profiles SET role='admin' WHERE id = (SELECT id FROM auth.users WHERE email='...')`)
- `GET /api/auth` returns `{ authenticated, role, viewsUsed, viewsLeft }`

## TrustMRR API
- Base URL: `https://trustmrr.com/api/v1`
- Auth: `Authorization: Bearer tmrr_...`
- Docs: `trustmrr.com/docs/api`
- Key params: `page`, `limit`, `sort`, `onSale`, `category`
- ⚠️ **Лимиты ужесточены в июле 2026** (сломали ночной свод — падал на ~12-й странице с 429):
  - **Rate limit: 10 req/min** (standard key; premium — 60/min). Было 20.
  - **`limit` режется до 10** — просишь 50, получаешь 10. Было 50.
  - Следствие: каталог (~8400 стартапов) = ~840 upstream-страниц. `scripts/refresh-catalog.js`
    ходит по 10 записей с паузой 7с (~8.5 req/min) + ретрай на 429, а затем **сшивает**
    их обратно в 50-элементные страницы под ключи `sm_page=N&limit=50&sort=revenue-desc`,
    которые ждут фронт и `api/startups.js`. Полный обход ≈ 100 мин (timeout воркфлоу 180).
  - `api/startups.js` при `limit>10` сам склеивает 5 upstream-страниц; куцый ответ
    в кэш не пишется (иначе 10-элементные страницы затирают полные 50-элементные).

## GitHub Actions
`.github/workflows/refresh-cache.yml` — runs daily at 3:00 UTC to warm up Redis cache.
Needs secret `TRUSTMRR_API_KEY` set in GitHub repo Settings → Secrets.

## Common Tasks

### Deploy
Just push to `main` branch — Vercel auto-deploys.

### Force clear all browser caches
Bump `CACHE_VERSION` constant in `index.html`:
```js
const CACHE_VERSION = 'v4'; // was v3
```

### Add a new language
1. Add entry to `T` object in `shared.js`
2. Add `<div class="lang-option">` in `buildNavHTML()` in `shared.js`

### Change cache TTL
In `api/startups.js`:
```js
const CACHE_TTL = 7 * 24 * 3600;  // how long Redis keeps data
const FRESH_TTL = 3600;            // how often background refresh runs
```

### Debug Redis
Open browser console on the site and run:
```js
fetch('/api/startups?page=1&limit=50&sort=revenue-desc', {
  headers: { Authorization: 'Bearer ' + getApiKey() }
}).then(r=>r.json()).then(console.log)
```
Check `X-Cache` header: `HIT` = fresh, `STALE` = serving old + refreshing, `MISS` = fetching fresh.

## Known Issues / TODO
- [ ] First-ever load takes ~8-10 min (waiting for all pages to load)
- [ ] GitHub Actions secret `TRUSTMRR_API_KEY` needs to be set manually in GitHub repo settings
- [ ] auth.html — login/signup page (Step 4)
- [ ] dashboard.html — user account page (Step 9)
- [ ] Supabase: run supabase-schema.sql in SQL Editor, add env vars to Vercel Dashboard
- [ ] Debug Redis: `fetch('/api/startups?page=1&limit=50').then(r=>r.json()).then(console.log)` — check `X-Cache` header
