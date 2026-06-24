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
