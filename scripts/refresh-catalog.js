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

// …and a third gate found later: pagination only ever reaches the FIRST 200 startups of
// any given query. Past that the API repeats the last slice with hasMore:true forever.
// The catalog (8400) is therefore unreachable in one pass — but each SORT is its own
// 200-item window, and they only partly overlap. So we harvest several windows and treat
// `startup_archive` as the source of truth, rebuilding the Redis pages from it.
const WINDOW_MAX_PAGES = 25;  // 200 items ÷ 10 = 20 pages; clamp detection stops earlier

// The on-sale windows the detector harvests. On-sale listings are the marketplace's
// actual inventory, so a startup matters to us exactly when it goes up for sale — a
// newcomer that isn't listed yet gets picked up by the same sweep once it is.
const DETECT_WINDOWS = [
  { sort: 'revenue-desc', label: 'на продаже · выручка ↓' },
  { sort: 'revenue-asc',  label: 'на продаже · выручка ↑' },
  { sort: 'price-desc',   label: 'на продаже · цена ↓'    },
  { sort: 'price-asc',    label: 'на продаже · цена ↑'    },
  { sort: 'growth-desc',  label: 'на продаже · рост ↓'    },
];
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

// One upstream page, with the retries that keep a shared 10 req/min quota survivable.
// Throws on anything unrecoverable; a 429 is a wait, not a failure.
async function fetchPage(params, label, page) {
  for (let attempt = 0; attempt <= RETRY_429; attempt++) {
    try {
      const r = await fetch(`https://trustmrr.com/api/v1/startups?${params}`, {
        headers: { Authorization: `Bearer ${TRUSTMRR_API_KEY}` },
      });
      if (r.status === 401) throw new Error('Неверный ключ TrustMRR API');
      if (r.status === 429) {
        if (attempt === RETRY_429) throw new Error(`429 на «${label}» стр. ${page} — лимит не отпустил за ${RETRY_429} попыток`);
        console.log(`  ⏳ 429 (${label}, стр. ${page}) — пауза ${RETRY_WAIT_MS / 1000}с (${attempt + 1}/${RETRY_429})`);
        await sleep(RETRY_WAIT_MS);
        continue;
      }
      if (!r.ok) throw new Error(`TrustMRR ${r.status} на «${label}» стр. ${page}`);
      return await r.json();
    } catch (err) {
      if (/Неверный ключ|лимит не отпустил|TrustMRR \d/.test(err.message) || attempt === RETRY_429) throw err;
      console.log(`  ⏳ сеть упала (${label}, стр. ${page}): ${err.message} — повтор через ${RETRY_WAIT_MS / 1000}с`);
      await sleep(RETRY_WAIT_MS);
    }
  }
  throw new Error(`Не удалось получить «${label}» стр. ${page}`);
}

// Walk one 200-item window (a sort, optionally filtered to on-sale) to its end. Stops at
// the clamp — the first page that introduces no new slug — so we never spin on repeated
// data. Returns only unique startups, in API order.
async function crawlWindow({ sort, onSale = false, label }) {
  const items = [];
  const seen  = new Set();
  let page = 1, hasMore = true, upstreamTotal = 0;

  while (hasMore && page <= WINDOW_MAX_PAGES) {
    const qs = { page: String(page), limit: String(UPSTREAM_LIMIT), sort };
    if (onSale) qs.onSale = 'true';
    const data = await fetchPage(new URLSearchParams(qs), label, page);

    // Bad/changed schema → bail out rather than feed garbage into the archive.
    if (!pageLooksValid(data)) throw new Error(`Подозрительный ответ (${label}, стр. ${page}) — нет slug`);

    if (data.meta?.total) upstreamTotal = data.meta.total;
    const batch = Array.isArray(data.data) ? data.data : [];
    const fresh = batch.filter(s => s && s.slug && !seen.has(s.slug));
    for (const s of fresh) seen.add(s.slug);
    if (fresh.length === 0) break;              // clamped: the API is repeating itself
    items.push(...fresh);

    hasMore = data.meta?.hasMore ?? false;
    page++;
    if (hasMore && page <= WINDOW_MAX_PAGES) await sleep(DELAY_MS);
  }
  console.log(`  · ${label}: ${items.length} шт.`);
  return { items, upstreamTotal };
}

