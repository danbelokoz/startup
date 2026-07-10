// Catalog-wide aggregate stats for the hero counters: startup count, on-sale
// count, and summed 30-day revenue / MRR across ALL startups (plus the same
// sums for the on-sale subset).
// cron-refresh recomputes and stores this after its nightly sweep; if the key
// is missing we rebuild it here by scanning the cron-warmed catalog pages in
// Redis — no upstream TrustMRR calls, so this stays free and fast.

const STATS_KEY = 'sm_totals_v1';

async function kv(method, path, body) {
  const url = `${process.env.KV_REST_API_URL}${path}`;
  const opts = { method, headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(url, opts);
  return r.json();
}

async function redisGet(key) {
  try {
    const r = await kv('GET', `/get/${encodeURIComponent(key)}`);
    if (!r.result) return null;
    const parsed = JSON.parse(r.result);
    if (parsed && parsed.value) return JSON.parse(parsed.value);
    return parsed;
  } catch { return null; }
}

async function redisSet(key, value, ttl) {
  try {
    const body = { value: JSON.stringify(value) };
    if (ttl) body.ex = ttl;
    await kv('POST', `/set/${encodeURIComponent(key)}`, body);
  } catch {}
}

function readPage(p) {
  const params = new URLSearchParams({ page: p, limit: 50, sort: 'revenue-desc' });
  return redisGet(`sm_${params.toString()}`);
}

// Rebuild the { slug: 'YYYY-MM-DD' } first-seen map straight from startup_archive (the
// durable source) when the Redis cache is cold. Mirrors scripts/refresh-catalog.js
// writeFirstSeen: explicit limit/offset paging (NOT Range headers — a mispaginated
// full-table response would otherwise never satisfy the short-page break) with a hard
// page cap so it can never loop to timeout.
async function rebuildFirstSeen() {
  const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!U || !K) return {};
  const headers = { apikey: K, Authorization: `Bearer ${K}` };
  const map = {};
  const PAGE = 1000, MAX_PAGES = 60;   // caps at 60k rows
  for (let page = 0; page < MAX_PAGES; page++) {
    let rows;
    try {
      const r = await fetch(
        `${U}/rest/v1/startup_archive?select=slug,first_seen&first_seen=not.is.null&order=slug.asc&limit=${PAGE}&offset=${page * PAGE}`,
        { headers, signal: AbortSignal.timeout(15000) },
      );
      if (!r.ok) break;
      rows = await r.json();
    } catch { break; }
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) if (row && row.slug && row.first_seen) map[row.slug] = row.first_seen;
    if (rows.length < PAGE) break;
  }
  return map;
}

// Mirror of shared.js isGmvLike (the server has no access to shared.js): gross volume
// from a MoR/marketplace platform — or a retail storefront's sales — is not the
// company's own revenue, so keep it out of the sum. Two shapes qualify:
function isGmvLike(s) {
  const r = (s && s.revenue) || {};
  const mrr  = Number(r.mrr || 0);
  const subs = Number((s && s.activeSubscriptions) || 0);
  const cust = Number((s && s.customers) || 0);
  const l30  = Number(r.last30Days || 0);
  // 1) Zero subscription footprint + a large 30-day figure = pure processed volume.
  if (mrr === 0 && subs === 0 && cust === 0 && l30 >= 100000) return true;
  // 2) Retail/e-commerce whose tiny MRR (one stray Stripe subscription) masks storefront
  //    sales: a 30-day take that dwarfs MRR (>=100x) with no customer base is gross sales
  //    volume, not recurring revenue (e.g. an online shop selling physical goods).
  if (mrr > 0 && cust === 0 && subs <= 2 && l30 >= mrr * 100 && l30 >= 25000) return true;
  return false;
}

export function computeTotals(startups) {
  const t = { total: 0, onSale: 0, rev30: 0, mrr: 0, onSaleRev30: 0, onSaleMrr: 0 };
  for (const s of startups) {
    if (!s) continue;
    // GMV-like listings still count toward the catalog/on-sale counts, but neither their
    // gross volume nor their nominal MRR belongs in the summed revenue (it isn't the
    // company's own recurring revenue).
    const gmv = isGmvLike(s);
    const rev = gmv ? 0 : ((s.revenue && s.revenue.last30Days) || 0);
    const mrr = gmv ? 0 : ((s.revenue && s.revenue.mrr) || 0);
    t.total++; t.rev30 += rev; t.mrr += mrr;
    if (s.onSale) { t.onSale++; t.onSaleRev30 += rev; t.onSaleMrr += mrr; }
  }
  t.rev30 = Math.round(t.rev30); t.mrr = Math.round(t.mrr);
  t.onSaleRev30 = Math.round(t.onSaleRev30); t.onSaleMrr = Math.round(t.onSaleMrr);
  return t;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // "Date added" map for the catalog "Added within N days" filter: { slug: 'YYYY-MM-DD' }
  // of the earliest day we saw each startup. Written nightly by scripts/refresh-catalog.js
  // (writeFirstSeen) — see supabase-first-seen-migration.sql. Served here so we don't spend
  // one of the 12 Hobby serverless slots on a dedicated endpoint.
  if ((req.query && req.query.section) === 'firstseen') {
    let fs = await redisGet('sm_first_seen_v1');
    let cache = fs ? 'HIT' : 'EMPTY';
    // Self-heal: writeFirstSeen normally stocks this key nightly, but it lives on a 26h
    // Redis TTL — a single missed or failed sweep expires it, and the catalog "Added
    // within N days" filter then silently degrades to a no-op (shows every startup). When
    // the key is cold, rebuild it from startup_archive and write it back so the filter
    // keeps working regardless of the sweep's health. The edge cache (s-maxage below)
    // caps this to roughly one rebuild per region per hour.
    if (!fs) {
      const map = await rebuildFirstSeen();
      if (Object.keys(map).length) {
        fs = { m: map, updatedAt: new Date().toISOString() };
        await redisSet('sm_first_seen_v1', fs, 26 * 3600);
        cache = 'REBUILD';
      }
    }
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Cache', cache);
    return res.status(200).json({ map: (fs && fs.m) || {}, updatedAt: (fs && fs.updatedAt) || null });
  }

  const cached = await redisGet(STATS_KEY);
  if (cached && cached.total != null) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached);
  }

  // Rebuild from the cached catalog pages, 25 parallel Redis reads per chunk.
  const all = [];
  let done = false;
  const CHUNK = 25;
  for (let start = 1; start <= 200 && !done; start += CHUNK) {
    const pages = await Promise.all(Array.from({ length: CHUNK }, (_, i) => readPage(start + i)));
    for (const pg of pages) {
      if (!pg || !Array.isArray(pg.data) || pg.data.length === 0) { done = true; break; }
      all.push(...pg.data);
      if (pg.meta && pg.meta.hasMore === false) { done = true; break; }
    }
  }

  if (!all.length) {
    // Nothing cached yet (first deploy / empty Redis) — let the client fall back.
    res.setHeader('X-Cache', 'EMPTY');
    return res.status(200).json({ total: null });
  }

  const stats = { ...computeTotals(all), updatedAt: new Date().toISOString() };
  await redisSet(STATS_KEY, stats, 25 * 3600); // safety TTL — cron rewrites it nightly
  res.setHeader('X-Cache', 'REBUILT');
  return res.status(200).json(stats);
}
