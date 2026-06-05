// Stale-while-revalidate pattern
// Cache: stored permanently in Redis (no TTL). Freshness flag: 23 hours.
// Returns stale data instantly + triggers background update when stale.
// Cron refreshes at 3am daily — data stays fresh all day.

const FRESH_TTL = 82800;           // 23 hour freshness window — cron refreshes at 3am

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
    // Handle case where Redis returns {value: '...', ex: N}
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

async function fetchTrustMRR(params, apiKey) {
  const r = await fetch(`https://trustmrr.com/api/v1/startups?${params}`, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (r.status === 401) throw new Error('401');
  if (!r.ok) throw new Error('upstream_' + r.status);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.TRUSTMRR_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server not configured' });

  const params = new URLSearchParams(req.query);
  const cacheKey = `sm_${params.toString()}`;
  const freshKey = `${cacheKey}_f`;

  const [cached, isFresh] = await Promise.all([redisGet(cacheKey), redisGet(freshKey)]);

  // Case 1: fresh cache — instant return
  if (cached && isFresh) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ ...cached, fromCache: true });
  }

  // Case 2: stale cache — return immediately, update in background
  if (cached && !isFresh) {
    res.setHeader('X-Cache', 'STALE');
    // Send stale response right away
    res.status(200).json({ ...cached, fromCache: true, stale: true });
    // Background refresh — runs after response sent
    // Vercel keeps function alive briefly after res.end() for cleanup
    try {
      const fresh = await fetchTrustMRR(params, apiKey);
      await Promise.all([
        redisSet(cacheKey, fresh),
        redisSet(freshKey, 1, FRESH_TTL)
      ]);
    } catch {}
    return;
  }

  // Case 3: no cache — must fetch and wait
  try {
    const data = await fetchTrustMRR(params, apiKey);
    await Promise.all([
      redisSet(cacheKey, data),
      redisSet(freshKey, 1, FRESH_TTL)
    ]);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json({ ...data, fromCache: false });
  } catch (err) {
    // Fallback: upstream dead. If this was an onSale=true request, try the
    // wider (no-onSale) cache key and filter onSale items out of it so the
    // home page keeps working from cron-warmed data.
    if (params.get('onSale') === 'true') {
      const fbParams = new URLSearchParams(params);
      fbParams.delete('onSale');
      const fbCached = await redisGet(`sm_${fbParams.toString()}`);
      if (fbCached && Array.isArray(fbCached.data)) {
        const filtered = {
          ...fbCached,
          data: fbCached.data.filter(s => s && s.onSale)
        };
        res.setHeader('X-Cache', 'STALE-FALLBACK');
        return res.status(200).json({ ...filtered, fromCache: true, stale: true });
      }
    }
    if (err.message === '401') return res.status(503).json({ error: 'Upstream API error' });
    return res.status(500).json({ error: err.message });
  }
}
