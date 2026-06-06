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
  const allStartups = [];

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
    if (Array.isArray(data.data)) allStartups.push(...data.data);
    hasMore = data.meta?.hasMore ?? false;
    page++;

    if (hasMore) await sleep(DELAY_MS);
  }

  // Invalidate onSale aggregate so next request rebuilds from fresh data
  try { await kv('POST', `/del/${encodeURIComponent('sm_onsale_agg_revenue-desc')}`); } catch {}

  // Write today's snapshots to Supabase for historical chart on detail page.
  let snapshotsWritten = 0;
  let snapshotsPruned = 0;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && allStartups.length) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = allStartups
      .filter(s => s && s.slug)
      .map(s => ({
        slug: s.slug,
        snap_date: today,
        mrr_cents: s.revenue && s.revenue.mrr != null ? Math.round(s.revenue.mrr) : null,
        rev30d_cents: s.revenue && s.revenue.last30Days != null ? Math.round(s.revenue.last30Days) : null,
        total_cents: s.revenue && s.revenue.total != null ? Math.round(s.revenue.total) : null,
        customers: s.customers ?? null,
        subscriptions: s.activeSubscriptions ?? null,
        growth30d: s.growth30d ?? null,
        visitors_30d: s.visitorsLast30Days ?? null,
      }));

    const supaHeaders = {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    };

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      try {
        const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/daily_snapshots?on_conflict=slug,snap_date`, {
          method: 'POST',
          headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(batch),
        });
        if (r.ok) snapshotsWritten += batch.length;
      } catch {}
    }

    // Prune snapshots older than 60 days to stay well within the Supabase free tier.
    try {
      const cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/daily_snapshots?snap_date=lt.${cutoff}`, {
        method: 'DELETE',
        headers: { ...supaHeaders, 'Prefer': 'return=representation,count=exact' },
      });
      if (r.ok) {
        const range = r.headers.get('content-range');
        if (range) snapshotsPruned = parseInt(range.split('/')[1], 10) || 0;
      }
    } catch {}
  }

  return res.status(200).json({ ok: true, pages: page - 1, startups: totalStartups, snapshots: snapshotsWritten, pruned: snapshotsPruned });
}
