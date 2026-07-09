// Shared "Startup of the Month" voting logic. Leading underscore = NOT deployed as
// its own Vercel function (Hobby 12-function limit — see CLAUDE.md). Imported by:
//   • intake.js  — GET /api/vote (public board) + POST /api/vote (cast, registered)
//   • admin.js   — section=votes (owner: adjust counts, see real voters, edit config)
//
// Everything lives in Redis (no SQL migration). Keys are per calendar month (`ym`),
// so the board resets on the 1st automatically as a new month's keys start empty:
//   sm_vset_<ym>   JSON [{slug,name,icon,mrr}]     — the 30 candidates (picked once)
//   sm_vdisp_<ym>  HASH {slug: displayedVotes}     — the number shown publicly
//   sm_vreal_<ym>  HASH {slug: realUserVotes}      — genuine registered-user votes only
//   sm_vby_<ym>    HASH {userId: JSON{slug,email,ts}} — who voted for what (1 vote/user)
//   sm_vauto_<ym>  string(ms)                       — when hourly auto-growth last ran
//   sm_vcfg        JSON {enabled,min,max}           — auto-growth config (global)
//
// Displayed votes = seeded organic base + hourly auto-growth + real votes + any manual
// admin adjustment, all folded into the one `disp` counter we mutate.

import { redisGet, redisSet, redisPipeline, getUser } from './_lib.js';

const SET_TTL   = 45 * 86400;   // month keys live ~45 days, then expire on their own
const CAND_N    = 30;
const CFG_KEY   = 'sm_vcfg';
const DEFAULT_CFG = { enabled: true, min: 1, max: 10, visible: true };
const AUTO_MAX_HOURS = 72;      // cap catch-up growth after a long idle gap

// ── month helpers (UTC) ───────────────────────────────────────────────────────
function monthCtx(now = new Date()) {
  const y = now.getUTCFullYear(), m = now.getUTCMonth();
  return {
    ym: `${y}-${String(m + 1).padStart(2, '0')}`,
    seed: (y * 100 + (m + 1)) >>> 0,
    endsAt: new Date(Date.UTC(y, m + 1, 1)).toISOString(),  // 1st of next month, 00:00 UTC
  };
}

// ── deterministic seeded RNG (stable "organic" base per slug+month) ───────────
function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function drawnBase(slug, seed) { const r = mulberry32((hashStr(slug) ^ (seed * 2654435761 >>> 0)) >>> 0); r(); return 40 + Math.floor(r() * 880); }

// Upstash HGETALL over the REST pipeline returns a flat [field,value,…] array.
function hashToObj(res) {
  const a = (res && res.result) || [];
  const o = {};
  if (Array.isArray(a)) { for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = a[i + 1]; }
  else if (a && typeof a === 'object') Object.assign(o, a);
  return o;
}

function isAnonName(name) {
  const n = String(name || '').trim().toLowerCase();
  return !n || n.includes('anonymous');
}

// ── config ────────────────────────────────────────────────────────────────────
export async function getConfig() {
  const c = await redisGet(CFG_KEY);
  if (!c || typeof c !== 'object') return { ...DEFAULT_CFG };
  return {
    enabled: c.enabled !== false,
    min: Number.isFinite(+c.min) ? Math.max(0, Math.round(+c.min)) : DEFAULT_CFG.min,
    max: Number.isFinite(+c.max) ? Math.max(0, Math.round(+c.max)) : DEFAULT_CFG.max,
    visible: c.visible !== false,   // page is public unless the owner hides it
  };
}

export async function setConfig({ enabled, min, max, visible }) {
  const cur = await getConfig();
  let lo = Number.isFinite(+min) ? Math.max(0, Math.round(+min)) : cur.min;
  let hi = Number.isFinite(+max) ? Math.max(0, Math.round(+max)) : cur.max;
  if (hi < lo) [lo, hi] = [hi, lo];                 // tolerate swapped bounds
  const cfg = {
    enabled: enabled != null ? !!enabled : cur.enabled,
    min: lo, max: hi,
    visible: visible != null ? !!visible : cur.visible,
  };
  await redisSet(CFG_KEY, cfg);
  return cfg;
}

// Lightweight visibility check for callers that only need the public gate
// (e.g. /api/auth surfaces this to hide the nav link site-wide).
export async function isVoteVisible() {
  const cfg = await getConfig();
  return cfg.visible;
}

// ── candidate set (built once per month) ──────────────────────────────────────
// baseUrl lets the server reuse the SAME cached /api/startups pages the catalog
// uses, so we don't re-hit TrustMRR or reconstruct fragile cache keys.
async function fetchPool(baseUrl) {
  const urls = [
    `${baseUrl}/api/startups?sort=revenue-desc&limit=50`,
    `${baseUrl}/api/startups?sort=mrr-desc&limit=50`,
  ];
  const seen = new Set();
  const pool = [];
  const results = await Promise.all(urls.map(u => fetch(u).then(r => r.json()).catch(() => null)));
  for (const j of results) {
    for (const x of (j && j.data) || []) {
      if (!x || !x.slug || seen.has(x.slug)) continue;
      if (isAnonName(x.name)) continue;                       // no stealth listings
      const rev = x.revenue || {};
      if (Number(rev.last30Days || 0) <= 1000) continue;      // revenue > $1000
      seen.add(x.slug);
      pool.push({ slug: x.slug, name: x.name, icon: x.icon || null, mrr: Number(rev.mrr || 0) });
    }
  }
  return pool;
}

