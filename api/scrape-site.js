// Scrapes a startup's own website for buyer-relevant signals that TrustMRR
// doesn't expose: OG image/title/description, detected tech stack from HTML +
// HTTP headers, pricing tier hints, social presence (GitHub/X/LinkedIn),
// iOS/Android app store IDs.
//
// One call per detail page view. Results are cached in Redis for 7 days
// since startup websites change much less than their revenue metrics.

import { redisPipeline } from './_lib.js';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

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

// Records this run for the admin "Парсеры" tab + per-UTC-day counters.
//
// Three outcomes, and the distinction matters: a startup's own site answering 403/404
// or timing out is NOT a parser failure — it's the normal state of the web (plenty of
// sites block bots outright), and we simply have nothing to show for that card. Only a
// break on OUR side is a failure. Lumping the two together painted the parser red
// permanently: one 403 from someone else's server and the whole card read "завершился
// с ошибкой" while it was happily parsing hundreds of other sites.
//
//   'ok'          → site parsed        → counter sm_parser_site_n_<day>
//   'unreachable' → their site said no → counter sm_parser_site_bad_<day>, still ok:true
//   'fail'        → our side broke     → ok:false (this is what should turn the card red)
async function recordRun(id, outcome, note) {
  try {
    const unreachable = outcome === 'unreachable';
    const ok = outcome !== 'fail';
    await redisSet(`sm_parser_${id}`, { ts: Date.now(), ok, unreachable, count: 1, note: String(note || '') });
    const day = new Date().toISOString().slice(0, 10);
    const k = `sm_parser_${id}_${unreachable ? 'bad' : 'n'}_${day}`;
    await kv('POST', `/incrby/${encodeURIComponent(k)}/1`);
    await kv('POST', `/expire/${encodeURIComponent(k)}/172800`);
    const logKey = `sm_parser_${id}_log`;
    await redisPipeline([
      // u:1 marks "their site, not us" so the admin chart doesn't colour the hour as a failure.
      ['LPUSH', logKey, JSON.stringify({ t: Date.now(), ok: ok ? 1 : 0, n: unreachable ? 0 : 1, u: unreachable ? 1 : 0 })],
      ['LTRIM', logKey, '0', '999'],
      ['EXPIRE', logKey, '259200'], // 3 days
    ]);
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

// The Redis cache key must distinguish different listings hosted on the SAME
// domain. App Store (apps.apple.com), Play Store (play.google.com), itch.io,
// Gumroad, etc. all share one hostname across every app and differ only by
// path — keying on hostname alone let the first-scraped app poison the cache
// for every other app on that host (e.g. Tariq served Stat AI's OG data).
// Root-path sites (the common case, a startup's own domain) still key by host
// alone; deeper paths fold the path in so they don't collide.
function siteCacheKey(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    const disc = path && path !== '/'
      ? '_' + path.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80)
      : '';
    return `sm_site3_${host}${disc}`;
  } catch { return null; }
}

// ── SSRF guard ────────────────────────────────────────────────────────────────
// The endpoint fetches a caller-supplied URL, so without this it's an open proxy:
// anyone could point it at internal services or the cloud-metadata endpoint. We
// reject any target that resolves to a private / loopback / link-local / metadata
// address, AND re-validate every redirect hop (a public URL can otherwise 302 us
// into the internal network). Vercel's egress currently blocks these too, but that
// must not be the only line of defence.
function ipv4ToInt(ip) {
  const p = ip.split('.').map(Number);
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}
function isPrivateV4(ip) {
  const n = ipv4ToInt(ip);
  const inRange = (base, bits) => (n >>> (32 - bits)) === (ipv4ToInt(base) >>> (32 - bits));
  return inRange('10.0.0.0', 8) || inRange('172.16.0.0', 12) || inRange('192.168.0.0', 16)
      || inRange('127.0.0.0', 8) || inRange('169.254.0.0', 16) // loopback + link-local/metadata
      || inRange('100.64.0.0', 10) || inRange('0.0.0.0', 8) || inRange('192.0.0.0', 24)
      || inRange('198.18.0.0', 15) || inRange('192.0.2.0', 24) // benchmarking + TEST-NET
      || inRange('224.0.0.0', 4)  || inRange('240.0.0.0', 4);  // multicast + reserved
}
function isPrivateIp(ip) {
  if (net.isIP(ip) === 4) return isPrivateV4(ip);
  const v = String(ip).toLowerCase();
  if (v === '::1' || v === '::') return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
  if (mapped) return isPrivateV4(mapped[1]);
  if (v.startsWith('fe80') || v.startsWith('fec0')) return true; // link-local
  if (v.startsWith('fd00:ec2')) return true;                     // AWS IPv6 metadata
  const head = parseInt(v.split(':')[0] || '0', 16);
  if ((head & 0xfe00) === 0xfc00) return true;                   // fc00::/7 unique-local
  return false;
}
// Reject obvious internal names and any host whose DNS records point at a private IP.
async function assertPublicHost(hostname) {
  // URL.hostname keeps IPv6 literals bracketed (e.g. "[::1]") — strip them so
  // net.isIP recognises the address and we block it directly instead of leaking
  // it into a DNS lookup.
  const h = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')
      || h.endsWith('.internal') || h === 'metadata.google.internal') {
    throw new Error('blocked_host');
  }
  if (net.isIP(h)) {
    if (isPrivateIp(h)) throw new Error('blocked_ip');
    return;
  }
  const addrs = await lookup(h, { all: true });
  if (!addrs.length) throw new Error('dns_empty');
  for (const a of addrs) if (isPrivateIp(a.address)) throw new Error('blocked_ip');
}
// fetch() that follows redirects manually, validating the host of EVERY hop before
// connecting — so a public URL can't bounce the request to an internal address.
async function safeFetch(startUrl, opts, maxRedirects = 4) {
  let url = startUrl;
  for (let i = 0; i <= maxRedirects; i++) {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad_scheme');
    await assertPublicHost(u.hostname);
    const r = await fetch(url, { ...opts, redirect: 'manual' });
    const loc = r.status >= 300 && r.status < 400 && r.headers.get('location');
    if (!loc) return r;
    url = new URL(loc, url).toString();
  }
  throw new Error('too_many_redirects');
}
const BLOCK_RE = /^(blocked_|bad_scheme|dns_empty|too_many_redirects)/;

