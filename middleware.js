// Vercel Edge Middleware — server-side rendering for crawlers + dynamic sitemap.
//
// WHY: the startup detail page (template at /sp.html) renders its content client-side
// via JS from /api/startup. AI/answer-engine crawlers (GPTBot, ClaudeBot, Perplexity…)
// and most social unfurlers do NOT execute JS, so they'd only ever see "Loading…".
// Here we detect those bots and inject real <title>/meta/OG + JSON-LD (Product +
// breadcrumbs) + a server-rendered #content block, so the listing is readable and
// citable. Humans are untouched: they get the raw template (fast) and the existing JS
// renders as before.
//
// NO external deps and the template lives OUTSIDE /startup/* (at /sp.html), so a
// template fetch can never re-enter this middleware → no loops, no @vercel/edge needed.
// If anything throws, we fall back to returning the raw template (current behaviour).

export const config = {
  matcher: ['/startup/:path*', '/sitemap.xml'],
};

const SITE = 'https://startupmarket.tech';
const TEMPLATE_PATH = '/sp.html'; // static copy of the detail page, not under /startup/

// AI crawlers, search bots and social unfurlers. Generic bot|crawl|spider catches the
// long tail; the explicit names catch crawlers whose UA has no such token (claude-web,
// anthropic-ai, perplexity, applebot…).
const BOT_RE = /bot|crawl|spider|gptbot|chatgpt|oai-searchbot|ccbot|claude|anthropic|perplexity|google-extended|googlebot|bingbot|applebot|amazonbot|bytespider|duckduck|yandex|baidu|facebookexternal|meta-external|twitter|slack|linkedin|telegram|discord|whatsapp|embedly|quora|pinterest/i;

function isBot(ua) { return !!ua && BOT_RE.test(ua); }

