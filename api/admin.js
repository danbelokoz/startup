// Admin API for /admin.html. Caller must be authenticated AND have
// profiles.role = 'admin' (granted manually — see supabase-admin-migration.sql).
//
// GET  ?section=overview&days=30     — daily traffic + signups + KPI counters
// GET  ?section=listings             — seller listing requests (keys masked)
// GET  ?section=reveal_key&id=<uuid> — decrypt one stored payment-provider key
// GET  ?section=topviews&days=30     — most-viewed startups (registered + guests)
// GET  ?section=waitlist             — Pro waitlist emails
// POST { action:'set_status', id, status } — update a listing request status

import { redisPipeline, sb, getUser, supaConfigured, decryptSecret } from './_lib.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ['new', 'processing', 'listed', 'rejected'];

async function requireAdmin(req) {
  if (!supaConfigured()) return null;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || null;
  const user = await getUser(token);
  if (!user) return null;
  const { ok, data } = await sb(`/rest/v1/profiles?id=eq.${user.id}&select=role`);
  return (ok && Array.isArray(data) && data[0] && data[0].role === 'admin') ? user : null;
}

function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

function rangeTotal(headers) {
  // PostgREST puts the exact count in Content-Range: "0-0/123"
  const range = headers && headers.get && headers.get('content-range');
  const total = range && range.split('/')[1];
  return total && total !== '*' ? parseInt(total, 10) : null;
}

async function overview(days, res) {
  const dates = lastDays(days);

  const cmds = [];
  for (const d of dates) cmds.push(['GET', `sm_pv_${d}`], ['PFCOUNT', `sm_uv_${d}`]);
  const pipe = (await redisPipeline(cmds)) || [];
  const traffic = dates.map((date, i) => ({
    date,
    pageviews: parseInt(pipe[i * 2] && pipe[i * 2].result, 10) || 0,
    visitors:  parseInt(pipe[i * 2 + 1] && pipe[i * 2 + 1].result, 10) || 0,
  }));

  let signups = [], totalUsers = null, listingCounts = {}, waitlistTotal = null;
  const since = dates[0];
  const [rpc, usersCnt, listings, wlCnt] = await Promise.all([
    sb('/rest/v1/rpc/admin_signups', { method: 'POST', body: { since } }),
    sb('/rest/v1/profiles?select=id&limit=1', { headers: { Prefer: 'count=exact' } }),
    sb('/rest/v1/listing_requests?select=status'),
    sb('/rest/v1/waitlist?select=id&limit=1', { headers: { Prefer: 'count=exact' } }),
  ]);
  if (rpc.ok && Array.isArray(rpc.data)) signups = rpc.data;
  totalUsers = rangeTotal(usersCnt.headers);
  if (listings.ok && Array.isArray(listings.data)) {
    for (const row of listings.data) listingCounts[row.status] = (listingCounts[row.status] || 0) + 1;
  }
  waitlistTotal = rangeTotal(wlCnt.headers);

  return res.status(200).json({ traffic, signups, totalUsers, listingCounts, waitlistTotal });
}

async function topviews(days, res) {
  const dates = lastDays(days);
  const pipe = (await redisPipeline(dates.map(d => ['ZRANGE', `sm_sv_${d}`, 0, -1, 'WITHSCORES']))) || [];
  const guests = {};
  for (const p of pipe) {
    const a = (p && p.result) || [];
    for (let i = 0; i + 1 < a.length; i += 2) {
      guests[a[i]] = (guests[a[i]] || 0) + Number(a[i + 1]);
    }
  }

  const reg = {};
  const r = await sb('/rest/v1/rpc/admin_top_views', { method: 'POST', body: { since: dates[0] } });
  if (r.ok && Array.isArray(r.data)) for (const row of r.data) reg[row.slug] = Number(row.views) || 0;

  const slugs = new Set([...Object.keys(guests), ...Object.keys(reg)]);
  const top = [...slugs]
    .map(slug => ({ slug, guests: guests[slug] || 0, registered: reg[slug] || 0, total: (guests[slug] || 0) + (reg[slug] || 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 50);
  return res.status(200).json({ top });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: 'Admin only' });

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (body.action === 'set_status') {
        if (!UUID_RE.test(String(body.id)) || !STATUSES.includes(body.status)) {
          return res.status(400).json({ error: 'Bad id or status' });
        }
        const { ok } = await sb(`/rest/v1/listing_requests?id=eq.${body.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: { status: body.status },
        });
        return res.status(200).json({ ok });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }

    const days = Math.min(Math.max(parseInt(req.query.days || '30', 10) || 30, 1), 90);
    switch (req.query.section) {
      case 'overview': return await overview(days, res);
      case 'topviews': return await topviews(days, res);
      case 'listings': {
        const { ok, data } = await sb(
          '/rest/v1/listing_requests'
          + '?select=id,created_at,provider,api_key_hint,price,margin,anon,plan,status,email'
          + '&order=created_at.desc&limit=200'
        );
        return res.status(200).json({ listings: ok && Array.isArray(data) ? data : [] });
      }
      case 'reveal_key': {
        const id = String(req.query.id || '');
        if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Bad id' });
        const { ok, data } = await sb(`/rest/v1/listing_requests?id=eq.${id}&select=api_key_enc`);
        const enc = ok && Array.isArray(data) && data[0] ? data[0].api_key_enc : null;
        if (!enc) return res.status(200).json({ key: null, note: 'not_stored' });
        const key = await decryptSecret(enc);
        return res.status(200).json({ key, note: key ? undefined : 'decrypt_failed' });
      }
      case 'waitlist': {
        const { ok, data } = await sb('/rest/v1/waitlist?select=email,source,created_at&order=created_at.desc&limit=500');
        return res.status(200).json({ waitlist: ok && Array.isArray(data) ? data : [] });
      }
      default:
        return res.status(400).json({ error: 'Unknown section' });
    }
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
}
