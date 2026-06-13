// Admin API for /admin.html. Caller must be authenticated AND have
// profiles.role = 'admin' (granted manually — see supabase-admin-migration.sql).
//
// GET  ?section=overview&days=30     — daily traffic + signups + KPI counters
// GET  ?section=parsers              — scraper/cron run status (last/next run, count, ok)
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

// ── Parsers status ("Парсеры" tab) ───────────────────────────────────────────
// Each scraper/cron writes sm_parser_<id> = {ts,ok,count,note} to Redis on every
// run (see cron-refresh.js, enrich.js, scrape-site.js, scripts/scrape-daily-revenue.js).
// On-demand parsers also keep a per-UTC-day counter sm_parser_<id>_n_<date>.
const PARSERS = [
  { id:'catalog', name:'Каталог — ночной свод', source:'Vercel Cron', scheduleText:'Каждый день в 03:00 UTC', sched:{ m:0, h:[3] },
    desc:'Тянет все страницы каталога из TrustMRR API в Redis, пересчитывает суммарные метрики и пишет дневные снимки в Supabase для графиков.' },
  { id:'daily-revenue', name:'Графики дневной выручки', source:'GitHub Actions', scheduleText:'Дважды в день — 04:00 и 16:00 UTC', sched:{ m:0, h:[4,16] },
    desc:'Скрейпит графики дневной выручки со страниц TrustMRR (Puppeteer) и пишет их в Supabase. За запуск обрабатывает ротационный батч; стартапы на продаже в приоритете.' },
  { id:'enrich', name:'AI-обогащение (TrustMRR)', source:'Vercel · по запросу', scheduleText:'При открытии карточки · кэш 24 ч', sched:null,
    desc:'Достаёт доп. поля с публичной страницы TrustMRR: AI-описание, теги, Acquire Score, соцсети. Запускается при открытии карточки стартапа, если кэш устарел.' },
  { id:'site', name:'Сайты стартапов', source:'Vercel · по запросу', scheduleText:'При открытии карточки · кэш 7 дней', sched:null,
    desc:'Парсит сайт самого стартапа: скриншот, OG-теги, тех-стек, цены, соцсети, мобильные приложения. Запускается при открытии карточки.' },
];

// Next UTC occurrence for a simple {minute, hours[]} daily schedule.
function nextRunISO(sched) {
  if (!sched) return null;
  const now = Date.now();
  const hours = [...sched.h].sort((a, b) => a - b);
  for (let addDays = 0; addDays <= 1; addDays++) {
    const base = new Date(now);
    for (const h of hours) {
      const t = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + addDays, h, sched.m, 0, 0);
      if (t > now) return new Date(t).toISOString();
    }
  }
  return null;
}

const HIST_HOURS = 72; // 3-day history window, hourly buckets
const HOUR_MS = 3600000;

async function parsers(res) {
  const day = new Date().toISOString().slice(0, 10);
  const cmds = [];
  // 3 commands per parser: last-run blob, today's counter, run log (for the chart)
  for (const p of PARSERS) cmds.push(
    ['GET', `sm_parser_${p.id}`],
    ['GET', `sm_parser_${p.id}_n_${day}`],
    ['LRANGE', `sm_parser_${p.id}_log`, '0', '-1'],
  );
  const pipe = (await redisPipeline(cmds)) || [];
  const startH = Math.floor(Date.now() / HOUR_MS) - (HIST_HOURS - 1);
  const list = PARSERS.map((p, i) => {
    const base = i * 3;
    let st = null;
    const raw = pipe[base] && pipe[base].result;
    if (raw) { try { const o = JSON.parse(raw); st = (o && typeof o === 'object' && o.value) ? JSON.parse(o.value) : o; } catch {} }
    const tRaw = pipe[base + 1] && pipe[base + 1].result;
    // Bucket the run log into hourly slots over the last 3 days.
    const logArr = (pipe[base + 2] && pipe[base + 2].result) || [];
    const buckets = Array.from({ length: HIST_HOURS }, () => ({ runs: 0, ok: 0, n: 0 }));
    for (const rawE of logArr) {
      let e; try { e = JSON.parse(rawE); } catch { continue; }
      if (!e || typeof e.t !== 'number') continue;
      const idx = Math.floor(e.t / HOUR_MS) - startH;
      if (idx < 0 || idx >= HIST_HOURS) continue;
      buckets[idx].runs++; buckets[idx].ok += (e.ok ? 1 : 0); buckets[idx].n += (e.n || 0);
    }
    return {
      id: p.id, name: p.name, desc: p.desc, source: p.source, scheduleText: p.scheduleText,
      onDemand: !p.sched,
      nextRun: nextRunISO(p.sched),
      lastRun: st && st.ts ? new Date(st.ts).toISOString() : null,
      ok:      st ? !!st.ok : null,
      count:   st && st.count != null ? st.count : null,
      note:    st && st.note ? st.note : null,
      today:   tRaw != null ? (parseInt(tRaw, 10) || 0) : null,
      history: { startMs: startH * HOUR_MS, hourMs: HOUR_MS, hours: HIST_HOURS, buckets },
    };
  });
  return res.status(200).json({ parsers: list });
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
      case 'parsers':  return await parsers(res);
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
