// Admin API for /admin.html. Caller must be authenticated AND have
// profiles.role = 'admin' (granted manually — see supabase-admin-migration.sql).
//
// GET  ?section=overview&days=30     — daily traffic + signups + KPI counters
// GET  ?section=parsers              — scraper/cron run status (last/next run, count, ok)
// GET  ?section=listings             — seller listing requests (keys masked)
// GET  ?section=users                — individual registrations (auth users + role)
// GET  ?section=reveal_key&id=<uuid> — decrypt one stored payment-provider key
// GET  ?section=topviews&days=30     — most-viewed startups (registered + guests)
// POST { action:'set_status', id, status } — update a listing request status
// POST { action:'delete_listing', id }     — permanently delete a listing request
// POST { action:'hide_user', id }          — exclude a registration from analytics
// POST { action:'restore_user', id }       — bring a hidden registration back
//
// hide_user does NOT touch Supabase — it only adds the user id to a Redis set
// (sm_adm_hidden_users). The account stays; it's just subtracted from the user
// counts / signup breakdown and moved to the "hidden" list in the panel. This
// lets the owner keep test signups out of the stats without deleting real users.

import { redisPipeline, sb, getUser, supaConfigured, decryptSecret } from './_lib.js';
import { adminBoard, adminSetVotes, adminRebuild, setConfig } from './_votes.js';

function baseUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ['new', 'processing', 'listed', 'rejected'];
const HIDDEN_USERS_KEY = 'sm_adm_hidden_users';   // Redis SET of user ids kept out of analytics

