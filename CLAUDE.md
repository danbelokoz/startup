# StartupMarket — Project Context for Claude Code

## What is this project
A startup marketplace website that proxies data from TrustMRR API (trustmrr.com).
Users can browse, search and filter verified startups with real MRR metrics.
Deployed on Vercel at: https://startup-silk-nu.vercel.app

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
├── shared.js           — Shared translations (7 langs), utilities, nav/modal HTML builders
├── shared.css          — Shared styles (light theme)
├── vercel.json         — Routing + cron config
├── api/
│   ├── startups.js     — Main proxy API with Redis stale-while-revalidate cache
│   ├── startup.js      — Single startup detail proxy
│   └── cron-refresh.js — Daily cache refresh (GitHub Actions triggers this)
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
- `/startup/some-slug` → `startup/[slug].html` (via vercel.json rewrite)
- `/api/startups` → proxy to TrustMRR API with Redis cache
- `/api/startup?slug=X` → single startup proxy

## TrustMRR API
- Base URL: `https://trustmrr.com/api/v1`
- Auth: `Authorization: Bearer tmrr_...`
- Docs: `trustmrr.com/docs/api`
- Key params: `page`, `limit` (max 50), `sort`, `onSale`, `category`
- Rate limit: 20 req/min

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
- [ ] Startup detail page: loads from sessionStorage if navigated from catalog, falls back to API
- [ ] First-ever load takes ~8-10 min (waiting for all pages to load)
- [ ] `acquire.html` page referenced in nav but not yet created
- [ ] GitHub Actions secret `TRUSTMRR_API_KEY` needs to be set manually in GitHub repo settings
