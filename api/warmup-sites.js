// Bulk-warms the /api/scrape-site Redis cache for every onSale startup.
// User triggers this once (or schedules it) and every detail page hits
// pre-cached site data instantly thereafter.
//
// Process model:
//   - One call processes a chunk of pages (each page = 50 startups).
//   - Within a chunk, scrapes run in parallel batches against the existing
//     /api/scrape-site endpoint, which handles per-site timeout and caching.
//   - Already-cached hostnames are skipped (X-Cache: HIT).
//   - Returns a nextOffset so callers can loop until done.

const PARALLEL = 20;     // concurrent scrape-site calls
const PAGES_PER_CALL = 3; // each call covers 150 startups, ~30-45s total

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

function hostKey(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./,''); }
  catch { return null; }
}

function originFromReq(req) {
  // Compose absolute base URL so internal HTTP calls work in any Vercel env
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host  = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0];
  return `${proto}://${host}`;
}

async function scrapeOne(base, website) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(`${base}/api/scrape-site?url=${encodeURIComponent(website)}`, { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return 'fail';
    const j = await r.json();
    return j && j.data && j.data.ok ? 'ok' : 'fail';
  } catch { return 'fail'; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Optional auth — protect against random visitors triggering 1766 outbound HTTP calls.
  // If CRON_SECRET is set, require it. If not set, allow unauthenticated (dev mode).
  if (process.env.CRON_SECRET) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.CRON_SECRET}` && req.headers['x-vercel-cron'] !== '1') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const startPage = Math.max(1, parseInt(req.query.page || '1', 10));
  const force = req.query.force === '1';
  const base = originFromReq(req);

  // 1) Pull a chunk of onSale startups from our own /api/startups
  const startups = [];
  let lastPageHadMore = true;
  for (let p = startPage; p < startPage + PAGES_PER_CALL; p++) {
    try {
      const r = await fetch(`${base}/api/startups?onSale=true&page=${p}&limit=50&sort=revenue-desc`);
      if (!r.ok) break;
      const j = await r.json();
      const items = (j.data || []).filter(s => s && s.website && /^https?:\/\//i.test(s.website));
      startups.push(...items);
      lastPageHadMore = !!(j.meta && j.meta.hasMore);
      if (!lastPageHadMore) break;
    } catch { break; }
  }

  if (!startups.length) {
    return res.status(200).json({ done: true, processed: 0, nextPage: null });
  }

  // 2) Skip startups whose hostname is already cached unless force=1
  let toScrape = startups;
  if (!force) {
    const checks = await Promise.all(startups.map(async (s) => {
      const host = hostKey(s.website);
      if (!host) return null;
      const cached = await redisGet(`sm_site2_${host}`); // keep in sync with scrape-site.js cache key version
      return cached ? null : s;
    }));
    toScrape = checks.filter(Boolean);
  }

  // 3) Scrape remaining sites in parallel batches
  const counts = { ok: 0, fail: 0 };
  for (let i = 0; i < toScrape.length; i += PARALLEL) {
    const batch = toScrape.slice(i, i + PARALLEL);
    const results = await Promise.all(batch.map(s => scrapeOne(base, s.website)));
    for (const r of results) counts[r === 'ok' ? 'ok' : 'fail']++;
  }

  const nextPage = lastPageHadMore ? startPage + PAGES_PER_CALL : null;
  return res.status(200).json({
    done: !nextPage,
    pageStart: startPage,
    pagesScanned: PAGES_PER_CALL,
    discovered: startups.length,
    skippedCached: startups.length - toScrape.length,
    scraped: toScrape.length,
    ok: counts.ok,
    fail: counts.fail,
    nextPage,
  });
}
