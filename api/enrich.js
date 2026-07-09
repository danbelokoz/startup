// Scrapes the rich fields from the public TrustMRR page that don't ship with
// their API: aiEnrichment (valueProposition, problemSolved, pricingModel, tags,
// fundingStatus, ...), acquireScore, cachedGrowth, analytics flags, githubActivity,
// stealthMode, lookingForCofounder, xFollowerCount, xFounderName, etc.

import { redisPipeline, clientIp, rateOk } from './_lib.js';

const CACHE_TTL = 86400; // 24h — enrich data refreshes daily on TrustMRR

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

// ── Stored description (rephrase + per-language translations) ──────────────────
// Each startup's description is rephrased in our own words (so the page isn't a 1:1
// copy of trustmrr.com) and translated into the UI languages. Everything is produced
// OFFLINE (by Claude Code) and stored in startup_descriptions — there are NO runtime
// translation calls and no API cost:
//   description  — our English rephrase
//   translations — { ru, de, fr, it, zh, ar } : translated rephrases
// Read with the service-role key (the table is RLS-locked). select=* so it keeps
// working before the translations/status columns are migrated in.
const TR_LANGS = new Set(['de', 'fr', 'it', 'ru', 'zh', 'ar']);

async function getStoredDescription(slug) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/startup_descriptions?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
      { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch { return null; }
}

// Pick the description to send for this language: the stored translation if we have
// one, else our English rephrase. Nothing is generated at request time. When nothing
// is stored we leave result.description unset and the page falls back to TrustMRR's
// original (English) from /api/startup.
function resolveDescription(result, stored, lang) {
  if (!stored) return;
  if (TR_LANGS.has(lang)) {
    const tr = stored.translations && stored.translations[lang];
    if (typeof tr === 'string' && tr.trim()) { result.description = tr.trim(); return; }
  }
  if (typeof stored.description === 'string' && stored.description.trim()) {
    result.description = stored.description.trim();
  }
}

// Records this run for the admin "Парсеры" tab. On-demand parser → also bumps a
// per-UTC-day counter so the panel can show "обновлено сегодня: N".
async function recordRun(id, ok, note) {
  try {
    await redisSet(`sm_parser_${id}`, { ts: Date.now(), ok: !!ok, count: 1, note: String(note || '') });
    const k = `sm_parser_${id}_n_${new Date().toISOString().slice(0, 10)}`;
    await kv('POST', `/incrby/${encodeURIComponent(k)}/1`);
    await kv('POST', `/expire/${encodeURIComponent(k)}/172800`);
    const logKey = `sm_parser_${id}_log`;
    await redisPipeline([
      ['LPUSH', logKey, JSON.stringify({ t: Date.now(), ok: ok ? 1 : 0, n: 1 })],
      ['LTRIM', logKey, '0', '999'],
      ['EXPIRE', logKey, '259200'], // 3 days
    ]);
  } catch {}
}

// Walks a decoded RSC payload and isolates the JSON object that contains
// "slug":"<slug>" by walking balanced braces backwards then forwards.
function findStartupObject(decoded, slug) {
  const marker = `"slug":"${slug}"`;
  let pos = -1;
  while ((pos = decoded.indexOf(marker, pos + 1)) !== -1) {
    // Walk backwards to find the opening { of the enclosing object
    let depth = 0;
    let i = pos;
    while (i >= 0) {
      const c = decoded[i];
      if (c === '}') depth++;
      else if (c === '{') {
        if (depth === 0) break;
        depth--;
      }
      i--;
    }
    if (i < 0) continue;
    // Walk forwards to find matching closing brace
    depth = 0;
    for (let j = i; j < decoded.length; j++) {
      const c = decoded[j];
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          try {
            const obj = JSON.parse(decoded.slice(i, j + 1));
            if (obj && obj.slug === slug) return obj;
          } catch {}
          break;
        }
      }
    }
  }
  return null;
}