// ── tiny escapers ─────────────────────────────────────────────────────────────
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function jsonld(obj) {
  // Drop </script> breakouts and HTML-comment starts inside the JSON literal.
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
function fmt(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v).toLocaleString('en-US') : '0';
}
function titleFromSlug(slug) {
  return String(slug || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}
function clamp(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

// ── Redis (Upstash REST) — same wire format as api/_lib.js (value JSON-wrapped) ──
async function redisGet(key) {
  const url = process.env.KV_REST_API_URL, tok = process.env.KV_REST_API_TOKEN;
  if (!url || !tok) return null;
  try {
    const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const j = await r.json();
    if (!j || j.result == null) return null;
    const parsed = JSON.parse(j.result);
    return (parsed && parsed.value !== undefined) ? JSON.parse(parsed.value) : parsed;
  } catch { return null; }
}

// One round-trip for the rate-limit counter.
async function redisCmd(commands) {
  const url = process.env.KV_REST_API_URL, tok = process.env.KV_REST_API_TOKEN;
  if (!url || !tok) return null;
  try {
    const r = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

function clientIp(req) {
  const xff = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return xff || req.headers.get('x-real-ip') || '';
}

// Fixed-window per-IP limiter. Fail-OPEN: any Redis hiccup → allowed, so a counter
// outage never blocks real users. The slot is baked into the key so it self-expires.
async function rateOk(bucket, ip, limit, windowSec) {
  if (!ip) return true;
  const slot = Math.floor(Date.now() / (windowSec * 1000));
  const key = `sm_rl_${bucket}_${ip}_${slot}`;
  const res = await redisCmd([['INCR', key], ['EXPIRE', key, String(windowSec * 2)]]);
  const n = res && res[0] && Number(res[0].result);
  return !Number.isFinite(n) || n <= limit;
}

// Known-slug set, cached in this edge instance's memory for 5 min so we don't read the
// ~7k-slug list from Redis on every request. Source: sm_sitemap_slugs (catalog sweep).
let _slugCache = { ts: 0, set: null };
async function getKnownSlugs() {
  if (_slugCache.set && Date.now() - _slugCache.ts < 300000) return _slugCache.set;
  const arr = await redisGet('sm_sitemap_slugs');
  _slugCache = { ts: Date.now(), set: Array.isArray(arr) ? new Set(arr) : null };
  return _slugCache.set;
}

// Gate the upstream render. Returns false ONLY when we have a populated allowlist AND
// the slug is neither in it nor already in the data cache — i.e. almost certainly a
// bogus/cache-busting slug, so we skip the API hit (protects upstream TrustMRR).
// Permissive (true) until the first catalog sweep fills the list, so SSR is never
// blocked during bootstrap.
async function slugWorthRendering(slug) {
  const set = await getKnownSlugs();
  if (!set || set.size === 0) return true;
  if (set.has(slug)) return true;
  const cached = await redisGet(`sm_startup_${slug}`); // a fresh listing already loaded?
  return !!(cached && (cached.data || cached.slug));
}

// ── /sitemap.xml ────────────────────────────────────────────────────────────────
let _sitemapCache = { ts: 0, xml: null };
const SITEMAP_HEADERS = {
  'content-type': 'application/xml; charset=utf-8',
  'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
};
async function sitemap() {
  // Reuse the built XML for 10 min so a flood of /sitemap.xml can't make us re-read the
  // ~7k-slug list and re-serialise ~600 KB on every hit.
  if (_sitemapCache.xml && Date.now() - _sitemapCache.ts < 600000) {
    return new Response(_sitemapCache.xml, { headers: SITEMAP_HEADERS });
  }
  const staticUrls = [`${SITE}/`, `${SITE}/catalog`, `${SITE}/top.html`, `${SITE}/acquire.html`, `${SITE}/faq`];
  const out = staticUrls.map(u => `<url><loc>${u}</loc></url>`);
  const slugs = await redisGet('sm_sitemap_slugs'); // written by scripts/refresh-catalog.js
  if (Array.isArray(slugs)) {
    for (const s of slugs) {
      if (s) out.push(`<url><loc>${SITE}/startup/${encodeURIComponent(s)}</loc></url>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${out.join('\n')}\n</urlset>`;
  _sitemapCache = { ts: Date.now(), xml };
  return new Response(xml, { headers: SITEMAP_HEADERS });
}

// ── SSR injection for a startup detail page ──────────────────────────────────────
function injectSeo(html, s, slug) {
  const name = (s.name && String(s.name).trim()) || titleFromSlug(slug);
  const pageUrl = `${SITE}/startup/${encodeURIComponent(slug)}`;
  const img = (s.icon && String(s.icon)) || `${SITE}/apple-touch-icon.png`;
  const category = s.category ? String(s.category) : '';
  const onSale = !!s.onSale;
  const price = Number(s.askingPrice) || 0;
  const rev = s.revenue || {};
  const mrr = Number(rev.mrr) || 0;
  const rev30 = Number(rev.last30Days) || 0;
  const total = Number(rev.total) || 0;
  const customers = Number(s.customers) || 0;
  const isMoR = !!s.isMerchantOfRecord;          // acquirer/platform: figures are GMV, not revenue
  const revLabel = isMoR ? 'GMV' : 'Revenue';
  const title = `${name} - Startup Market`;

  const baseDesc = (s.description && String(s.description).trim()) ||
    `${name} - a ${onSale ? 'for-sale ' : ''}startup${category ? ' in ' + category : ''} on Startup Market, with revenue read directly from its payment provider.`;
  const metaDesc = clamp(baseDesc, 300);

  // ── meta + OG + Twitter ──
  const head =
    `<meta name="description" content="${esc(metaDesc)}"/>` +
    `<link rel="canonical" href="${pageUrl}"/>` +
    `<meta property="og:type" content="product"/>` +
    `<meta property="og:site_name" content="Startup Market"/>` +
    `<meta property="og:url" content="${pageUrl}"/>` +
    `<meta property="og:title" content="${esc(title)}"/>` +
    `<meta property="og:description" content="${esc(metaDesc)}"/>` +
    `<meta property="og:image" content="${esc(img)}"/>` +
    `<meta name="twitter:card" content="summary"/>` +
    `<meta name="twitter:title" content="${esc(title)}"/>` +
    `<meta name="twitter:description" content="${esc(metaDesc)}"/>` +
    `<meta name="twitter:image" content="${esc(img)}"/>`;

  // ── JSON-LD: Product (+ Offer when on sale) and BreadcrumbList ──
  const props = [];
  if (mrr > 0) props.push({ '@type': 'PropertyValue', name: 'MRR', value: mrr, unitText: 'USD' });
  if (rev30 > 0) props.push({ '@type': 'PropertyValue', name: `${revLabel} (30 days)`, value: rev30, unitText: 'USD' });
  if (total > 0) props.push({ '@type': 'PropertyValue', name: `${revLabel} (all time)`, value: total, unitText: 'USD' });
  if (customers > 0) props.push({ '@type': 'PropertyValue', name: 'Customers', value: customers });

  const product = {
    '@context': 'https://schema.org', '@type': 'Product',
    name, description: baseDesc, url: pageUrl, image: img,
    category: category || undefined,
    brand: { '@type': 'Brand', name },
    additionalProperty: props.length ? props : undefined,
    offers: (onSale && price > 0) ? {
      '@type': 'Offer', price: Math.round(price), priceCurrency: 'USD',
      availability: 'https://schema.org/InStock', url: pageUrl,
    } : undefined,
  };
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Catalog', item: `${SITE}/catalog` },
      { '@type': 'ListItem', position: 3, name, item: pageUrl },
    ],
  };
  const ld =
    `<script type="application/ld+json">${jsonld(product)}</script>` +
    `<script type="application/ld+json">${jsonld(breadcrumb)}</script>`;

  // ── server-rendered #content (real text for JS-less crawlers) ──
  const li = [];
  if (mrr > 0) li.push(`<li>MRR: $${fmt(mrr)}</li>`);
  if (rev30 > 0) li.push(`<li>${revLabel} (30 days): $${fmt(rev30)}</li>`);
  if (total > 0) li.push(`<li>${revLabel} (all time): $${fmt(total)}</li>`);
  if (customers > 0) li.push(`<li>Customers: ${fmt(customers)}</li>`);
  if (onSale && price > 0) li.push(`<li>Asking price: $${fmt(price)}${s.multiple ? ` (${esc(Number(s.multiple).toFixed(2))}x)` : ''}</li>`);
  if (s.website) li.push(`<li>Website: <a href="${esc(s.website)}" rel="nofollow">${esc(String(s.website).replace(/^https?:\/\//, ''))}</a></li>`);

  const body =
    `<article>` +
    `<h1>${esc(name)}</h1>` +
    (category || onSale ? `<p>${esc(category)}${category && onSale ? ' · ' : ''}${onSale ? 'For sale' : ''}</p>` : '') +
    `<p>${esc(baseDesc)}</p>` +
    (li.length ? `<ul>${li.join('')}</ul>` : '') +
    `</article>`;

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace('</head>', `${head}${ld}</head>`);

  const LOADING = '<div id="content"><div class="loading-state"><h3>Loading...</h3></div></div>';
  if (out.includes(LOADING)) out = out.replace(LOADING, `<div id="content">${body}</div>`);
  return out;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const templateUrl = `${origin}${TEMPLATE_PATH}`;

  try {
    if (url.pathname === '/sitemap.xml') return await sitemap();

    // Everything else here is a /startup/<slug> request (per matcher).
    const slug = decodeURIComponent(
      url.pathname.replace(/^\/startup\/?/, '').replace(/\/+$/, '')
    ).trim();

    // Humans (and slug-less hits): serve the raw template fast — JS renders as today.
    if (!slug || !isBot(request.headers.get('user-agent'))) {
      return fetch(templateUrl);
    }

    // ── bot path, with cheap DoS guards ──
    const ip = clientIp(request);
    // Cap how fast one IP can trigger a server-side render. Over the limit → raw
    // template (page still works via JS); fail-soft, never a hard error.
    if (!(await rateOk('ssr', ip, 240, 60))) return fetch(templateUrl);
    // Skip the upstream render for bogus/cache-busting slugs (protects TrustMRR).
    if (!(await slugWorthRendering(slug))) return fetch(templateUrl);

    // Render. The /api/startup call is marked internal (CRON_SECRET) so that endpoint's
    // own limiter doesn't double-count it — this request is already capped above.
    const [tplRes, apiRes] = await Promise.all([
      fetch(templateUrl),
      fetch(`${origin}/api/startup?slug=${encodeURIComponent(slug)}`, {
        headers: { 'x-sm-internal': process.env.CRON_SECRET || '' },
      }),
    ]);
    const html = await tplRes.text();
    let data = null;
    try { data = (await apiRes.json())?.data; } catch {}
    if (!data || !data.slug) {
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    return new Response(injectSeo(html, data, slug), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        'vary': 'User-Agent',
        'x-ssr': 'bot',
      },
    });
  } catch {
    // Any failure → behave exactly like before (raw template, client renders).
    return fetch(templateUrl);
  }
}