async function hiddenUserIds() {
  const pipe = await redisPipeline([['SMEMBERS', HIDDEN_USERS_KEY]]);
  const arr = pipe && pipe[0] && pipe[0].result;
  return Array.isArray(arr) ? arr : [];
}

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
  for (const d of dates) cmds.push(['GET', `sm_pv_${d}`], ['PFCOUNT', `sm_uv_${d}`], ['PFCOUNT', `sm_ruv_${d}`]);
  const pipe = (await redisPipeline(cmds)) || [];
  const traffic = dates.map((date, i) => ({
    date,
    pageviews:    parseInt(pipe[i * 3] && pipe[i * 3].result, 10) || 0,
    visitors:     parseInt(pipe[i * 3 + 1] && pipe[i * 3 + 1].result, 10) || 0,
    regVisitors:  parseInt(pipe[i * 3 + 2] && pipe[i * 3 + 2].result, 10) || 0,
  }));

  let signups = [], totalUsers = null, listingCounts = {};
  const since = dates[0];
  const [rpc, usersCnt, listings] = await Promise.all([
    sb('/rest/v1/rpc/admin_signups', { method: 'POST', body: { since } }),
    sb('/rest/v1/profiles?select=id&limit=1', { headers: { Prefer: 'count=exact' } }),
    sb('/rest/v1/listing_requests?select=status'),
  ]);
  if (rpc.ok && Array.isArray(rpc.data)) signups = rpc.data;
  totalUsers = rangeTotal(usersCnt.headers);
  if (listings.ok && Array.isArray(listings.data)) {
    for (const row of listings.data) listingCounts[row.status] = (listingCounts[row.status] || 0) + 1;
  }

  // Exclude registrations the admin has hidden (Redis set) from the counts. We
  // look up their created_at so the per-day signup breakdown drops them too.
  const hidden = await hiddenUserIds();
  if (hidden.length) {
    let hiddenRows = [];
    const { ok, data } = await sb(`/rest/v1/profiles?id=in.(${hidden.join(',')})&select=created_at`);
    if (ok && Array.isArray(data)) hiddenRows = data;
    const hiddenN = hiddenRows.length || hidden.length;
    if (totalUsers != null) totalUsers = Math.max(0, totalUsers - hiddenN);
    if (hiddenRows.length) {
      const decByDay = {};
      for (const row of hiddenRows) {
        const d = String(row.created_at || '').slice(0, 10);
        if (d) decByDay[d] = (decByDay[d] || 0) + 1;
      }
      signups = signups
        .map(s => ({ day: s.day, signups: Math.max(0, s.signups - (decByDay[String(s.day)] || 0)) }))
        .filter(s => s.signups > 0);
    }
  }

  return res.status(200).json({ traffic, signups, totalUsers, listingCounts });
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
  { id:'catalog', name:'Каталог — ночной свод', source:'GitHub Actions', scheduleText:'Каждый день в 03:00 UTC', sched:{ m:0, h:[3] }, maxRunMin:25,
    desc:'Тянет весь каталог из TrustMRR API (~7400 стартапов, ~150 страниц) в Redis, пересчитывает суммарные метрики и пишет дневные снимки в Supabase. Полный свод идёт ~8 мин — поэтому вынесен в GitHub Actions (на Vercel Hobby лимит 60 с обрывал его на середине).' },
  { id:'daily-revenue', name:'Графики дневной выручки', source:'GitHub Actions', scheduleText:'Каждые 3 ч (00–21 UTC)', sched:{ m:0, h:[0,3,6,9,12,15,18,21] }, maxRunMin:160,
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

// Schedule adherence: list every run the parser was DUE to make inside [startMs, now]
// and whether a successful run actually covered it. GitHub Actions fires late, so a
// run claims the most recent due slot at/just before it. State per due slot:
//   ok      — a successful run covered it
//   fail    — a run was attributed but reported failure
//   late    — no run yet, overdue past the grace window, but the NEXT due run hasn't
//             come yet (could still arrive — GitHub is often late)
//   missed  — no run, and the next due run already passed → definitively skipped
//   pending — just due, still inside the grace window (GitHub lag is normal)
function expectedRuns(sched, logArr, startMs, nowMs) {
  if (!sched) return null;
  const DAY = 86400000;
  const hours = [...sched.h].sort((a, b) => a - b);
  const exp = [];
  for (let base = startMs - DAY; base <= nowMs + DAY; base += DAY) {
    const d = new Date(base);
    for (const h of hours) {
      const ts = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, sched.m, 0, 0);
      if (ts >= startMs && ts <= nowMs) exp.push(ts);
    }
  }
  exp.sort((a, b) => a - b);
  if (!exp.length) return [];

  // Grace = how long a run may lag its slot before we flag it overdue. Capped at 3h
  // so a clearly-skipped run surfaces the same day instead of hiding as "pending".
  let spacing = DAY;
  if (exp.length >= 2) spacing = Math.min(...exp.slice(1).map((t, i) => t - exp[i]));
  const grace = Math.min(Math.max(spacing - 30 * 60000, 3600000), 3 * 3600000);

  const state = exp.map(() => ({ ran: false, ok: false }));
  for (const rawE of logArr) {
    let e; try { e = JSON.parse(rawE); } catch { continue; }
    if (!e || typeof e.t !== 'number') continue;
    let idx = -1;                                   // latest due slot at/just before this run
    for (let i = 0; i < exp.length; i++) { if (exp[i] <= e.t + 3600000) idx = i; else break; }
    if (idx >= 0) { state[idx].ran = true; if (e.ok) state[idx].ok = true; }
  }
  return exp.map((ts, i) => {
    const nextDue = exp[i + 1] != null ? exp[i + 1] : ts + spacing;
    let s;
    if (state[i].ok)            s = 'ok';
    else if (state[i].ran)      s = 'fail';
    else if (nowMs > nextDue)   s = 'missed';   // the following scheduled run already came
    else if (nowMs > ts + grace) s = 'late';    // overdue, but the window is still open
    else                        s = 'pending';
    return { ts, state: s };
  });
}

const HIST_HOURS = 72; // 3-day history window, hourly buckets
const HOUR_MS = 3600000;

