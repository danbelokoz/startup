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
// find "askingPriceHistory":[{...},{...}].
function extractAskingPriceHistory(html) {
  const re = /self\.__next_f\.push\(\[\d+,(".+?")\]\)/gs;
  let best = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    let decoded;
    try { decoded = JSON.parse(m[1]); } catch { continue; }
    const idx = decoded.indexOf('"askingPriceHistory":[');
    if (idx === -1) continue;
    // Walk balanced brackets starting at the '[' after the key
    let p = decoded.indexOf('[', idx);
    let depth = 0;
    for (let i = p; i < decoded.length; i++) {
      const c = decoded[i];
      if (c === '[') depth++;
      else if (c === ']') {
        depth--;
        if (depth === 0) {
          try {
            const arr = JSON.parse(decoded.slice(p, i + 1));
            if (Array.isArray(arr) && arr.length > best.length) best = arr;
          } catch {}
          break;
        }
      }
    }
  }
  return best;
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
    const history = extractAskingPriceHistory(html)
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
