#!/usr/bin/env node
// Full catalog sweep — the "catalog" parser. Pulls every TrustMRR catalog page into
// Redis (same cache keys as api/startups.js), recomputes the hero totals, and writes
// today's per-startup snapshots to Supabase for the MRR history charts.
//
// WHY THIS RUNS IN GITHUB ACTIONS (not Vercel cron):
// The catalog is ~7400 startups = ~150 pages × 3.2s ≈ 8 minutes. Vercel Hobby caps a
// function at 60s, so the old /api/cron-refresh cron was killed mid-sweep every night
// and never recorded its run. Here there's no such limit.
//
// Env: KV_REST_API_URL, KV_REST_API_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      TRUSTMRR_API_KEY  (all already configured as repo secrets for the scrapers).

const KV_REST_API_URL          = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN        = process.env.KV_REST_API_TOKEN;
const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRUSTMRR_API_KEY         = process.env.TRUSTMRR_API_KEY;

const FRESH_TTL = 82800; // 23h freshness window — must match api/startups.js

// TrustMRR tightened its API in July 2026 and the old settings (50-item pages, 3.2s
// apart) stopped working overnight — every sweep died on ~page 12 with a 429:
//   • a standard key is now 10 req/min, not 20;
//   • ?limit= is capped at 10 — ask for 50 and you still get 10.
// So: fetch 10-item pages at ~8.5 req/min, and stitch them back into the 50-item pages
// the site's cache keys are built around (PAGE_SIZE) before writing to Redis.
const UPSTREAM_LIMIT = 10;   // hard cap on TrustMRR's side
const PAGE_SIZE      = 50;   // logical page size the frontend/api cache keys use
const DELAY_MS       = 7000; // 7s between pages → ~8.5 req/min, under the 10/min ceiling
                             // with headroom for the live site sharing the same key
