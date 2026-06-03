// Simple proxy with Redis caching per page
// Each page request is cached separately — fits in 10s timeout

async function redisGet(key) {
  try {
    const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
    });
    const json = await res.json();
    return json.result ? JSON.parse(json.result) : null;
  } catch { return null; }
}

async function redisSet(key, value) {
  try {
    const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: JSON.stringify(value), ex: 90000 }) // 25 hours
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

  // Pass through all query params to TrustMRR
  const params = new URLSearchParams(req.query);
  const cacheKey = `page_${params.toString()}`;

  // Try cache first
  const cached = await redisGet(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ ...cached, fromCache: true });
  }

  // Fetch from TrustMRR
  try {
    const url = `https://trustmrr.com/api/v1/startups?${params}`;
    const upstream = await fetch(url, { headers: { Authorization: apiKey } });

    if (upstream.status === 401) return res.status(401).json({ error: 'Invalid API key' });
    if (!upstream.ok) throw new Error('TrustMRR error: ' + upstream.status);

    const data = await upstream.json();

    // Cache this page
    await redisSet(cacheKey, data);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json({ ...data, fromCache: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
