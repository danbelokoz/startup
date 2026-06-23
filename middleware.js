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

// ── /sitemap.xml ────────────────────────────────────────────────────────────────
async function sitemap() {
  const staticUrls = [`${SITE}/`, `${SITE}/catalog`, `${SITE}/top.html`, `${SITE}/acquire.html`];
  const out = staticUrls.map(u => `<url><loc>${u}</loc></url>`);
  const slugs = await redisGet('sm_sitemap_slugs'); // written by scripts/refresh-catalog.js
  if (Array.isArray(slugs)) {
    for (const s of slugs) {
      if (s) out.push(`<url><loc>${SITE}/startup/${encodeURIComponent(s)}</loc></url>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${out.join('\n')}\n</urlset>`;
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
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
  const title = `${name} — Startup Market`;

  const baseDesc = (s.description && String(s.description).trim()) ||
    `${name} — a ${onSale ? 'for-sale ' : ''}startup${category ? ' in ' + category : ''} on Startup Market, with revenue read directly from its payment provider.`;
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

    // Bot: fetch template + data, inject SEO, return server-rendered HTML.
    const [tplRes, apiRes] = await Promise.all([
      fetch(templateUrl),
      fetch(`${origin}/api/startup?slug=${encodeURIComponent(slug)}`),
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