// ── Per-IP rate limit (fail-OPEN) ─────────────────────────────────────────────
// Each call makes an outbound fetch, so an unthrottled public endpoint is a cost /
// abuse vector. A human browsing triggers ~1 call per startup (then 7d cached), so
// 30/min is generous. Internal warmup calls carry the shared secret and skip this.
function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.headers['x-real-ip'] || '';
}
async function rateOk(ip, limit, windowSec) {
  if (!ip) return true;
  const slot = Math.floor(Date.now() / (windowSec * 1000));
  const key = `sm_rl_scrape_${ip}_${slot}`;
  const r = await redisPipeline([['INCR', key], ['EXPIRE', key, String(windowSec * 2)]]);
  const n = r && r[0] && Number(r[0].result);
  return !Number.isFinite(n) || n <= limit;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Internal warmup calls (warmup-sites.js) carry the shared secret and skip the
  // public rate limit, so a bulk pre-warm of the whole catalog isn't throttled.
  const internal = !!process.env.CRON_SECRET && req.headers['x-sm-internal'] === process.env.CRON_SECRET;
  if (!internal && !(await rateOk(clientIp(req), 30, 60))) {
    res.setHeader('Retry-After', '30');
    return res.status(429).json({ error: 'Too many requests' });
  }

  // ── Logo proxy ────────────────────────────────────────────────────────────
  // TrustMRR startup logos live on a CloudFront host that serves them without any
  // `Access-Control-Allow-Origin` header. That's fine for a plain <img>, but the
  // card generator (/card.html) needs a CORS-clean image so html2canvas can bake
  // it into the exported PNG without tainting the canvas. Re-serving the bytes from
  // our own origin (with ACAO:* already set above) makes crossorigin="anonymous"
  // succeed. safeFetch() keeps this from becoming an SSRF hole.
  const logoUrl = req.query.logo;
  if (logoUrl) {
    if (!/^https?:\/\//i.test(logoUrl)) return res.status(400).json({ error: 'Invalid logo url' });
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      let r;
      try {
        r = await safeFetch(logoUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StartupMarketBot/1.0)', 'Accept': 'image/*' },
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const ct = r.headers.get('content-type') || '';
      if (!r.ok || !/^image\//i.test(ct)) return res.status(404).json({ error: 'Not an image' });
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 3_000_000) return res.status(413).json({ error: 'Logo too large' });
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');
      return res.status(200).send(buf);
    } catch (e) {
      return res.status(BLOCK_RE.test(e.message) ? 400 : 502).json({ error: 'logo_fetch_failed' });
    }
  }

  const rawUrl = req.query.url;
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return res.status(400).json({ error: 'Missing or invalid url' });
  }
  const host = hostnameKey(rawUrl);
  if (!host) return res.status(400).json({ error: 'Invalid url' });

  const cacheKey = siteCacheKey(rawUrl); // v3: keyed by host+path — v2 keyed by host alone, colliding all App Store / Play Store apps
  const cached = await redisGet(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({ data: cached });
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const t0 = Date.now();
    let r;
    try {
      r = await safeFetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StartupMarketBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const elapsed = Date.now() - t0;

    if (!r.ok) {
      const data = { ok: false, status: r.status, latencyMs: elapsed, url: rawUrl };
      await redisSet(cacheKey, data, 3600); // 1h for failed responses
      // Their server, their rules (403 = bot-blocked, 404 = dead link) — not our failure.
      await recordRun('site', 'unreachable', `${host}: HTTP ${r.status} — сайт не отдал страницу`);
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
    };

    await redisSet(cacheKey, data, CACHE_TTL);
    await recordRun('site', 'ok', host);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ data });
  } catch (e) {
    // SSRF guard rejection — don't log it as a parser failure, just refuse.
    if (e && BLOCK_RE.test(e.message || '')) {
      return res.status(400).json({ error: 'Blocked or unreachable target' });
    }
    // A timeout / DNS failure / refused connection is the target site being unavailable,
    // not our parser breaking — same bucket as a 403.
    const why = (e && e.name === 'AbortError') ? 'timeout' : (e.message || 'fetch_error');
    await recordRun('site', 'unreachable', `${host}: ${why === 'timeout' ? 'таймаут — сайт не ответил' : why}`);
    return res.status(200).json({ data: { ok: false, error: why, url: rawUrl } });
  }
}
