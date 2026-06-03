// Stale-while-revalidate: always return cached data instantly,
// trigger background refresh if cache is older than 1 hour

async function redisGet(key) {
  try {
    const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } });
    const json = await res.json();
    return json.result ? JSON.parse(json.result) : null;
  } catch { return null; }
}

async function redisSet(key, value, ttl) {
  try {
    const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify(value), ex: ttl })
    });
  } catch {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.headers.authorization;
  if (!apiKey) return res.status(401).json({ error: 'No API key' });

  const params = new URLSearchParams(req.query);
  const cacheKey = `v2_${params.toString()}`;
  const freshKey = `${cacheKey}_fresh`; // flag: data is < 1h old

  // Always try to return cached data first
  const cached = await redisGet(cacheKey);
  const isFresh = await redisGet(freshKey);

  if (cached) {
    // Return cached data immediately
    res.setHeader('X-Cache', isFresh ? 'HIT-FRESH' : 'HIT-STALE');

    if (!isFresh) {
      // Cache is stale — refresh in background WITHOUT blocking response
      res.status(200).json({ ...cached, fromCache: true, stale: true });

      // Background refresh (runs after response is sent)
      refreshPage(params, cacheKey, freshKey, apiKey).catch(() => {});
      return;
    }

    return res.status(200).json({ ...cached, fromCache: true, stale: false });
  }

  // No cache at all — must fetch (first ever load)
  try {
    const data = await fetchFromTrustMRR(params, apiKey);
    // Save with 7-day TTL (so stale data is always available)
    await redisSet(cacheKey, data, 7 * 24 * 3600);
    // Mark as fresh for 1 hour
    await redisSet(freshKey, '1', 3600);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json({ ...data, fromCache: false, stale: false });
  } catch (err) {
    if (err.message.includes('401')) return res.status(401).json({ error: 'Invalid API key' });
    return res.status(500).json({ error: err.message });
  }
}

async function refreshPage(params, cacheKey, freshKey, apiKey) {
  const data = await fetchFromTrustMRR(params, apiKey);
  await redisSet(cacheKey, data, 7 * 24 * 3600); // keep for 7 days
  await redisSet(freshKey, '1', 3600);            // fresh for 1 hour
}

async function fetchFromTrustMRR(params, apiKey) {
  const url = `https://trustmrr.com/api/v1/startups?${params}`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (res.status === 401) throw new Error('401');
  if (!res.ok) throw new Error('TrustMRR error: ' + res.status);
  return res.json();
}