// Pull out only the safe-to-expose enriched fields (avoid IDs/internal state).
function pickFields(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  const copy = [
    'aiEnrichment',
    'acquireScore', 'acquireScoreNoRecency',
    'cachedGrowth30d', 'cachedGrowthMRR30d', 'cachedMultiple',
    'cachedOfferCount', 'cachedRank', 'cachedUniquePageviews',
    'hasDatafast', 'hasGA', 'hasGSC',
    'stealthMode', 'lookingForCofounder',
    'xFollowerCount', 'xFounderName', 'xProfilePicture',
    'listingTier', 'mcc',
    'githubActivity',
    'mrrLastSyncedAt', 'revenueLastSyncedAt',
    'brandingPrimaryColor', 'brandingSecondaryColor',
  ];
  for (const k of copy) if (obj[k] !== undefined) out[k] = obj[k];
  // Stealth / "Anonymous startup" listings: TrustMRR blanks `description` (and the
  // AI value-prop) in its API, but the public page still carries the real one-liner.
  // Capture it so those detail pages aren't left with an empty description. We keep
  // the displayed name as "Anonymous startup" (don't expose obj.name) — only the
  // description, which TrustMRR itself shows publicly on the anonymous page. The
  // stored rephrase/translation still wins downstream (see resolveDescription).
  if (obj.stealthMode && typeof obj.description === 'string' && obj.description.trim()) {
    out.description = obj.description.trim();
  }
  // aiEnrichment can carry an error blob — strip noise.
  if (out.aiEnrichment) {
    const a = out.aiEnrichment;
    out.aiEnrichment = {
      valueProposition:   a.valueProposition   || null,
      problemSolved:      a.problemSolved      || null,
      pricingModel:       a.pricingModel       || null,
      targetPersona:      a.targetPersona      || null,
      businessType:       a.businessType       || null,
      tags:               Array.isArray(a.tags) ? a.tags : [],
      fundingStatus:      a.fundingStatus      || null,
      estimatedUserCount: a.estimatedUserCount || null,
    };
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Per-IP rate limit (fail-open). One call per detail-page view, then 24h cached,
  // so a human stays well under this; the cap blunts scraping of the live trustmrr fetch.
  if (!(await rateOk('enrich', clientIp(req), 90, 60))) {
    res.setHeader('Retry-After', '30');
    return res.status(429).json({ error: 'Too many requests' });
  }

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });
  const lang = (req.query.lang || 'en').toLowerCase();  // varies the CDN cache per language

  const cacheKey = `sm_enrich_${slug}`;
  // Read our stored description (rephrase + translations) alongside the separately
  // cached scrape and merge the right language into the response — without polluting
  // the enrich cache, so it shows immediately and the cache stays language-agnostic.
  const [cached, stored] = await Promise.all([redisGet(cacheKey), getStoredDescription(slug)]);
  if (cached) {
    resolveDescription(cached, stored, lang);
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ data: cached });
  }

  try {
    const r = await fetch(`https://trustmrr.com/startup/${encodeURIComponent(slug)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StartupMarketBot/1.0)' },
    });
    if (!r.ok) {
      await recordRun('enrich', false, `${slug}: HTTP ${r.status}`);
      const out = {};
      resolveDescription(out, stored, lang);  // still serve our description even if the scrape fails
      return res.status(200).json({ data: out, note: 'fetch_failed_' + r.status });
    }
    const html = await r.text();

    // RSC payloads: self.__next_f.push([N,"...escaped JSON..."])
    const re = /self\.__next_f\.push\(\[\d+,(".+?")\]\)/gs;
    let enriched = null;
    let m;
    while ((m = re.exec(html)) !== null) {
      let decoded;
      try { decoded = JSON.parse(m[1]); } catch { continue; }
      const obj = findStartupObject(decoded, slug);
      if (obj) { enriched = pickFields(obj); break; }
    }

    const result = enriched || {};
    if (Object.keys(result).length) await redisSet(cacheKey, result, CACHE_TTL);
    await recordRun('enrich', Object.keys(result).length > 0, slug);

    resolveDescription(result, stored, lang); // merge after caching — cache stays description-agnostic
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ data: result });
  } catch (e) {
    await recordRun('enrich', false, `${slug}: parse_error`);
    const out = {};
    resolveDescription(out, stored, lang);
    return res.status(200).json({ data: out, note: 'parse_error' });
  }
}
