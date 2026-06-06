// Scrapes asking-price history from the public trustmrr.com startup page.
// TrustMRR's official API doesn't expose this, but the public detail page
// embeds it in the Next.js RSC payload. We parse it out and cache 1h in Redis.

const CACHE_TTL = 3600; // 1 hour

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

// TrustMRR's RSC payload looks like:
//   self.__next_f.push([1,"...escaped JSON..."])
// JSON.parse on the second arg un-escapes it. Inside the decoded string we
// find a startup object with "slug":"<slug>" and "askingPriceHistory":[...].
// Multiple startups can appear on the page (main + sidebar of similar startups),
// so we anchor on the requested slug to pick the right array.
function extractAskingPriceHistory(html, slug) {
  const re = /self\.__next_f\.push\(\[\d+,(".+?")\]\)/gs;
  const slugMarker = `"slug":"${slug}"`;
  const candidates = []; // {arr, distFromOwnerSlug}
  let m;
  while ((m = re.exec(html)) !== null) {
    let decoded;
    try { decoded = JSON.parse(m[1]); } catch { continue; }

    // Find every askingPriceHistory occurrence in this push
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
        // Find the nearest owner slug marker (within ±8000 chars).
        // We look for `"slug":"X"` where X is not a tech-stack entry.
        // A reliable approximation: anchor on the exact `"slug":"<requested>"` string.
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
  // Prefer arrays anchored to the requested slug. If none, fall back to the
  // first non-empty array (TrustMRR loads the main startup first in the RSC).
  candidates.sort((a, b) => a.dist - b.dist);
  const owned = candidates.find(c => c.dist !== Infinity);
  if (owned) return owned.arr;
  return candidates.find(c => c.arr.length) ? candidates.find(c => c.arr.length).arr : [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  const cacheKey = `sm_price_hist_${slug}`;
  const cached = await redisGet(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ data: cached });
  }

  try {
    const r = await fetch(`https://trustmrr.com/startup/${encodeURIComponent(slug)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MRRketBot/1.0)' },
    });
    if (!r.ok) return res.status(200).json({ data: [], note: 'fetch_failed_' + r.status });
    const html = await r.text();
    const history = extractAskingPriceHistory(html, slug)
      .map(p => ({ price: p.price, createdAt: p.createdAt }))
      .filter(p => p.price != null && p.createdAt)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    await redisSet(cacheKey, history, CACHE_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ data: history });
  } catch (e) {
    return res.status(200).json({ data: [], note: 'parse_error' });
  }
}
