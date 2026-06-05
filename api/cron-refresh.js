// Runs daily to pre-warm Redis with fresh TrustMRR data.
// Triggered by Vercel Cron (vercel.json) and optionally GitHub Actions.
// Fetches ALL pages directly from TrustMRR and writes them to Redis,
// using the same cache key format as api/startups.js.

const FRESH_TTL = 82800; // 23 hour freshness window — must match api/startups.js
const DELAY_MS  = 3200;  // 3.2s between pages → ~18 req/min (limit is 20)

async function kv(method, path, body) {
  const url  = `${process.env.KV_REST_API_URL}${path}`;
  const opts = { method, headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(url, opts);
  return r.json();
}

async function redisSet(key, value, ttl) {
  try {
    const body = { value: JSON.stringify(value) };
    if (ttl) body.ex = ttl;
    await kv('POST', `/set/${encodeURIComponent(key)}`, body);
  } catch {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.TRUSTMRR_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TRUSTMRR_API_KEY not set' });

  let page = 1, totalStartups = 0, hasMore = true;

  while (hasMore) {
    const params   = new URLSearchParams({ page, limit: 50, sort: 'revenue-desc' });
    const cacheKey = `sm_${params.toString()}`;
    const freshKey = `${cacheKey}_f`;

    let data;
    try {
      const r = await fetch(`https://trustmrr.com/api/v1/startups?${params}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (r.status === 401) return res.status(500).json({ error: 'Invalid TrustMRR API key', page });
      if (!r.ok)            return res.status(500).json({ error: `TrustMRR ${r.status}`, page });
      data = await r.json();
    } catch (err) {
      return res.status(500).json({ error: err.message, page });
    }

    await Promise.all([
      redisSet(cacheKey, data),
      redisSet(freshKey, 1, FRESH_TTL),
    ]);

    totalStartups += data.data?.length ?? 0;
    hasMore = data.meta?.hasMore ?? false;
    page++;

    if (hasMore) await sleep(DELAY_MS);
  }

  return res.status(200).json({ ok: true, pages: page - 1, startups: totalStartups });
}
