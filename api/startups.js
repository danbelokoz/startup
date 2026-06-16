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

// Guards against a broken/changed upstream payload silently overwriting good cache:
// require a non-empty data array whose items still carry a slug. An empty/error body
// returned with HTTP 200, or a schema change that drops slug, fails this — and we keep
// the existing cache instead of replacing it with garbage.
function isValidList(data) {
  if (!data || !Array.isArray(data.data) || data.data.length === 0) return false;
  return data.data.filter(s => s && s.slug).length >= data.data.length * 0.5;
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
      // Only overwrite the cache if the response looks valid; otherwise keep serving
      // the existing (stale) data and retry on the next request.
      if (isValidList(fresh)) {
        await Promise.all([
          redisSet(cacheKey, fresh),
          redisSet(freshKey, 1, FRESH_TTL)
        ]);
      }
    } catch {}
    return;
  }

  // Case 3: no cache — must fetch and wait
  try {
    const data = await fetchTrustMRR(params, apiKey);
    const valid = isValidList(data);
    // No prior cache here, so still return whatever upstream gave — but don't cache a
    // broken/empty body (it would become poisoned "stale" data on later requests).
    if (valid) {
      await Promise.all([
        redisSet(cacheKey, data),
        redisSet(freshKey, 1, FRESH_TTL)
      ]);
    }
    res.setHeader('X-Cache', valid ? 'MISS' : 'MISS-RAW');
    return res.status(200).json({ ...data, fromCache: false });
  } catch (err) {
    // Fallback: upstream dead. If onSale=true was requested, scan ALL cached
    // pages of the non-onSale dataset to build an aggregate of onSale items,
    // then paginate from it. Aggregate is cached so this scan only happens once.
    if (params.get('onSale') === 'true') {
      const fbParams = new URLSearchParams(params);
      fbParams.delete('onSale');
      fbParams.delete('page');
      const sort = fbParams.get('sort') || 'revenue-desc';
      const limit = parseInt(fbParams.get('limit') || '50', 10);
      const aggKey = `sm_onsale_agg_${sort}`;
      let agg = await redisGet(aggKey);

      if (!agg || !Array.isArray(agg.data)) {
        const items = [];
        for (let p = 1; p <= 200; p++) {
          const pp = new URLSearchParams(fbParams);
          pp.set('page', String(p));
          const pg = await redisGet(`sm_${pp.toString()}`);
          if (!pg || !Array.isArray(pg.data) || pg.data.length === 0) break;
          for (const s of pg.data) if (s && s.onSale) items.push(s);
          if (!pg.meta || pg.meta.hasMore === false) break;
        }
        agg = { data: items };
        if (items.length) await redisSet(aggKey, agg, 21600); // 6h TTL
      }

      const page = parseInt(params.get('page') || '1', 10);
      const start = (page - 1) * limit;
      const slice = agg.data.slice(start, start + limit);
      res.setHeader('X-Cache', 'STALE-AGG');
      return res.status(200).json({
        data: slice,
        meta: { total: agg.data.length, page, limit, hasMore: start + slice.length < agg.data.length },
        fromCache: true,
        stale: true,
      });
    }
    if (err.message === '401') return res.status(503).json({ error: 'Upstream API error' });
    return res.status(500).json({ error: err.message });
  }
}
