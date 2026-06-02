export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.headers.authorization;
  if (!apiKey) return res.status(401).json({ error: 'No API key' });

  const params = new URLSearchParams(req.query);
  const url = `https://trustmrr.com/api/v1/startups?${params}`;

  try {
    const response = await fetch(url, { headers: { Authorization: apiKey } });
    const data = await response.json();
    // Cache for 1 hour on CDN edge
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
