const CACHE_KEY = 'startups_all';
const CACHE_TTL = 3600; // 1 hour in seconds

async function redisGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${key}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
  });
  const { result } = await res.json();
  return result ? JSON.parse(result) : null;
}

async function redisSet(key, value, ttl) {
  const url = `${process.env.KV_REST_API_URL}/set/${key}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value: JSON.stringify(value), ex: ttl })
  });
}

async function fetchAllFromTrustMRR(apiKey) {
  let page = 1, hasMore = true, all = [];
  while (hasMore) {
    const params = new URLSearchParams({ page, limit: 50, sort: 'revenue-desc' });
    const res = await fetch(`https://trustmrr.com/api/v1/startups?${params}`, {
      headers: { Authorization: apiKey }
    });
    if (!res.ok) throw new Error('TrustMRR API error: ' + res.status);
    const { data, meta } = await res.json();
    all = all.concat(data);
    hasMore = meta.hasMore;
    page++;
    // Respect rate limit: 20 req/min
    if (hasMore) await new Promise(r => setTimeout(r, 3100));
  }
  return all;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.headers.authorization;
  if (!apiKey) return res.status(401).json({ error: 'No API key' });

  const { refresh } = req.query;

  try {
    // Try server cache first (unless force refresh)
    if (!refresh) {
      const cached = await redisGet(CACHE_KEY);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json({ data: cached, fromCache: true, count: cached.length });
      }
    }

    // Cache miss — fetch from TrustMRR
    res.setHeader('X-Cache', 'MISS');
    const all = await fetchAllFromTrustMRR(apiKey);

    // Save to server cache
    await redisSet(CACHE_KEY, all, CACHE_TTL);

    return res.status(200).json({ data: all, fromCache: false, count: all.length });

  } catch (err) {
    // If cache fetch failed but we have stale data, return it
    try {
      const stale = await redisGet(CACHE_KEY);
      if (stale) return res.status(200).json({ data: stale, fromCache: true, stale: true, count: stale.length });
    } catch {}
    return res.status(500).json({ error: err.message });
  }
}