async function parsers(res) {
  const day = new Date().toISOString().slice(0, 10);
  const cmds = [];
  // 4 commands per parser: last-run blob, today's counter, run log (chart), in-flight marker
  for (const p of PARSERS) cmds.push(
    ['GET', `sm_parser_${p.id}`],
    ['GET', `sm_parser_${p.id}_n_${day}`],
    ['LRANGE', `sm_parser_${p.id}_log`, '0', '-1'],
    ['GET', `sm_parser_${p.id}_run`],
  );
  const pipe = (await redisPipeline(cmds)) || [];
  const nowMs = Date.now();
  const startH = Math.floor(nowMs / HOUR_MS) - (HIST_HOURS - 1);
  const list = PARSERS.map((p, i) => {
    const base = i * 4;
    let st = null;
    const raw = pipe[base] && pipe[base].result;
    if (raw) { try { const o = JSON.parse(raw); st = (o && typeof o === 'object' && o.value) ? JSON.parse(o.value) : o; } catch {} }
    const tRaw = pipe[base + 1] && pipe[base + 1].result;
    // Bucket the run log into hourly slots over the last 3 days.
    const logArr = (pipe[base + 2] && pipe[base + 2].result) || [];
    // In-flight marker (written at run start, cleared at run end). If it lingers past
    // the parser's max expected runtime, the last run started but never finished
    // (crash / timeout) — distinct from a clean failure that recorded ok:false.
    let running = null;
    const runRaw = pipe[base + 3] && pipe[base + 3].result;
    if (runRaw) {
      let ro = null;
      try { const o = JSON.parse(runRaw); ro = (o && typeof o === 'object' && o.value) ? JSON.parse(o.value) : o; } catch {}
      if (ro && ro.startedAt) {
        const ageMin = Math.round((nowMs - ro.startedAt) / 60000);
        running = { startedAt: new Date(ro.startedAt).toISOString(), ageMin, stale: ageMin > (p.maxRunMin || 180) };
      }
    }
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
      attempted: st && st.attempted != null ? st.attempted : null,
      note:    st && st.note ? st.note : null,
      today:   tRaw != null ? (parseInt(tRaw, 10) || 0) : null,
      running,
      history: { startMs: startH * HOUR_MS, hourMs: HOUR_MS, hours: HIST_HOURS, buckets },
      expected: expectedRuns(p.sched, logArr, startH * HOUR_MS, nowMs),
    };
  });
  return res.status(200).json({ parsers: list });
}

// ── Bot-visit audit ("ИИ-боты" tab) ──────────────────────────────────────────
// middleware.js logs every AI/search crawler that reaches /startup/* or /sitemap.xml
// into Redis hashes: sm_botvisits_total (all-time), sm_botvisits_last (last-seen ms),
// sm_botvisits_d_<date> (per-day). We surface totals, last-seen and a 30-day trend so
// you can see which answer engines actually crawl the site — and which never show up.
const BOT_GROUPS = {
  ai: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User',
       'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'Amazonbot', 'Applebot', 'Bytespider',
       'CCBot', 'Meta-ExternalAgent'],
  search: ['Googlebot', 'Bingbot', 'DuckDuckBot', 'YandexBot'],
};

// Upstash HGETALL comes back as a flat [field, value, …] array over the REST pipeline
// (same shape as ZRANGE … WITHSCORES); tolerate an object form too, just in case.
function hashToObj(res) {
  const a = (res && res.result) || [];
  const o = {};
  if (Array.isArray(a)) { for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = a[i + 1]; }
  else if (a && typeof a === 'object') Object.assign(o, a);
  return o;
}

