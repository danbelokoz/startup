// Public write endpoints, merged into one function (Vercel Hobby 12-function
// limit). vercel.json rewrites map the friendly URLs here:
//   POST /api/sell-listing-intent → ?op=listing  — seller listing request
//   POST /api/waitlist            → ?op=waitlist — Pro waitlist email
//   POST /api/track               → ?op=track    — anonymous traffic beacon
//
// listing: the payment-provider API key is AES-256-GCM encrypted with
// LISTING_KEY_SECRET before it touches the DB; only /api/admin can decrypt.
// track: no cookies and no per-user rows — uniqueness comes from a salted
// sha256(ip|ua|day) that rotates daily. Counters live in Redis ~100 days.

import { redisPipeline, sb, getUser, supaConfigured, encryptSecret } from './_lib.js';

const COUNTER_TTL = 100 * 86400;
const BOT_RE = /bot|crawl|spider|preview|fetch|monitor|lighthouse|headless|curl|python/i;

function parseBody(req) {
  if (req.body == null) return {};
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (typeof fwd === 'string' && fwd.split(',')[0].trim()) || req.socket?.remoteAddress || '';
}

async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Buffer.from(buf).toString('hex');
}

// ── track ─────────────────────────────────────────────────────────────────────
async function handleTrack(req, res) {
  const ua = req.headers['user-agent'] || '';
  if (!ua || BOT_RE.test(ua)) return res.status(204).end();

  const body = parseBody(req);
  const page = typeof body.p === 'string' ? body.p.slice(0, 24) : 'other';
  const slug = typeof body.s === 'string' ? body.s.slice(0, 120) : '';
  const day  = new Date().toISOString().slice(0, 10);
  const vid  = await sha256hex(`${clientIp(req)}|${ua}|${day}|${process.env.CRON_SECRET || 'sm'}`);

  // Plain EXPIRE (no NX) for compatibility — keys are per-day, so refreshing the
  // TTL on every hit still means "gone ~100 days after the day ends".
  const cmds = [
    ['INCR', `sm_pv_${day}`],                 ['EXPIRE', `sm_pv_${day}`, COUNTER_TTL],
    ['PFADD', `sm_uv_${day}`, vid],           ['EXPIRE', `sm_uv_${day}`, COUNTER_TTL],
    ['HINCRBY', `sm_pages_${day}`, page, 1],  ['EXPIRE', `sm_pages_${day}`, COUNTER_TTL],
  ];
  if (slug) {
    cmds.push(['ZINCRBY', `sm_sv_${day}`, 1, slug], ['EXPIRE', `sm_sv_${day}`, COUNTER_TTL]);
  }
  const pipe = await redisPipeline(cmds);
  // Health check: ?debug=1 reports whether the Redis writes landed (no values leaked).
  if (req.query.debug === '1') {
    return res.status(200).json({
      pipeline: pipe ? 'ok' : 'failed',
      commands: cmds.length,
      errors: Array.isArray(pipe) ? pipe.filter(p => p && p.error).map(p => p.error) : ['no_response'],
    });
  }
  return res.status(204).end();
}

// ── waitlist ──────────────────────────────────────────────────────────────────
async function handleWaitlist(req, res) {
  if (!supaConfigured()) return res.status(200).json({ ok: false, note: 'not_configured' });
  const body = parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const source = String(body.source || 'unknown').slice(0, 60);
  const { ok } = await sb('/rest/v1/waitlist?on_conflict=email,source', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: { email, source },
  });
  return res.status(200).json({ ok });
}

// ── listing request ───────────────────────────────────────────────────────────
async function handleListing(req, res) {
  if (!supaConfigured()) return res.status(200).json({ ok: false, note: 'not_configured' });
  const body = parseBody(req);

  const provider = String(body.provider || '').slice(0, 40);
  const apiKey   = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  const price    = Number(body.price);
  const margin   = Number(body.margin);
  const plan     = ['starter', 'pro', 'premium'].includes(body.plan) ? body.plan : 'pro';
  if (!apiKey || apiKey.length > 300 || !isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Contact email: prefer explicitly provided, fall back to session email.
  const contactEmail = typeof body.contactEmail === 'string' && body.contactEmail.includes('@')
    ? body.contactEmail.trim().toLowerCase() : null;

  let userId = null, email = null;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || null;
  if (token) {
    const u = await getUser(token);
    if (u) { userId = u.id; email = u.email || null; }
  }
  if (contactEmail) email = contactEmail;

  const hint = apiKey.length > 14
    ? `${apiKey.slice(0, 7)}…${apiKey.slice(-4)} (${apiKey.length})`
    : `…(${apiKey.length})`;

  const { ok } = await sb('/rest/v1/listing_requests', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: {
      provider,
      api_key_enc:  await encryptSecret(apiKey), // null until LISTING_KEY_SECRET is set
      api_key_hint: hint,
      price:  isFinite(price)  ? price  : null,
      margin: isFinite(margin) ? margin : null,
      anon:   !!body.anon,
      plan,
      user_id: userId,
      email,
    },
  });
  return res.status(200).json({ ok });
}

// ── router ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    switch (req.query.op) {
      case 'track':    return await handleTrack(req, res);
      case 'waitlist': return await handleWaitlist(req, res);
      case 'listing':  return await handleListing(req, res);
      default:         return res.status(400).json({ error: 'Unknown op' });
    }
  } catch {
    // The beacon must never error loudly; forms get a generic failure.
    if (req.query.op === 'track') return res.status(204).end();
    return res.status(500).json({ error: 'Internal error' });
  }
}
