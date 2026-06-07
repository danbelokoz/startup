// Scrapes the "Top growing startups" leaderboard from the TrustMRR homepage
// RSC payload (the same one their /championship page links to) and returns
// a normalised array of the fastest growers. Cached 4 hours in Redis.

const CACHE_TTL = 4 * 3600;

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

// Finds every JSON object literal in `s` that contains `marker`, by walking
// balanced braces backwards then forwards from each marker hit. Returns parsed
// objects (parses may fail silently, those are skipped).
function findObjectsContaining(s, marker) {
  const out = [];
  let pos = -1;
  const seenStart = new Set();
  while ((pos = s.indexOf(marker, pos + 1)) !== -1) {
    let depth = 0, start = -1;
    for (let i = pos; i >= 0; i--) {
      const c = s[i];
      if (c === '}') depth++;
      else if (c === '{') { if (depth === 0) { start = i; break; } depth--; }
    }
    if (start < 0 || seenStart.has(start)) continue;
    seenStart.add(start);
    depth = 0;
    for (let j = start; j < s.length; j++) {
      const c = s[j];
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          const slice = s.slice(start, j + 1);
          try { out.push(JSON.parse(slice)); } catch {}
          break;
        }
      }
    }
  }
  return out;
}

// Walks every RSC payload on the homepage. Inside each, finds every JSON
// object that has both a slug and a cachedGrowth30d field — those are the
// startup cards rendered on the homepage. Dedups by slug, sorts by growth.
function extractTopStartups(html, limit) {
  const items = [];
  const seen = new Set();
  const re = /self\.__next_f\.push\(\[\d+,(".+?")\]\)/gs;
  let m;
  while ((m = re.exec(html)) !== null) {
    let decoded;
    try { decoded = JSON.parse(m[1]); } catch { continue; }
    if (!decoded.includes('"cachedGrowth30d"')) continue;
    const objects = findObjectsContaining(decoded, '"cachedGrowth30d"');
    for (const o of objects) {
      if (!o || !o.slug || !o.name) continue;
      if (typeof o.cachedGrowth30d !== 'number') continue;
      if (seen.has(o.slug)) continue;
      seen.add(o.slug);
      items.push({
        slug: o.slug,
        name: o.name,
        icon: o.icon || null,
        growth30d:   o.cachedGrowth30d,
        mrrCents:    typeof o.currentMrr === 'number' ? Math.round(o.currentMrr) : null,
        rev30dCents: typeof o.currentLast30DaysRevenue === 'number' ? Math.round(o.currentLast30DaysRevenue) : null,
        onSale: o.onSale === true || undefined,
      });
    }
  }
  items.sort((a, b) => b.growth30d - a.growth30d);
  return items.slice(0, limit || 12);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const limit = Math.min(50, parseInt(req.query.limit || '12', 10) || 12);
  const cacheKey = `sm_top_startups_v2`;
  const cached = await redisGet(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ data: cached.slice(0, limit) });
  }

  try {
    const r = await fetch('https://trustmrr.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MRRketBot/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return res.status(200).json({ data: [], note: 'fetch_failed_' + r.status });
    const html = await r.text();
    const top = extractTopStartups(html, 50);
    if (top.length) await redisSet(cacheKey, top, CACHE_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=14400, stale-while-revalidate=86400');
    return res.status(200).json({ data: top.slice(0, limit) });
  } catch (e) {
    return res.status(200).json({ data: [], note: e && e.message || 'parse_error' });
  }
}