const MAX_PAGES      = 2000; // hard stop (~20k startups) so a bad meta can't loop forever
const RETRY_429      = 5;    // a 429 is a wait, not a failure — back off and retry
const RETRY_WAIT_MS  = 65000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Redis (Upstash REST) — same wire format as api/_lib.js / cron-refresh.js ──────
async function kv(method, path, body) {
  const opts = { method, headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(`${KV_REST_API_URL}${path}`, opts);
  return r.json();
}
async function redisSet(key, value, ttl) {
  try {
    const body = { value: JSON.stringify(value) };
    if (ttl) body.ex = ttl;
    await kv('POST', `/set/${encodeURIComponent(key)}`, body);
  } catch {}
}

// ── Parser status for the admin "Парсеры" tab (mirrors scrape-daily-revenue.js) ───
async function recordParserStart(id) {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) return;
  try {
    await fetch(`${KV_REST_API_URL}/set/${encodeURIComponent('sm_parser_' + id + '_run')}?EX=3600`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify({ startedAt: Date.now() }) }),
    });
  } catch {}
}
async function recordParserRun(id, ok, count, note, attempted) {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) return;
  try {
    const hdr = { Authorization: `Bearer ${KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' };
    const blob = { ts: Date.now(), ok: !!ok, count: count || 0, note: String(note || '') };
    if (typeof attempted === 'number') blob.attempted = attempted; // взято в работу (vs count = обработано)
    await fetch(`${KV_REST_API_URL}/set/${encodeURIComponent('sm_parser_' + id)}`, {
      method: 'POST', headers: hdr, body: JSON.stringify({ value: JSON.stringify(blob) }),
    });
    await fetch(`${KV_REST_API_URL}/del/${encodeURIComponent('sm_parser_' + id + '_run')}`, {
      method: 'POST', headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
    }).catch(() => {});
    const logKey = 'sm_parser_' + id + '_log';
    await fetch(`${KV_REST_API_URL}/pipeline`, {
      method: 'POST', headers: hdr,
      body: JSON.stringify([
        ['LPUSH', logKey, JSON.stringify({ t: Date.now(), ok: ok ? 1 : 0, n: count || 0 })],
        ['LTRIM', logKey, '0', '999'],
        ['EXPIRE', logKey, '259200'], // 3 days
      ]),
    });
  } catch {}
}

// Catalog-wide totals for the hero stats block (served by /api/stats). Mirrors
// computeTotals in api/stats.js — kept inline so this script stays dependency-free.
function computeTotals(startups) {
  const t = { total: 0, onSale: 0, rev30: 0, mrr: 0, onSaleRev30: 0, onSaleMrr: 0 };
  for (const s of startups) {
    if (!s) continue;
    const rev = (s.revenue && s.revenue.last30Days) || 0;
    const mrr = (s.revenue && s.revenue.mrr) || 0;
    t.total++; t.rev30 += rev; t.mrr += mrr;
    if (s.onSale) { t.onSale++; t.onSaleRev30 += rev; t.onSaleMrr += mrr; }
  }
  t.rev30 = Math.round(t.rev30); t.mrr = Math.round(t.mrr);
  t.onSaleRev30 = Math.round(t.onSaleRev30); t.onSaleMrr = Math.round(t.onSaleMrr);
  return t;
}

async function writeSnapshots(allStartups) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !allStartups.length) return { written: 0, pruned: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const rows = allStartups.filter(s => s && s.slug).map(s => ({
    slug: s.slug,
    snap_date: today,
    mrr_cents:     s.revenue && s.revenue.mrr != null ? Math.round(s.revenue.mrr) : null,
    rev30d_cents:  s.revenue && s.revenue.last30Days != null ? Math.round(s.revenue.last30Days) : null,
    total_cents:   s.revenue && s.revenue.total != null ? Math.round(s.revenue.total) : null,
    customers:     s.customers ?? null,
    subscriptions: s.activeSubscriptions ?? null,
    growth30d:     s.growth30d ?? null,
    visitors_30d:  s.visitorsLast30Days ?? null,
  }));
  const headers = {
    'Content-Type': 'application/json',
    'apikey':        SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  let written = 0, pruned = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/daily_snapshots?on_conflict=slug,snap_date`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(batch),
      });
      if (r.ok) written += batch.length;
      else console.log(`  ⚠ snapshot batch ${i} → ${r.status}`);
    } catch (e) { console.log(`  ⚠ snapshot batch ${i} error: ${e.message}`); }
  }
  // Prune snapshots older than 180 days (Supabase free tier hygiene).
  try {
    const cutoff = new Date(Date.now() - 180 * 86400_000).toISOString().slice(0, 10);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/daily_snapshots?snap_date=lt.${cutoff}`, {
      method: 'DELETE',
      headers: { ...headers, 'Prefer': 'return=representation,count=exact' },
    });
    if (r.ok) { const range = r.headers.get('content-range'); if (range) pruned = parseInt(range.split('/')[1], 10) || 0; }
  } catch {}
  return { written, pruned };
}

// Persistent full snapshot per startup so detail pages survive deletion from
// TrustMRR. Upsert on slug → ONE row per startup (not per day), so this never
// grows with time; a delisted startup's row just stops updating, freezing
// last_seen at the last day we saw it. Served by api/startup.js on upstream 404.
// ~1 KB/startup → ~8 MB for the whole catalog.
async function writeArchive(allStartups) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !allStartups.length) return 0;
  const today  = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const rows = allStartups.filter(s => s && s.slug).map(s => ({
    slug: s.slug, data: s, last_seen: today, updated_at: nowIso,
  }));
  const headers = {
    'Content-Type': 'application/json',
    'apikey':        SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/startup_archive?on_conflict=slug`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(batch),
      });
      if (r.ok) written += batch.length;
      else console.log(`  ⚠ archive batch ${i} → ${r.status}`);
    } catch (e) { console.log(`  ⚠ archive batch ${i} error: ${e.message}`); }
  }
  return written;
}