async function buildSet(baseUrl, ctx) {
  // Best-effort lock so concurrent first-visitors don't all rebuild the set.
  const lock = await redisPipeline([['SET', `sm_vlock_${ctx.ym}`, '1', 'NX', 'EX', '30']]);
  const gotLock = lock && lock[0] && (lock[0].result === 'OK');
  if (!gotLock) {
    const existing = await redisGet(`sm_vset_${ctx.ym}`);
    if (Array.isArray(existing) && existing.length) return existing;
    // Someone else is mid-build; nothing yet — caller returns an empty board and the
    // client retries a moment later.
  }
  const pool = await fetchPool(baseUrl);
  if (!pool.length) return [];
  // Deterministic monthly shuffle → take 30.
  const rng = mulberry32(ctx.seed);
  for (let i = pool.length - 1; i > 0; i--) { const k = Math.floor(rng() * (i + 1)); [pool[i], pool[k]] = [pool[k], pool[i]]; }
  const cand = pool.slice(0, CAND_N);
  await redisSet(`sm_vset_${ctx.ym}`, cand, SET_TTL);
  // Seed each with its organic base (HSETNX = never clobber if it already exists),
  // then stamp the auto-growth clock so the first hour hasn't "passed" yet.
  const cmds = [];
  for (const c of cand) cmds.push(['HSETNX', `sm_vdisp_${ctx.ym}`, c.slug, String(drawnBase(c.slug, ctx.seed))]);
  cmds.push(['EXPIRE', `sm_vdisp_${ctx.ym}`, String(SET_TTL)]);
  await redisPipeline(cmds);
  await redisSet(`sm_vauto_${ctx.ym}`, Date.now(), SET_TTL);
  return cand;
}

async function ensureSet(baseUrl, ctx) {
  const existing = await redisGet(`sm_vset_${ctx.ym}`);
  if (Array.isArray(existing) && existing.length) return existing;
  return buildSet(baseUrl, ctx);
}

// ── hourly auto-growth (lazy, applied on read) ────────────────────────────────
// Each whole hour since the last run adds a random [min,max] to every candidate.
// No cron needed: the next reader applies whatever hours have elapsed. Capped so a
// long idle gap can't dump a huge jump at once.
async function applyAutoGrowth(ctx, cand) {
  const cfg = await getConfig();
  if (!cfg.enabled || cfg.max <= 0 || !cand.length) return;
  const last = Number(await redisGet(`sm_vauto_${ctx.ym}`)) || 0;
  if (!last) { await redisSet(`sm_vauto_${ctx.ym}`, Date.now(), SET_TTL); return; }
  const now = Date.now();
  let hours = Math.floor((now - last) / 3600000);
  if (hours < 1) return;
  hours = Math.min(hours, AUTO_MAX_HOURS);
  // Advance the clock FIRST (best-effort dedupe against a concurrent reader), keeping
  // the leftover minutes so cadence doesn't drift.
  await redisSet(`sm_vauto_${ctx.ym}`, last + hours * 3600000, SET_TTL);
  const span = cfg.max - cfg.min + 1;
  const cmds = [];
  for (const c of cand) {
    let add = 0;
    for (let h = 0; h < hours; h++) add += cfg.min + Math.floor(Math.random() * span);
    if (add > 0) cmds.push(['HINCRBY', `sm_vdisp_${ctx.ym}`, c.slug, String(add)]);
  }
  if (cmds.length) await redisPipeline(cmds);
}

// ── public board (GET /api/vote) ──────────────────────────────────────────────
export async function getBoard({ baseUrl, token }) {
  const ctx = monthCtx();
  // Owner can take the page down: return a hidden marker instead of the board.
  const cfg = await getConfig();
  if (!cfg.visible) return { ym: ctx.ym, endsAt: ctx.endsAt, candidates: [], hidden: true };

  const cand = await ensureSet(baseUrl, ctx);
  if (!cand.length) return { ym: ctx.ym, endsAt: ctx.endsAt, candidates: [], total: 0, myVote: null, building: true };

  await applyAutoGrowth(ctx, cand);

  const pipe = await redisPipeline([['HGETALL', `sm_vdisp_${ctx.ym}`]]);
  const disp = hashToObj(pipe && pipe[0]);

  let myVote = null;
  if (token) {
    const user = await getUser(token);
    if (user) {
      const p = await redisPipeline([['HGET', `sm_vby_${ctx.ym}`, user.id]]);
      const raw = p && p[0] && p[0].result;
      if (raw) { try { myVote = JSON.parse(raw).slug; } catch { myVote = null; } }
    }
  }

  const candidates = cand.map(c => ({
    slug: c.slug, name: c.name, icon: c.icon, mrr: c.mrr,
    votes: Number(disp[c.slug]) || drawnBase(c.slug, ctx.seed),
  })).sort((a, b) => b.votes - a.votes || String(a.name).localeCompare(String(b.name)));

  const total = candidates.reduce((s, c) => s + c.votes, 0);
  return { ym: ctx.ym, endsAt: ctx.endsAt, candidates, total, myVote, updatedAt: Date.now() };
}

