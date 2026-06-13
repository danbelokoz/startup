// Scrapes a startup's own website for buyer-relevant signals that TrustMRR
// doesn't expose: hero screenshot via thum.io, OG image/title/description,
// detected tech stack from HTML + HTTP headers, pricing tier hints, social
// presence (GitHub/X/LinkedIn), iOS/Android app store IDs.
//
// One call per detail page view. Results are cached in Redis for 7 days
// since startup websites change much less than their revenue metrics.

const CACHE_TTL = 7 * 86400; // 7 days

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

// Records this run for the admin "Парсеры" tab + per-UTC-day "обновлено сегодня".
async function recordRun(id, ok, note) {
  try {
    await redisSet(`sm_parser_${id}`, { ts: Date.now(), ok: !!ok, count: 1, note: String(note || '') });
    const k = `sm_parser_${id}_n_${new Date().toISOString().slice(0, 10)}`;
    await kv('POST', `/incrby/${encodeURIComponent(k)}/1`);
    await kv('POST', `/expire/${encodeURIComponent(k)}/172800`);
  } catch {}
}

function parseMeta(html, name, prop) {
  const p = prop ? 'property' : 'name';
  const r1 = new RegExp('<meta[^>]+' + p + '=["\']' + name + '["\'][^>]+content=["\']([^"\']+)', 'i');
  const r2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+' + p + '=["\']' + name + '["\']', 'i');
  const m = html.match(r1) || html.match(r2);
  return m ? m[1].replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null;
}

function detectTech(html, headers) {
  const head = html.slice(0, 6000).toLowerCase();
  const all = html.toLowerCase();
  const srv = (headers.get('server') || '').toLowerCase();
  return {
    nextjs:     html.includes('__NEXT_DATA__') || html.includes('/_next/'),
    nuxt:       html.includes('__NUXT__') || html.includes('/_nuxt/'),
    react:      head.includes('react-dom') || head.includes('"react"'),
    vue:        head.includes('vue.js') || head.includes('vuejs'),
    svelte:     html.includes('__sveltekit_'),
    angular:    head.includes('ng-version') || head.includes('angular'),
    remix:      html.includes('remix:context') || html.includes('__remix'),
    astro:      html.includes('astro-island') || html.includes('astro:'),
    tailwind:   head.includes('tailwind') || /class="[^"]*(?:flex|grid|p-\d|m-\d|bg-\w)/i.test(html.slice(0, 8000)),
    bootstrap:  head.includes('bootstrap'),
    stripe:     all.includes('js.stripe.com') || all.includes('stripe.com/checkout'),
    paddle:     all.includes('paddle.com/api') || all.includes('paddle.js'),
    lemonsqueezy:all.includes('lemonsqueezy.com'),
    polar:      all.includes('polar.sh'),
    googleAnalytics: all.includes('google-analytics.com') || all.includes('googletagmanager.com'),
    posthog:    all.includes('posthog.com'),
    mixpanel:   all.includes('mixpanel.com'),
    plausible:  all.includes('plausible.io'),
    intercom:   all.includes('intercom.io') || all.includes('widget.intercom.io'),
    crisp:      all.includes('crisp.chat'),
    cloudflare: headers.get('cf-ray') != null || srv.includes('cloudflare'),
    vercel:     srv.includes('vercel') || headers.get('x-vercel-id') != null,
    netlify:    srv.includes('netlify') || headers.get('x-nf-request-id') != null,
    railway:    srv.includes('railway'),
  };
}

function extractPricing(html) {
  // Strip script/style blocks first to avoid false matches in inline JS objects
  const clean = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  // $X / $X.XX / $X/mo etc.
  const matches = clean.match(/\$\d{1,4}(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|year|yr|user|seat|day))?/gi) || [];
  const unique = [...new Set(matches.map(m => m.replace(/\s+/g, '')))];
  const amounts = unique
    .map(m => ({ display: m, value: parseFloat(m.replace(/[^\d.]/g, '')) }))
    .filter(p => !isNaN(p.value) && p.value > 0 && p.value <= 9999)
    .sort((a, b) => a.value - b.value);
  // Dedup by numeric value, keep first display
  const seen = new Set();
  const out = [];
  for (const p of amounts) {
    if (seen.has(p.value)) continue;
    seen.add(p.value);
    out.push(p);
    if (out.length >= 6) break;
  }
  return out;
}

