// Single startup detail proxy — stale-while-revalidate (mirrors api/startups.js).
// Detail is stored in Redis WITHOUT a TTL (so it survives an upstream outage); a
// separate freshness flag expires after 24h. When stale we return the cached copy
// instantly and revalidate in the background — and never overwrite good cache with a
// broken/changed upstream payload.

import { sb, supaConfigured } from './_lib.js';

const FRESH_TTL = 24 * 3600; // 24h freshness window

async function kv(method, path, body) {
  const url  = `${process.env.KV_REST_API_URL}${path}`;
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
    if (parsed?.value) return JSON.parse(parsed.value);
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

// TrustMRR returns the startup as { data: { slug, ... } }. A valid payload still
// carries that slug; an empty/error body or a schema change fails this, and we keep
// the existing cache instead of poisoning it.
function isValidStartup(d) {
  return !!(d && d.data && d.data.slug);
}

async function fetchStartup(slug, apiKey) {
  const r = await fetch(`https://trustmrr.com/api/v1/startups/${encodeURIComponent(slug)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return { status: r.status, ok: r.ok, data: await r.json().catch(() => null) };
}

// Persisted full snapshot kept by cron-refresh.js. Returns { data, last_seen } or
// null. Lets a delisted startup's page stay populated after TrustMRR drops it.
async function getArchived(slug) {
  if (!supaConfigured()) return null;
  const { ok, data } = await sb(
    `/rest/v1/startup_archive?slug=eq.${encodeURIComponent(slug)}&select=data,last_seen&limit=1`
  );
  return (ok && Array.isArray(data) && data.length) ? data[0] : null;
}

// Respond with an archived snapshot: same { data } shape live responses use, plus
// archived/lastSeen so the client can show the "no longer updated" banner.
function archivedResponse(res, snapshot, lastSeen) {
  res.setHeader('X-Cache', 'ARCHIVED');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  return res.status(200).json({ data: snapshot, archived: true, lastSeen: lastSeen || null });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.TRUSTMRR_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server not configured' });

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  const cacheKey = `sm_startup_${slug}`;
  const freshKey = `${cacheKey}_f`;
  const swr = 's-maxage=3600, stale-while-revalidate=86400';

  const [cached, isFresh] = await Promise.all([redisGet(cacheKey), redisGet(freshKey)]);

  // Fresh cache — instant return.
  if (cached && isFresh) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', swr);
    return res.status(200).json(cached);
  }

  // Stale cache — revalidate synchronously (serverless won't reliably run code after
  // the response is sent, so a background refresh could never re-arm freshness) and
  // fall back to the stale copy if upstream is down or returns a broken payload.
  if (cached && !isFresh) {
    res.setHeader('Cache-Control', swr);
    try {
      const fresh = await fetchStartup(slug, apiKey);
      if (fresh.ok && isValidStartup(fresh.data)) {
        await Promise.all([
          redisSet(cacheKey, fresh.data),
          redisSet(freshKey, 1, FRESH_TTL),
        ]);
        res.setHeader('X-Cache', 'REVALIDATED');
        return res.status(200).json(fresh.data);
      }
      // Gone from upstream (404) — serve the archived snapshot (or the stale copy),
      // flagged archived so the page shows the "no longer updated" banner.
      if (fresh.status === 404) {
        const arch = await getArchived(slug);
        return archivedResponse(res, arch ? arch.data : (cached.data || cached), arch ? arch.last_seen : null);
      }
    } catch {}
    res.setHeader('X-Cache', 'STALE');
    return res.status(200).json(cached);
  }

  // No cache — fetch and wait.
  try {
    const fresh = await fetchStartup(slug, apiKey);
    if (fresh.ok && isValidStartup(fresh.data)) {
      await Promise.all([
        redisSet(cacheKey, fresh.data),
        redisSet(freshKey, 1, FRESH_TTL),
      ]);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', swr);
      return res.status(200).json(fresh.data);
    }
    // Delisted and nothing cached — fall back to the archived snapshot if we kept one.
    if (fresh.status === 404) {
      const arch = await getArchived(slug);
      if (arch) return archivedResponse(res, arch.data, arch.last_seen);
    }
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', swr);
    return res.status(fresh.status).json(fresh.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
