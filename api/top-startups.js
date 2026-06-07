// Scrapes the "Top growing startups" leaderboard from the TrustMRR homepage
// RSC payload (the same one their /championship page links to) and returns
// a normalised array of the fastest growers. Cached 4 hours in Redis.

const CACHE_TTL = 4 * 3600;

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

// Walks RSC pushes, decodes each payload, and pulls every startup object that
// has both a slug and a cachedGrowth30d field. Strongest signal of "fast grower".
function extractTopStartups(html, limit) {
  const items = [];
  const seen = new Set();
  const re = /self\.__next_f\.push\(\[\d+,(".+?")\]\)/gs;
  let m;
  while ((m = re.exec(html)) !== null) {
    let decoded;
    try { decoded = JSON.parse(m[1]); } catch { continue; }
    // Find every object that contains both "cachedGrowth30d" and "slug" within
    // a reasonable window by walking matched balanced braces.
    const re2 = /\{[^{}]{0,1500}"cachedGrowth30d":([\-\d.]+|null)[^{}]{0,1500}\}/g;
    let m2;
    while ((m2 = re2.exec(decoded)) !== null) {
      const chunk = m2[0];
      const slug   = (chunk.match(/"slug":"([^"]+)"/) || [])[1];
      const name   = (chunk.match(/"name":"([^"]+)"/) || [])[1];
      const iconU  = (chunk.match(/"icon":"([^"]+)"/) || [])[1];
      const growth = parseFloat(m2[1]);
      const mrr    = parseFloat((chunk.match(/"currentMrr":([\-\d.]+)/) || [])[1] || 'NaN');
      const rev30  = parseFloat((chunk.match(/"currentLast30DaysRevenue":([\-\d.]+)/) || [])[1] || 'NaN');
      if (!slug || !name || isNaN(growth)) continue;
      if (seen.has(slug)) continue;
      seen.add(slug);
      items.push({
        slug, name,
        icon:   iconU || null,
        growth30d: growth,
        mrrCents:    isNaN(mrr)   ? null : Math.round(mrr),
        rev30dCents: isNaN(rev30) ? null : Math.round(rev30),
      });
    }
  }
  items.sort((a, b) => b.growth30d - a.growth30d);
  return items.slice(0, limit || 12);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const limit = Math.min(50, parseInt(req.query.limit || '12', 10) || 12);
  const cacheKey = `sm_top_startups_v1`;
  const cached = await redisGet(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ data: cached.slice(0, limit) });
  }

  try {
    const r = await fetch('https://trustmrr.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MRRketBot/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return res.status(200).json({ data: [], note: 'fetch_failed_' + r.status });
    const html = await r.text();
    const top = extractTopStartups(html, 50);
    if (top.length) await redisSet(cacheKey, top, CACHE_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=14400, stale-while-revalidate=86400');
    return res.status(200).json({ data: top.slice(0, limit) });
  } catch (e) {
    return res.status(200).json({ data: [], note: e && e.message || 'parse_error' });
  }
}