// The full catalog as we know it — one row per startup, ~8400 of them. This is the
// source of truth the Redis pages get rebuilt from, so a partial read must be detectable:
// writing pages from half an archive would silently truncate the catalog.
async function readArchive() {
  const map = new Map();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { map, complete: false };
  const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
  const PAGE = 1000, MAX_PAGES_READ = 40;
  for (let p = 0; p < MAX_PAGES_READ; p++) {
    let rows;
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/startup_archive?select=slug,data&order=slug.asc&limit=${PAGE}&offset=${p * PAGE}`,
        { headers, signal: AbortSignal.timeout(60000) },
      );
      if (!r.ok) { console.log(`  ⚠ архив: чтение p${p} → ${r.status}`); return { map, complete: false }; }
      rows = await r.json();
    } catch (e) { console.log(`  ⚠ архив: чтение p${p} — ${e.message}`); return { map, complete: false }; }
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) if (row && row.slug && row.data) map.set(row.slug, row.data);
    if (rows.length < PAGE) break;
  }
  return { map, complete: true };
}

// Listings api/startups.js hides at read time: delisted "zombies" (the dead_startups
// deny-list) and TrustMRR placeholder stubs. The archive keeps them — it never deletes —
// so the rebuild has to apply the SAME filter. Otherwise the hero totals count rows the
// catalog refuses to show, and the two numbers disagree on screen.
async function readDeadSet() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Set();
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/dead_startups?select=slug`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return new Set();
    const rows = await r.json();
    return Array.isArray(rows) ? new Set(rows.map(x => x && x.slug)) : new Set();
  } catch { return new Set(); }
}