// ── cast a vote (POST /api/vote, registered users only) ───────────────────────
export async function castVote({ token, slug }) {
  const ctx = monthCtx();
  const cfg = await getConfig();
  if (!cfg.visible) return { status: 403, body: { error: 'Voting is closed' } };
  const user = await getUser(token);
  if (!user) return { status: 401, body: { error: 'Sign in to vote' } };

  const cand = await redisGet(`sm_vset_${ctx.ym}`);
  if (!Array.isArray(cand) || !cand.some(c => c.slug === slug)) {
    return { status: 400, body: { error: 'Unknown candidate' } };
  }

  // One vote per user per month: HSETNX succeeds only the first time.
  const rec = JSON.stringify({ slug, email: user.email || null, ts: Date.now() });
  const guard = await redisPipeline([
    ['HSETNX', `sm_vby_${ctx.ym}`, user.id, rec],
    ['EXPIRE', `sm_vby_${ctx.ym}`, String(SET_TTL)],
  ]);
  const fresh = guard && guard[0] && Number(guard[0].result) === 1;
  if (!fresh) {
    const p = await redisPipeline([['HGET', `sm_vby_${ctx.ym}`, user.id]]);
    let prev = null; try { prev = JSON.parse(p[0].result).slug; } catch {}
    return { status: 200, body: { ok: false, already: true, myVote: prev } };
  }

  const inc = await redisPipeline([
    ['HINCRBY', `sm_vdisp_${ctx.ym}`, slug, '1'],
    ['HINCRBY', `sm_vreal_${ctx.ym}`, slug, '1'],
    ['EXPIRE', `sm_vreal_${ctx.ym}`, String(SET_TTL)],
  ]);
  const votes = inc && inc[0] ? Number(inc[0].result) : null;
  return { status: 200, body: { ok: true, myVote: slug, votes } };
}

// ── admin view + controls (admin.js section=votes) ────────────────────────────
export async function adminBoard({ baseUrl }) {
  const ctx = monthCtx();
  const cand = await ensureSet(baseUrl, ctx);
  await applyAutoGrowth(ctx, cand);

  const pipe = await redisPipeline([
    ['HGETALL', `sm_vdisp_${ctx.ym}`],
    ['HGETALL', `sm_vreal_${ctx.ym}`],
    ['HGETALL', `sm_vby_${ctx.ym}`],
  ]);
  const disp = hashToObj(pipe && pipe[0]);
  const real = hashToObj(pipe && pipe[1]);
  const by   = hashToObj(pipe && pipe[2]);
  const cfg  = await getConfig();

  const candidates = cand.map(c => ({
    slug: c.slug, name: c.name, icon: c.icon, mrr: c.mrr,
    votes: Number(disp[c.slug]) || drawnBase(c.slug, ctx.seed),
    real: Number(real[c.slug]) || 0,
  })).sort((a, b) => b.votes - a.votes);

  // Real voters and what they chose (most recent first).
  const nameBySlug = Object.fromEntries(cand.map(c => [c.slug, c.name]));
  const voters = Object.entries(by).map(([userId, raw]) => {
    let v = {}; try { v = JSON.parse(raw); } catch {}
    return { userId, email: v.email || null, slug: v.slug || null, name: nameBySlug[v.slug] || v.slug || null, ts: v.ts || null };
  }).sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return {
    ym: ctx.ym,
    endsAt: ctx.endsAt,
    config: cfg,
    candidates,
    voters,
    realTotal: candidates.reduce((s, c) => s + c.real, 0),
    dispTotal: candidates.reduce((s, c) => s + c.votes, 0),
  };
}

// Set the displayed vote count for one candidate to an absolute value.
export async function adminSetVotes(slug, votes) {
  const ctx = monthCtx();
  const cand = await redisGet(`sm_vset_${ctx.ym}`);
  if (!Array.isArray(cand) || !cand.some(c => c.slug === slug)) return { ok: false, error: 'Unknown candidate' };
  const v = Math.max(0, Math.round(Number(votes) || 0));
  await redisPipeline([['HSET', `sm_vdisp_${ctx.ym}`, slug, String(v)], ['EXPIRE', `sm_vdisp_${ctx.ym}`, String(SET_TTL)]]);
  return { ok: true, slug, votes: v };
}

// Force the current month's set to be re-picked (e.g. to refresh the 30 candidates).
export async function adminRebuild({ baseUrl }) {
  const ctx = monthCtx();
  await redisPipeline([['DEL', `sm_vset_${ctx.ym}`]]);   // disp/real/by kept; new set re-seeds bases via HSETNX
  const cand = await buildSet(baseUrl, ctx);
  return { ok: true, count: cand.length };
}
