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

// ── Our rephrased + translated descriptions (Supabase) ────────────────────────
// Overlaid onto the catalog at read-time so the listing — and the detail page's
// first paint from this cached dataset — shows our own copy in the UI language
// instead of TrustMRR's original. The Redis cache stays language-agnostic (the
// overlay is applied per request from ?lang=). Overlaid items get descI18n:true so
// the client can render them immediately instead of showing the loading skeleton.
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Full map { slug: {description, translations} } of our descriptions, cached in the
// function's memory for a minute. A burst catalog load (many pages back-to-back) then
// costs ONE Supabase fetch instead of one per page, and a freshly upserted description
// shows up within ~60s. The catalog's own Redis cache stays TrustMRR-only; this map is
// merged onto the response per request from memory (no per-request DB query).
let _descMap = null, _descMapAt = 0;
const DESC_TTL = 60000;
async function getDescMap() {
  if (_descMap && Date.now() - _descMapAt < DESC_TTL) return _descMap;
  if (!SUPA_URL || !SUPA_KEY) return (_descMap = _descMap || {});
  try {
    const map = {};
    let offset = 0; const page = 1000;
    for (;;) {
      const url = `${SUPA_URL}/rest/v1/startup_descriptions?select=slug,description,translations&limit=${page}&offset=${offset}`;
      const r = await fetch(url, { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } });
      if (!r.ok) break;
      const rows = await r.json();
      if (!Array.isArray(rows) || !rows.length) break;
      for (const row of rows) if (row && row.slug) map[row.slug] = row;
      if (rows.length < page) break;
      offset += page;
    }
    _descMap = map; _descMapAt = Date.now();
  } catch { /* keep the previous map on a transient failure */ }
  return _descMap || {};
}

// ── Dead-startup deny-list ────────────────────────────────────────────────────
// Slugs whose TrustMRR detail 404s (written by api/startup.js). TrustMRR can keep a
// startup in the onSale LIST after its detail is gone, and our onSale pages live in
// Redis without a TTL, so those "zombies" would otherwise show as on-sale forever.
// Cached in memory for 60s (same trick as getDescMap) so a burst of catalog pages
// costs one Supabase fetch. Resilient to the table not being migrated yet (→ empty).
let _deadSet = null, _deadAt = 0;
const DEAD_TTL = 60000;
// Circuit breaker: markDead only ever fires on a per-startup 404, so an access-wide
// TrustMRR cutoff (401/403/429/5xx/network) can't populate this list. But if TrustMRR
// ever answered 404 for *everything*, the list could balloon and blank the catalog.
// If it grows past this many entries we treat it as a malfunction and STOP filtering
// (fail-open) — the deny-list must never be able to empty the catalog. Real delisting
// is a slow trickle, so this is far above any legitimate level.
const DEAD_CAP = 1000;
async function getDeadSet() {
  if (_deadSet && Date.now() - _deadAt < DEAD_TTL) return _deadSet;
  let next = _deadSet || new Set();
  if (SUPA_URL && SUPA_KEY) {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/dead_startups?select=slug`, {
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      });
      if (r.ok) {
        const rows = await r.json();
        if (Array.isArray(rows)) next = new Set(rows.map(x => x && x.slug));
      }
    } catch { /* keep the previous set on a transient failure */ }
  }
  // Always refresh the timestamp — caches the empty set too, so a not-yet-migrated
  // table (404) doesn't make every catalog request re-hit Supabase.
  _deadSet = next; _deadAt = Date.now();
  return _deadSet;
}
// Drop delisted "zombie" startups from a catalog payload's data array.
async function dropDead(data) {
  try {
    if (!data || !Array.isArray(data.data) || !data.data.length) return data;
    const dead = await getDeadSet();
    // Fail-open if the deny-list looks broken (see DEAD_CAP) — never risk an empty catalog.
    if (dead.size && dead.size <= DEAD_CAP) {
      data.data = data.data.filter(s => !(s && dead.has(s.slug)));
    }
  } catch {}
  return data;
}

async function withOurDescriptions(data, lang) {
  try {
    const items = data && Array.isArray(data.data) ? data.data : [];
    if (!items.length) return data;
    const map = await getDescMap();
    for (const s of items) {
      const row = s && map[s.slug];
      if (!row) continue;
      const tr = (lang !== 'en' && row.translations) ? row.translations[lang] : null;
      const txt = (tr && String(tr).trim()) ? String(tr).trim()
                : (row.description && String(row.description).trim()) ? String(row.description).trim() : null;
      if (txt) { s.description = txt; s.descI18n = true; }
    }
  } catch {}
  // Also strip delisted "zombie" listings here — every catalog response is spread
  // through this function, so the filter applies uniformly (incl. the onSale fallback).
  return dropDead(data);
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

  const lang = (req.query.lang || 'en').toLowerCase();
  const params = new URLSearchParams(req.query);
  params.delete('lang');   // keep the Redis cache key + upstream fetch language-agnostic
  const cacheKey = `sm_${params.toString()}`;
  const freshKey = `${cacheKey}_f`;

  const [cached, isFresh] = await Promise.all([redisGet(cacheKey), redisGet(freshKey)]);

  // Case 1: fresh cache — instant return
  if (cached && isFresh) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ ...(await withOurDescriptions(cached, lang)), fromCache: true });
  }

  // Case 2: stale cache — return immediately, update in background
  if (cached && !isFresh) {
    res.setHeader('X-Cache', 'STALE');
    // Send stale response right away
    res.status(200).json({ ...(await withOurDescriptions(cached, lang)), fromCache: true, stale: true });
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
    return res.status(200).json({ ...(await withOurDescriptions(data, lang)), fromCache: false });
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
      const total = agg.data.length;
      const overlaid = await withOurDescriptions({ data: slice }, lang);
      res.setHeader('X-Cache', 'STALE-AGG');
      return res.status(200).json({
        data: overlaid.data,
        meta: { total, page, limit, hasMore: start + slice.length < total },
        fromCache: true,
        stale: true,
      });
    }
    if (err.message === '401') return res.status(503).json({ error: 'Upstream API error' });
    return res.status(500).json({ error: err.message });
  }
}
