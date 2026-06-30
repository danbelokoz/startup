// Single startup detail proxy — stale-while-revalidate (mirrors api/startups.js).
// Detail is stored in Redis WITHOUT a TTL (so it survives an upstream outage); a
// separate freshness flag expires after 24h. When stale we return the cached copy
// instantly and revalidate in the background — and never overwrite good cache with a
// broken/changed upstream payload.

import { sb, supaConfigured, redisPipeline } from './_lib.js';

const FRESH_TTL = 24 * 3600; // 24h freshness window

// Per-IP rate limit (fixed window). Fail-OPEN: any Redis hiccup → allowed, so a
// counter outage never blocks real visitors. This endpoint is public (no key), so it
// needs its own guard against floods / cache-busting with random slugs.
function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.headers['x-real-ip'] || '';
}
async function rateOk(bucket, ip, limit, windowSec) {
  if (!ip) return true;
  const slot = Math.floor(Date.now() / (windowSec * 1000));
  const key = `sm_rl_${bucket}_${ip}_${slot}`;
  const res = await redisPipeline([['INCR', key], ['EXPIRE', key, String(windowSec * 2)]]);
  const n = res && res[0] && Number(res[0].result);
  return !Number.isFinite(n) || n <= limit;
}

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

// Self-healing deny-list (see supabase-dead-startups-migration.sql). A slug is
// marked dead when TrustMRR's detail 404s, and un-marked when a fresh detail fetch
// succeeds (re-listed). api/startups.js filters dead slugs out of the catalog so
// "zombie" onSale listings stop showing. Both are best-effort: if the table isn't
// migrated yet, the calls no-op and nothing breaks.
async function markDead(slug) {
  if (!supaConfigured()) return;
  try {
    await sb('/rest/v1/dead_startups?on_conflict=slug', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: { slug },
    });
  } catch {}
}
async function clearDead(slug) {
  if (!supaConfigured()) return;
  try {
    await sb(`/rest/v1/dead_startups?slug=eq.${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    });
  } catch {}
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

// Overlay our rephrased/translated description (by ?lang=) onto a live response, so
// the detail page's first paint shows our copy instead of TrustMRR's original. The
// Redis cache stays language-agnostic — we mutate only the outgoing copy. descI18n
// lets the client render it immediately instead of showing the loading skeleton.
const TR_LANGS = new Set(['de', 'fr', 'it', 'ru', 'zh', 'ar']);
async function withOurDescription(payload, slug, lang) {
  try {
    if (!payload || !payload.data || !supaConfigured()) return payload;
    const { ok, data } = await sb(
      `/rest/v1/startup_descriptions?slug=eq.${encodeURIComponent(slug)}&select=description,translations&limit=1`
    );
    const row = ok && Array.isArray(data) && data[0] ? data[0] : null;
    if (!row) return payload;
    const tr = (TR_LANGS.has(lang) && row.translations) ? row.translations[lang] : null;
    const txt = (tr && String(tr).trim()) ? String(tr).trim()
              : (row.description && String(row.description).trim()) ? String(row.description).trim() : null;
    if (txt) { payload.data.description = txt; payload.data.descI18n = true; }
  } catch {}
  return payload;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Internal calls from middleware.js (bot SSR) carry the shared secret and are already
  // rate-limited there, so they skip this guard to avoid being double-counted.
  const internal = !!process.env.CRON_SECRET && req.headers['x-sm-internal'] === process.env.CRON_SECRET;
  if (!internal && !(await rateOk('api', clientIp(req), 240, 60))) {
    res.setHeader('Retry-After', '30');
    return res.status(429).json({ error: 'Too many requests' });
  }

  const apiKey = process.env.TRUSTMRR_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server not configured' });

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });
  const lang = (req.query.lang || 'en').toLowerCase();

  const cacheKey = `sm_startup_${slug}`;
  const freshKey = `${cacheKey}_f`;
  const swr = 's-maxage=3600, stale-while-revalidate=86400';

  const [cached, isFresh] = await Promise.all([redisGet(cacheKey), redisGet(freshKey)]);

  // Fresh cache — instant return.
  if (cached && isFresh) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', swr);
    return res.status(200).json(await withOurDescription(cached, slug, lang));
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
        await clearDead(slug); // alive again — drop any stale deny-list entry
        res.setHeader('X-Cache', 'REVALIDATED');
        return res.status(200).json(await withOurDescription(fresh.data, slug, lang));
      }
      // Gone from upstream (404) — serve the archived snapshot (or the stale copy),
      // flagged archived so the page shows the "no longer updated" banner, and mark
      // the slug dead so the catalog stops listing it as on-sale.
      if (fresh.status === 404) {
        await markDead(slug);
        const arch = await getArchived(slug);
        return archivedResponse(res, arch ? arch.data : (cached.data || cached), arch ? arch.last_seen : null);
      }
    } catch {}
    res.setHeader('X-Cache', 'STALE');
    return res.status(200).json(await withOurDescription(cached, slug, lang));
  }

  // No cache — fetch and wait.
  try {
    const fresh = await fetchStartup(slug, apiKey);
    if (fresh.ok && isValidStartup(fresh.data)) {
      await Promise.all([
        redisSet(cacheKey, fresh.data),
        redisSet(freshKey, 1, FRESH_TTL),
      ]);
      await clearDead(slug); // alive — drop any stale deny-list entry
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', swr);
      return res.status(200).json(await withOurDescription(fresh.data, slug, lang));
    }
    // Delisted and nothing cached — mark dead and fall back to the archived snapshot.
    if (fresh.status === 404) {
      await markDead(slug);
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
