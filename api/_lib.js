// Shared helpers for /api functions. The leading underscore keeps Vercel from
// deploying this file as a serverless function of its own (Hobby plan allows
// max 12 functions — see CLAUDE.md).

// ── Upstash Redis (REST) ──────────────────────────────────────────────────────
export async function kv(method, path, body) {
  const url = `${process.env.KV_REST_API_URL}${path}`;
  const opts = { method, headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(url, opts);
  return r.json();
}

export async function redisGet(key) {
  try {
    const r = await kv('GET', `/get/${encodeURIComponent(key)}`);
    if (!r.result) return null;
    const parsed = JSON.parse(r.result);
    if (parsed && parsed.value) return JSON.parse(parsed.value);
    return parsed;
  } catch { return null; }
}

export async function redisSet(key, value, ttl) {
  try {
    const body = { value: JSON.stringify(value) };
    if (ttl) body.ex = ttl;
    await kv('POST', `/set/${encodeURIComponent(key)}`, body);
  } catch {}
}

// Run many commands in one round-trip: [["INCR","k"],["PFCOUNT","u"],...]
// Returns [{ result: ... }, ...] in the same order, or null on failure.
export async function redisPipeline(commands) {
  try {
    const r = await fetch(`${process.env.KV_REST_API_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ── Per-IP rate limiting (fixed window, fail-OPEN) ───────────────────────────
// Shared by the public endpoints. Fail-open: any Redis hiccup → allowed, so a
// counter outage never blocks real visitors. `bucket` namespaces the counter so
// different endpoints don't share a budget.
export function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.headers['x-real-ip'] || '';
}
export async function rateOk(bucket, ip, limit, windowSec) {
  if (!ip) return true;
  const slot = Math.floor(Date.now() / (windowSec * 1000));
  const key = `sm_rl_${bucket}_${ip}_${slot}`;
  const r = await redisPipeline([['INCR', key], ['EXPIRE', key, String(windowSec * 2)]]);
  const n = r && r[0] && Number(r[0].result);
  return !Number.isFinite(n) || n <= limit;
}

// ── Supabase REST (service role unless userToken given) ──────────────────────
export function supaConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function sb(path, { method = 'GET', userToken, body, headers = {} } = {}) {
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}${path}`, {
      method,
      headers: {
        'apikey':        process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${userToken || process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type':  'application/json',
        ...headers,
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    const data = text ? JSON.parse(text) : null;
    return { ok: r.ok, status: r.status, data, headers: r.headers };
  } catch {
    return { ok: false, status: 500, data: null, headers: null };
  }
}

// Validate a Supabase JWT via /auth/v1/user — returns the user object or null.
export async function getUser(token) {
  if (!token) return null;
  const { ok, data } = await sb('/auth/v1/user', { userToken: token });
  return (ok && data && data.id) ? data : null;
}

// ── AES-256-GCM for secrets at rest (seller payment-provider API keys) ───────
// Key is derived from LISTING_KEY_SECRET (Vercel env). Format: "v1.<iv>.<ct>"
// in base64. Without the env secret, encryptSecret returns null — the intake
// endpoint then stores only the masked hint.
async function aesKey() {
  const secret = process.env.LISTING_KEY_SECRET;
  if (!secret) return null;
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plain) {
  try {
    const key = await aesKey();
    if (!key) return null;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
    return `v1.${Buffer.from(iv).toString('base64')}.${Buffer.from(ct).toString('base64')}`;
  } catch { return null; }
}

export async function decryptSecret(enc) {
  try {
    if (!enc || !enc.startsWith('v1.')) return null;
    const key = await aesKey();
    if (!key) return null;
    const [, ivB64, ctB64] = enc.split('.');
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: Buffer.from(ivB64, 'base64') },
      key,
      Buffer.from(ctB64, 'base64')
    );
    return new TextDecoder().decode(pt);
  } catch { return null; }
}