function findSocials(html) {
  const grab = (re) => { const m = html.match(re); return m ? m[1] : null; };
  return {
    twitter:  grab(/(?:twitter|x)\.com\/(?!share|intent|home)([a-zA-Z0-9_]{1,16})/i),
    github:   grab(/github\.com\/([a-zA-Z0-9_-]+)(?:["\/?#]|$)/i),
    linkedin: grab(/linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i),
    youtube:  grab(/youtube\.com\/(?:@|c\/|channel\/)([a-zA-Z0-9_-]+)/i),
    discord:  grab(/discord\.gg\/([a-zA-Z0-9]+)/i),
    producthunt: grab(/producthunt\.com\/(?:products|posts)\/([a-z0-9-]+)/i),
  };
}

function findApps(html) {
  const ios = html.match(/apps\.apple\.com\/[a-z]{2}\/app\/[^"'\s/?]+\/id(\d+)/i);
  const android = html.match(/play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/i);
  const chrome = html.match(/chrome\.google\.com\/webstore\/detail\/[^"'\s/?]+\/([a-z0-9]+)/i);
  return {
    ios:     ios     ? ios[1]     : null,
    android: android ? android[1] : null,
    chrome:  chrome  ? chrome[1]  : null,
  };
}

function hostnameKey(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./,''); }
  catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = req.query.url;
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return res.status(400).json({ error: 'Missing or invalid url' });
  }
  const host = hostnameKey(rawUrl);
  if (!host) return res.status(400).json({ error: 'Invalid url' });

  const cacheKey = `sm_site_${host}`;
  const cached = await redisGet(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ data: cached });
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const t0 = Date.now();
    const r = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MRRketBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    const elapsed = Date.now() - t0;

    if (!r.ok) {
      const data = { ok: false, status: r.status, latencyMs: elapsed, url: rawUrl };
      await redisSet(cacheKey, data, 3600); // 1h for failed responses
      await recordRun('site', false, `${host}: HTTP ${r.status}`);
      return res.status(200).json({ data });
    }

    const html = (await r.text()).slice(0, 350_000); // hard cap to avoid memory blowups
    const finalUrl = r.url || rawUrl;
    const titleMatch = html.match(/<title[^>]*>([^<]+)/i);
    const data = {
      ok: true,
      status: r.status,
      latencyMs: elapsed,
      url: rawUrl,
      finalUrl,
      title:        titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : null,
      ogTitle:      parseMeta(html, 'og:title', true),
      ogDescription:parseMeta(html, 'og:description', true),
      ogImage:      parseMeta(html, 'og:image', true),
      description:  parseMeta(html, 'description'),
      themeColor:   parseMeta(html, 'theme-color'),
      tech:         detectTech(html, r.headers),
      pricing:      extractPricing(html),
      hasFreeTrial: /\b(free trial|start free|try free|14[-\s]?day free)\b/i.test(html),
      hasDemo:      /\b(book a demo|request a demo|schedule a demo|get a demo)\b/i.test(html),
      hasPricing:   /\/pricing\b/i.test(html) || /Pricing/i.test(html),
      hasAPI:       /\/(api|docs|developers)\b/i.test(html) || /API documentation/i.test(html),
      socials:      findSocials(html),
      apps:         findApps(html),
      screenshotUrl:`https://image.thum.io/get/width/720/${encodeURIComponent(rawUrl)}`,
    };

    await redisSet(cacheKey, data, CACHE_TTL);
    await recordRun('site', true, host);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ data });
  } catch (e) {
    await recordRun('site', false, `${host}: ${(e && e.name === 'AbortError') ? 'timeout' : (e.message || 'fetch_error')}`);
    return res.status(200).json({ data: { ok: false, error: (e && e.name === 'AbortError') ? 'timeout' : (e.message || 'fetch_error'), url: rawUrl } });
  }
}
