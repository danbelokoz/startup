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
const DELAY_MS  = 3200;  // 3.2s between pages → ~18 req/min (TrustMRR limit is 20)

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
  // Prune snapshots older than 60 days (Supabase free tier hygiene).
  try {
    const cutoff = new Date(Date.now() - 60 * 86400_000).toISOString().slice(0, 10);
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

  let page = 1, totalStartups = 0, hasMore = true;
  const allStartups = [];

  while (hasMore) {
    const params   = new URLSearchParams({ page: String(page), limit: '50', sort: 'revenue-desc' });
    const cacheKey = `sm_${params.toString()}`;

    let data;
    try {
      const r = await fetch(`https://trustmrr.com/api/v1/startups?${params}`, {
        headers: { Authorization: `Bearer ${TRUSTMRR_API_KEY}` },
      });
      if (r.status === 401) { await recordParserRun('catalog', false, totalStartups, 'Неверный ключ TrustMRR API', totalStartups); process.exit(1); }
      if (!r.ok)            { await recordParserRun('catalog', false, totalStartups, `TrustMRR ${r.status} на стр. ${page}`, totalStartups); process.exit(1); }
      data = await r.json();
    } catch (err) {
      await recordParserRun('catalog', false, totalStartups, `Ошибка на стр. ${page}: ${err.message}`, totalStartups);
      process.exit(1);
    }

    // Bad/changed schema → stop before overwriting good cache, totals and snapshots.
    if (!pageLooksValid(data)) {
      await recordParserRun('catalog', false, totalStartups, `Подозрительный ответ на стр. ${page} (нет slug) — свод прерван`, totalStartups);
      process.exit(1);
    }

    await Promise.all([
      redisSet(cacheKey, data),
      redisSet(`${cacheKey}_f`, 1, FRESH_TTL),
    ]);

    const n = Array.isArray(data.data) ? data.data.length : 0;
    totalStartups += n;
    if (Array.isArray(data.data)) allStartups.push(...data.data);
    hasMore = data.meta?.hasMore ?? false;
    if (page % 10 === 0 || !hasMore) console.log(`  page ${page} · ${totalStartups} startups`);
    page++;
    if (hasMore) await sleep(DELAY_MS);
  }

  // Invalidate the onSale aggregate so the next request rebuilds from fresh data.
  try { await kv('POST', `/del/${encodeURIComponent('sm_onsale_agg_revenue-desc')}`); } catch {}

  if (allStartups.length) {
    await redisSet('sm_totals_v1', { ...computeTotals(allStartups), updatedAt: new Date().toISOString() }, 25 * 3600);
  }

  const { written, pruned } = await writeSnapshots(allStartups);
  const archived = await writeArchive(allStartups);

  console.log(`\n─────────────────────────────────────`);
  console.log(`Pages: ${page - 1} · startups: ${totalStartups} · snapshots: ${written} · archive: ${archived} · pruned: ${pruned}`);

  await recordParserRun('catalog', true, written, `${page - 1} стр. · снимков: ${written} · архив: ${archived}`, totalStartups);
}

main().catch(async (e) => {
  console.error(e);
  await recordParserRun('catalog', false, 0, e && e.message ? e.message : 'fatal error');
  process.exit(1);
});
