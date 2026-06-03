// Stale-while-revalidate pattern
// Cache: 7 days in Redis. Freshness flag: 1 hour.
// Returns stale data instantly + triggers background update when stale.

const CACHE_TTL = 7 * 24 * 3600;  // 7 days — always have data
const FRESH_TTL = 3600;            // 1 hour freshness window

async function kv(method, path, body) {
  const url = `${process.env.KV_REST_API_URL}${path}`;
  const opts = { method, headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(url, opts);
  return r.json();
}

async function redisGet(key) {
  try { const r = await kv('GET', `/get/${encodeURIComponent(key)}`); return r.result ? JSON.parse(r.result) : null; }
  catch { return null; }
}

async function redisSet(key, value, ttl) {
  try { await kv('POST', `/set/${encodeURIComponent(key)}`, { value: JSON.stringify(value), ex: ttl }); }
  catch {}
}

async function fetchTrustMRR(params, apiKey) {
  const r = await fetch(`https://trustmrr.com/api/v1/startups?${params}`, { headers: { Authorization: apiKey } });
  if (r.status === 401) throw new Error('401');
  if (!r.ok) throw new Error('upstream_' + r.status);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.headers.authorization;
  if (!apiKey) return res.status(401).json({ error: 'No API key' });

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
        redisSet(cacheKey, fresh, CACHE_TTL),
        redisSet(freshKey, 1, FRESH_TTL)
      ]);
    } catch {}
    return;
  }

  // Case 3: no cache — must fetch and wait
  try {
    const data = await fetchTrustMRR(params, apiKey);
    await Promise.all([
      redisSet(cacheKey, data, CACHE_TTL),
      redisSet(freshKey, 1, FRESH_TTL)
    ]);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json({ ...data, fromCache: false });
  } catch (err) {
    if (err.message === '401') return res.status(401).json({ error: 'Invalid API key' });
    return res.status(500).json({ error: err.message });
  }
}
