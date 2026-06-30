// Historical series for a startup — one endpoint, three sources:
//   ?type=mrr     (default) — daily metric snapshots from Supabase (written by cron-refresh)
//   ?type=revenue           — revenue earned per day, from Supabase (written by the
//                             GitHub Actions Puppeteer scraper, twice daily)
//   ?type=price             — asking-price history scraped live from the public
//                             trustmrr.com page (1h Redis cache)
//
// /api/revenue-history and /api/price-history are rewritten here by vercel.json,
// so old clients keep working. Merged into one function to stay inside the
// Vercel Hobby limit of 12 serverless functions.

import { redisGet, redisSet, clientIp, rateOk } from './_lib.js';

const PRICE_CACHE_TTL = 3600; // 1 hour

// TrustMRR's RSC payload looks like:
//   self.__next_f.push([1,"...escaped JSON..."])
// JSON.parse on the second arg un-escapes it. Inside the decoded string we
// find a startup object with "slug":"<slug>" and "askingPriceHistory":[...].
// Multiple startups can appear on the page (main + sidebar of similar startups),
// so we anchor on the requested slug to pick the right array.
function extractAskingPriceHistory(html, slug) {
  const re = /self\.__next_f\.push\(\[\d+,(".+?")\]\)/gs;
  const slugMarker = `"slug":"${slug}"`;
  const candidates = []; // {arr, dist}
  let m;
  while ((m = re.exec(html)) !== null) {
    let decoded;
    try { decoded = JSON.parse(m[1]); } catch { continue; }

    let searchFrom = 0;
    while (true) {
      const idx = decoded.indexOf('"askingPriceHistory":[', searchFrom);
      if (idx === -1) break;
      // Walk balanced brackets to extract the JSON array
      const open = decoded.indexOf('[', idx);
      let depth = 0, end = -1;
      for (let i = open; i < decoded.length; i++) {
        const c = decoded[i];
        if (c === '[') depth++;
        else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end === -1) break;
      let arr;
      try { arr = JSON.parse(decoded.slice(open, end + 1)); } catch { searchFrom = end + 1; continue; }
      if (Array.isArray(arr)) {
        const before = decoded.lastIndexOf(slugMarker, idx);
        const after  = decoded.indexOf(slugMarker, idx);
        let dist = Infinity;
        if (before !== -1) dist = Math.min(dist, idx - before);
        if (after  !== -1) dist = Math.min(dist, after - idx);
        candidates.push({ arr, dist });
      }
      searchFrom = end + 1;
    }
  }
  if (!candidates.length) return [];
  candidates.sort((a, b) => a.dist - b.dist);
  const owned = candidates.find(c => c.dist !== Infinity);
  if (owned) return owned.arr;
  return candidates.find(c => c.arr.length) ? candidates.find(c => c.arr.length).arr : [];
}

async function priceHistory(slug, res) {
  const cacheKey = `sm_price_hist_${slug}`;
  const cached = await redisGet(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ data: cached });
  }

  try {
    const r = await fetch(`https://trustmrr.com/startup/${encodeURIComponent(slug)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StartupMarketBot/1.0)' },
    });
    if (!r.ok) return res.status(200).json({ data: [], note: 'fetch_failed_' + r.status });
    const html = await r.text();
    const history = extractAskingPriceHistory(html, slug)
      .map(p => ({ price: p.price, createdAt: p.createdAt }))
      .filter(p => p.price != null && p.createdAt)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    await redisSet(cacheKey, history, PRICE_CACHE_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ data: history });
  } catch {
    return res.status(200).json({ data: [], note: 'parse_error' });
  }
}

async function supaSeries(url, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(200).json({ data: [], note: 'history_not_configured' });
  }
  try {
    const r = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
    });
    if (!r.ok) return res.status(200).json({ data: [], note: 'history_error' });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ data });
  } catch {
    return res.status(200).json({ data: [], note: 'history_error' });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Per-IP rate limit (fail-open). A detail page fires a few series at once, so the
  // budget is generous; the price type also scrapes trustmrr live, hence a guard.
  if (!(await rateOk('hist', clientIp(req), 150, 60))) {
    res.setHeader('Retry-After', '30');
    return res.status(429).json({ error: 'Too many requests' });
  }

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });
  const type = req.query.type || 'mrr';

  if (type === 'price') return priceHistory(slug, res);

  if (type === 'revenue') {
    const days = Math.min(parseInt(req.query.days || '180', 10) || 180, 400);
    // Filter by date window (not limit) so we always return the MOST RECENT N
    // days, ascending. limit is just an upper safety bound.
    const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
    const url = `${process.env.SUPABASE_URL}/rest/v1/daily_revenue`
      + `?slug=eq.${encodeURIComponent(slug)}`
      + `&rev_date=gte.${cutoff}`
      + `&order=rev_date.asc`
      + `&limit=400`;
    return supaSeries(url, res);
  }

  // default: daily MRR/metrics snapshots. Filter by a date window (not a bare
  // limit) so we return the MOST RECENT N days. A plain order=asc&limit=days
  // returns the OLDEST N — once a startup accumulates >days snapshots its chart
  // would freeze at day N and look stale. limit is just an upper safety bound.
  const days = Math.min(parseInt(req.query.days || '90', 10) || 90, 365);
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const url = `${process.env.SUPABASE_URL}/rest/v1/daily_snapshots`
    + `?slug=eq.${encodeURIComponent(slug)}`
    + `&snap_date=gte.${cutoff}`
    + `&order=snap_date.asc`
    + `&limit=400`;
  return supaSeries(url, res);
}