async function botvisits(res) {
  const dates = lastDays(30);
  const cmds = [['HGETALL', 'sm_botvisits_total'], ['HGETALL', 'sm_botvisits_last']];
  for (const d of dates) cmds.push(['HGETALL', `sm_botvisits_d_${d}`]);
  const pipe = (await redisPipeline(cmds)) || [];
  const totals = hashToObj(pipe[0]);
  const lasts  = hashToObj(pipe[1]);
  const daily  = dates.map((_, i) => hashToObj(pipe[2 + i]));   // per-day { bot: count }

  const groupOf = n => BOT_GROUPS.ai.includes(n) ? 'ai' : BOT_GROUPS.search.includes(n) ? 'search' : 'other';
  // Every crawler we expect (so a no-show reads as "Никогда"), plus any that appeared.
  const all = new Set([...BOT_GROUPS.ai, ...BOT_GROUPS.search, ...Object.keys(totals), ...Object.keys(lasts)]);

  const bots = [...all].map(name => {
    const series = daily.map((day, i) => ({ date: dates[i], count: parseInt(day[name], 10) || 0 }));
    const sum = n => series.slice(-n).reduce((a, x) => a + x.count, 0);
    const lastMs = parseInt(lasts[name], 10);
    return {
      name, group: groupOf(name),
      total: parseInt(totals[name], 10) || 0,
      lastSeen: Number.isFinite(lastMs) ? new Date(lastMs).toISOString() : null,
      last7: sum(7), last30: sum(30),
      series,
    };
  }).sort((a, b) => (b.last30 - a.last30) || (b.total - a.total) || a.name.localeCompare(b.name));

  return res.status(200).json({ bots, days: dates });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  // Admin data is always live — never let a browser/CDN serve a stale copy
  // (registrations, traffic and parser status must reflect the current state).
  res.setHeader('Cache-Control', 'no-store');
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
      if (body.action === 'delete_listing') {
        if (!UUID_RE.test(String(body.id))) return res.status(400).json({ error: 'Bad id' });
        const { ok } = await sb(`/rest/v1/listing_requests?id=eq.${body.id}`, {
          method: 'DELETE',
          headers: { Prefer: 'return=minimal' },
        });
        return res.status(200).json({ ok });
      }
      // ── Votes ("Голоса" tab) ──────────────────────────────────────────────
      if (body.action === 'vote_set') {
        const r = await adminSetVotes(String(body.slug || ''), body.votes);
        return res.status(r.ok ? 200 : 400).json(r);
      }
      if (body.action === 'vote_config') {
        const cfg = await setConfig({ enabled: body.enabled, min: body.min, max: body.max, visible: body.visible });
        return res.status(200).json({ ok: true, config: cfg });
      }
      if (body.action === 'vote_rebuild') {
        const r = await adminRebuild({ baseUrl: baseUrl(req) });
        return res.status(200).json(r);
      }
      if (body.action === 'hide_user' || body.action === 'restore_user') {
        // Analytics-only: add/remove the user id in a Redis set. The Supabase
        // account is never touched — this just filters them out of the counts.
        const id = String(body.id || '');
        if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Bad id' });
        const cmd = body.action === 'hide_user' ? 'SADD' : 'SREM';
        const pipe = await redisPipeline([[cmd, HIDDEN_USERS_KEY, id]]);
        return res.status(200).json({ ok: !!pipe });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }

    const days = Math.min(Math.max(parseInt(req.query.days || '30', 10) || 30, 1), 90);
    switch (req.query.section) {
      case 'overview': return await overview(days, res);
      case 'parsers':  return await parsers(res);
      case 'botvisits': return await botvisits(res);
      case 'topviews': return await topviews(days, res);
      case 'votes':    return res.status(200).json(await adminBoard({ baseUrl: baseUrl(req) }));
      case 'listings': {
        const { ok, data } = await sb(
          '/rest/v1/listing_requests'
          + '?select=id,created_at,provider,api_key_hint,price,margin,anon,plan,status,email'
          + '&order=created_at.desc&limit=200'
        );
        return res.status(200).json({ listings: ok && Array.isArray(data) ? data : [] });
      }
      case 'users': {
        // Individual registrations, so test accounts can be excluded from stats.
        // Emails + timestamps come from the GoTrue admin API; role from profiles.
        // `hidden` = currently kept out of analytics (Redis set, reversible).
        const [au, prof, hidden] = await Promise.all([
          sb('/auth/v1/admin/users?page=1&per_page=200'),
          sb('/rest/v1/profiles?select=id,role'),
          hiddenUserIds(),
        ]);
        const roleById = {};
        if (prof.ok && Array.isArray(prof.data)) for (const p of prof.data) roleById[p.id] = p.role;
        const hiddenSet = new Set(hidden);
        const raw = au.ok && au.data && Array.isArray(au.data.users) ? au.data.users : [];
        const users = raw
          .map(u => ({
            id: u.id,
            email: u.email || null,
            created_at: u.created_at || null,
            last_sign_in_at: u.last_sign_in_at || null,
            role: roleById[u.id] || 'user',
            hidden: hiddenSet.has(u.id),
          }))
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        return res.status(200).json({ users, self: admin.id });
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
      case 'descriptions': {
        // Coverage of our rephrased + translated descriptions. Exact counts via
        // Prefer: count=exact (same trick as the overview counters). Resilient
        // to a not-yet-migrated `status` column: those counts come back null.
        const cnt = (filter) => sb(
          `/rest/v1/startup_descriptions?select=slug&limit=1${filter ? '&' + filter : ''}`,
          { headers: { Prefer: 'count=exact' } }
        );
        const [all, done, pending] = await Promise.all([cnt(''), cnt('status=eq.done'), cnt('status=eq.pending')]);
        return res.status(200).json({
          inTable: rangeTotal(all.headers),
          done:    rangeTotal(done.headers),
          pending: rangeTotal(pending.headers),
        });
      }
      default:
        return res.status(400).json({ error: 'Unknown section' });
    }
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
}