// Mirrors isTrustmrrStub in api/startups.js — a listing whose only link points back at
// trustmrr.com (or has no real dotted hostname) can't be verified by a buyer.
function isStub(s) {
  if (!s) return false;
  const w = String(s.website || '').trim().toLowerCase();
  if (w.includes('trustmrr')) return true;
  if (w) {
    const host = w.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[\/?#]/)[0];
    if (host && !host.includes('.')) return true;
  }
  return String(s.description || '').toLowerCase().includes('trustmrr');
}

// Rebuild the catalog pages Redis serves straight from the archive — no API involved, so
// it isn't bound by the 200-item gate. Same key shape the frontend asks for
// (catalog.html only ever requests sort=revenue-desc and re-sorts client-side).
async function rebuildCatalog(map) {
  const dead = await readDeadSet();
  const raw  = [...map.values()].filter(s => s && s.slug);
  // Fail open on a suspiciously large deny-list — never risk emptying the catalog.
  const useDead = dead.size > 0 && dead.size < raw.length * 0.5;
  const all = raw.filter(s => !(useDead && dead.has(s.slug)) && !isStub(s));
  const dropped = raw.length - all.length;
  if (dropped) console.log(`  отсеяно ${dropped} (мёртвые/пустышки) — как это делает и сам сайт`);
  const rev = s => (s.revenue && s.revenue.last30Days) || 0;
  all.sort((a, b) => rev(b) - rev(a));

  let pages = 0;
  for (let i = 0; i < all.length; i += PAGE_SIZE) {
    const pageNo   = i / PAGE_SIZE + 1;
    const slice    = all.slice(i, i + PAGE_SIZE);
    const cacheKey = `sm_${new URLSearchParams({ page: String(pageNo), limit: String(PAGE_SIZE), sort: 'revenue-desc' })}`;
    await Promise.all([
      redisSet(cacheKey, { data: slice, meta: { total: all.length, page: pageNo, limit: PAGE_SIZE, hasMore: i + slice.length < all.length } }),
      redisSet(`${cacheKey}_f`, 1, FRESH_TTL),
    ]);
    pages++;
  }
  // Fresh flags above also stop the live proxy from going upstream for these pages at
  // all — which is what was fetching (and caching) clamped data.
  await redisSet('sm_totals_v1', { ...computeTotals(all), updatedAt: new Date().toISOString() }, 25 * 3600);
  const sitemap = await writeSitemap(all);
  try { await kv('POST', `/del/${encodeURIComponent('sm_onsale_agg_revenue-desc')}`); } catch {}
  return { pages, count: all.length, sitemap };
}

async function main() {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) { console.error('KV_REST_API_* not set'); process.exit(1); }
  if (!TRUSTMRR_API_KEY) { console.error('TRUSTMRR_API_KEY not set'); await recordParserRun('catalog', false, 0, 'Нет ключа TrustMRR API'); process.exit(1); }

  console.log('Catalog refresh — свод + детектор новых листингов\n');
  await recordParserStart('catalog');

  // ── Фаза 0: что мы уже знаем ────────────────────────────────────────────────
  // Read first: the slugs present BEFORE this run are what "new" is measured against.
  const { map: catalog, complete: archiveOk } = await readArchive();
  const knownBefore = new Set(catalog.keys());
  console.log(`Архив: ${knownBefore.size} стартапов${archiveOk ? '' : ' ⚠ прочитан НЕ полностью'}\n`);

  const refreshed = new Map();   // slug → свежие данные, накопленные за все фазы
  const absorb = (arr) => { for (const s of arr) if (s && s.slug) { refreshed.set(s.slug, s); catalog.set(s.slug, s); } };

  // ── Фаза 1: топ каталога ────────────────────────────────────────────────────
  console.log('Фаза 1 — топ каталога (revenue-desc):');
  const top = await crawlWindow({ sort: 'revenue-desc', label: 'каталог · выручка ↓' });
  absorb(top.items);
  const upstreamTotal = top.upstreamTotal;

  // ── Фаза 2: детектор ────────────────────────────────────────────────────────
  // Each sort is its own 200-item window into the on-sale set; overlapping them reaches
  // far more than any single one. A failure here must not cost us phase 1's work.
  console.log('\nФаза 2 — детектор новых листингов (на продаже):');
  let detectorNote = '';
  try {
    for (const w of DETECT_WINDOWS) {
      await sleep(DELAY_MS);
      const { items } = await crawlWindow({ ...w, onSale: true });
      absorb(items);
    }
  } catch (e) {
    detectorNote = ` · детектор прерван: ${e.message}`;
    console.log(`  ⚠ детектор прерван: ${e.message} — продолжаем с тем, что собрали`);
  }

  const newSlugs = [...refreshed.keys()].filter(s => !knownBefore.has(s));
  console.log(`\nОсвежено: ${refreshed.size} · НОВЫХ: ${newSlugs.length}${newSlugs.length ? ' → ' + newSlugs.slice(0, 10).join(', ') + (newSlugs.length > 10 ? ' …' : '') : ''}`);

  // ── Фаза 3: запись и пересборка каталога ────────────────────────────────────
  const fresh = [...refreshed.values()];
  const { written, pruned } = await writeSnapshots(fresh);
  const archived  = await writeArchive(fresh);
  const firstSeen = await writeFirstSeen();   // after archive: new rows exist before we read back

  // Rebuild the whole catalog from the archive — the only path that isn't capped at 200.
  // Skipped on a partial archive read: truncated pages would erase thousands of startups.
  let rebuilt = null;
  if (archiveOk && catalog.size >= knownBefore.size) {
    rebuilt = await rebuildCatalog(catalog);
    console.log(`\nПересобрано из архива: ${rebuilt.pages} стр. × ${PAGE_SIZE} · ${rebuilt.count} стартапов · sitemap ${rebuilt.sitemap}`);
  } else {
    console.log('\n⚠ пересборка пропущена — архив прочитан не полностью, страницы оставлены прежними');
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Освежено: ${refreshed.size} · новых: ${newSlugs.length} · снимков: ${written} · архив: ${archived} · firstSeen: ${firstSeen} · pruned: ${pruned}`);

  const note = `новых: ${newSlugs.length} · освежено: ${refreshed.size}`
    + (rebuilt ? ` · каталог пересобран: ${rebuilt.count} в ${rebuilt.pages} стр.` : ' · ⚠ пересборка пропущена')
    + (upstreamTotal ? ` · в TrustMRR ~${upstreamTotal}` : '')
    + detectorNote;
  await recordParserRun('catalog', true, refreshed.size, note, refreshed.size);
}

main().catch(async (e) => {
  console.error(e);
  await recordParserRun('catalog', false, 0, e && e.message ? e.message : 'fatal error');
  process.exit(1);
});