// "Date added" map for the catalog "Added within N days" filter. We don't get a
// listing date from TrustMRR, so we approximate it with first_seen — the earliest
// day we saw the startup, stamped once in startup_archive (see
// supabase-first-seen-migration.sql). Read it back after the archive upsert and
// publish a compact { slug: 'YYYY-MM-DD' } blob to Redis; api/stats.js serves it to
// the catalog. ~7400 × ~40 bytes ≈ 300 KB — comfortably a single Redis value.
async function writeFirstSeen() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !KV_REST_API_URL) return 0;
  const headers = {
    'apikey':        SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const map = {};
  const PAGE = 1000, MAX_PAGES = 60;   // MAX_PAGES caps this at 60k rows — a hard stop so
                                       // a mispaginated response can never loop to timeout.
  // Page through startup_archive with explicit limit/offset (NOT Range headers — if
  // PostgREST ignores Range and returns the full table each pass, rows.length stays
  // ≥PAGE forever and the loop never terminates; limit guarantees ≤PAGE per page so the
  // short-page break is reliable). Ordered by slug so paging is stable.
  for (let page = 0; page < MAX_PAGES; page++) {
    let rows;
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/startup_archive?select=slug,first_seen&first_seen=not.is.null&order=slug.asc&limit=${PAGE}&offset=${page * PAGE}`,
        { headers, signal: AbortSignal.timeout(20000) },   // never let a hung socket stall the job
      );
      if (!r.ok) { console.log(`  ⚠ first_seen read p${page} → ${r.status}`); break; }
      rows = await r.json();
    } catch (e) { console.log(`  ⚠ first_seen read p${page} error: ${e.message}`); break; }
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) if (row && row.slug && row.first_seen) map[row.slug] = row.first_seen;
    if (rows.length < PAGE) break;
  }
  const n = Object.keys(map).length;
  if (n) await redisSet('sm_first_seen_v1', { m: map, updatedAt: new Date().toISOString() }, 26 * 3600);
  return n;
}

// Slug list for the dynamic /sitemap.xml (served by middleware.js straight from Redis).
// Kept ~26h so a single missed sweep doesn't blank the sitemap; middleware falls back to
// the main pages when the key is absent.
async function writeSitemap(allStartups) {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) return 0;
  const slugs = allStartups.filter(s => s && s.slug).map(s => s.slug);
  await redisSet('sm_sitemap_slugs', slugs, 26 * 3600);
  return slugs.length;
}

// Guards the cache/snapshots from a broken/changed upstream payload: a page is valid
// if it's an array and (when non-empty) at least half its items still carry a slug.
// An empty page is the legit end of the catalog; a page that fails this means the
// schema likely changed — we abort rather than overwrite good data with garbage.
function pageLooksValid(data) {
  if (!data || !Array.isArray(data.data)) return false;
  if (data.data.length === 0) return true;
  return data.data.filter(s => s && s.slug).length >= data.data.length * 0.5;
}

async function main() {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) { console.error('KV_REST_API_* not set'); process.exit(1); }
  if (!TRUSTMRR_API_KEY) { console.error('TRUSTMRR_API_KEY not set'); await recordParserRun('catalog', false, 0, 'Нет ключа TrustMRR API'); process.exit(1); }

  console.log('Catalog refresh — full sweep\n');
  await recordParserStart('catalog');

  let page = 1, totalStartups = 0, hasMore = true, upstreamTotal = 0, capped = false;
  const allStartups = [];
  const seen = new Set();

  while (hasMore && page <= MAX_PAGES) {
    const params = new URLSearchParams({ page: String(page), limit: String(UPSTREAM_LIMIT), sort: 'revenue-desc' });

    let data = null;
    for (let attempt = 0; attempt <= RETRY_429; attempt++) {
      try {
        const r = await fetch(`https://trustmrr.com/api/v1/startups?${params}`, {
          headers: { Authorization: `Bearer ${TRUSTMRR_API_KEY}` },
        });
        if (r.status === 401) { await recordParserRun('catalog', false, totalStartups, 'Неверный ключ TrustMRR API', totalStartups); process.exit(1); }
        if (r.status === 429) {
          if (attempt === RETRY_429) { await recordParserRun('catalog', false, totalStartups, `TrustMRR 429 на стр. ${page} — лимит не отпустил после ${RETRY_429} попыток`, totalStartups); process.exit(1); }
          console.log(`  ⏳ 429 на стр. ${page} — пауза ${RETRY_WAIT_MS / 1000}с (попытка ${attempt + 1}/${RETRY_429})`);
          await sleep(RETRY_WAIT_MS);
          continue;
        }
        if (!r.ok) { await recordParserRun('catalog', false, totalStartups, `TrustMRR ${r.status} на стр. ${page}`, totalStartups); process.exit(1); }
        data = await r.json();
        break;
      } catch (err) {
        if (attempt === RETRY_429) {
          await recordParserRun('catalog', false, totalStartups, `Ошибка на стр. ${page}: ${err.message}`, totalStartups);
          process.exit(1);
        }
        console.log(`  ⏳ сеть упала на стр. ${page} (${err.message}) — повтор через ${RETRY_WAIT_MS / 1000}с`);
        await sleep(RETRY_WAIT_MS);
      }
    }

    // Bad/changed schema → stop before overwriting good cache, totals and snapshots.
    if (!pageLooksValid(data)) {
      await recordParserRun('catalog', false, totalStartups, `Подозрительный ответ на стр. ${page} (нет slug) — свод прерван`, totalStartups);
      process.exit(1);
    }

    // Clamp detection: past ~200 startups TrustMRR stops paging and repeats the last
    // slice with hasMore:true forever (the standard-key gate). Keep only slugs we
    // haven't seen; the first page that adds nothing new is the wall — stop there
    // instead of looping to MAX_PAGES (which is what timed the sweep out at 180 min).
    const batch = Array.isArray(data.data) ? data.data : [];
    const fresh = batch.filter(s => s && s.slug && !seen.has(s.slug));
    for (const s of fresh) seen.add(s.slug);
    if (data.meta?.total) upstreamTotal = data.meta.total;
    if (fresh.length === 0) { capped = true; console.log(`  ⛔ API перестал отдавать новое на стр. ${page} (гейт ~${totalStartups} стартапов) — обход остановлен`); break; }
    totalStartups += fresh.length;
    allStartups.push(...fresh);
    hasMore = data.meta?.hasMore ?? false;
    if (page % 25 === 0 || !hasMore) console.log(`  page ${page} · ${totalStartups} startups`);
    page++;
    if (hasMore) await sleep(DELAY_MS);
  }

  // If the API served far fewer than it claims to have (the 200-cap), this run can only
  // refresh the reachable top slice. Write those pages, but DON'T let a truncated set
  // clobber the catalog-wide aggregates (hero totals) or shrink the sitemap — the
  // remaining startups stay served from the existing (pre-cap) cache.
  const partial = capped || (upstreamTotal && allStartups.length < upstreamTotal * 0.5);

  // Stitch the 10-item upstream pages back into the 50-item pages every cache key on the
  // site is keyed by (`sm_page=N&limit=50&sort=revenue-desc` — same shape api/startups.js
  // builds from the query). Written only after the whole sweep succeeds, so a run that
  // dies halfway leaves yesterday's complete cache untouched rather than a partial one.
  const total = upstreamTotal || allStartups.length;
  let pagesWritten = 0;
  for (let i = 0; i < allStartups.length; i += PAGE_SIZE) {
    const pageNo   = i / PAGE_SIZE + 1;
    const slice    = allStartups.slice(i, i + PAGE_SIZE);
    const cacheKey = `sm_${new URLSearchParams({ page: String(pageNo), limit: String(PAGE_SIZE), sort: 'revenue-desc' })}`;
    const payload  = { data: slice, meta: { total, page: pageNo, limit: PAGE_SIZE, hasMore: i + slice.length < allStartups.length } };
    await Promise.all([
      redisSet(cacheKey, payload),
      redisSet(`${cacheKey}_f`, 1, FRESH_TTL),
    ]);
    pagesWritten++;
  }
  console.log(`  cached ${pagesWritten} × ${PAGE_SIZE}-item pages`);

  // Invalidate the onSale aggregate so the next request rebuilds from fresh data.
  try { await kv('POST', `/del/${encodeURIComponent('sm_onsale_agg_revenue-desc')}`); } catch {}

  // Hero totals: only recompute from a FULL sweep. A 200-item partial would report the
  // catalog as tiny; keep the last good totals instead.
  if (allStartups.length && !partial) {
    await redisSet('sm_totals_v1', { ...computeTotals(allStartups), updatedAt: new Date().toISOString() }, 25 * 3600);
  } else if (partial) {
    console.log('  ⚠ totals НЕ перезаписаны — набор урезан API-гейтом, оставлены прежние');
  }

  const { written, pruned } = await writeSnapshots(allStartups);
  const archived = await writeArchive(allStartups);
  const firstSeen = await writeFirstSeen();   // after archive: new rows exist before we read back
  // Sitemap: a partial run would drop 8000+ URLs. Only rewrite it from a full sweep.
  const sitemapCount = partial ? -1 : await writeSitemap(allStartups);

  console.log(`\n─────────────────────────────────────`);
  console.log(`Upstream pages: ${page - 1} · cached pages: ${pagesWritten} · startups: ${totalStartups}${partial ? ` (частично — API-гейт ~${upstreamTotal})` : ''} · snapshots: ${written} · archive: ${archived} · firstSeen: ${firstSeen} · pruned: ${pruned} · sitemap: ${sitemapCount}`);

  const note = partial
    ? `⚠ API отдал только ${totalStartups} из ~${upstreamTotal} (гейт TrustMRR ~200) — обновлён топ, остальное сохранено из старого кэша`
    : `${page - 1} стр. по ${UPSTREAM_LIMIT} → ${pagesWritten} стр. кэша · снимков: ${written} · архив: ${archived} · sitemap: ${sitemapCount}`;
  // Partial-but-clean is not a failure — it did everything the API allows. ok:true so the
  // admin card stays green, but the note makes the cap explicit.
  await recordParserRun('catalog', true, written, note, totalStartups);
}

main().catch(async (e) => {
  console.error(e);
  await recordParserRun('catalog', false, 0, e && e.message ? e.message : 'fatal error');
  process.exit(1);
});
