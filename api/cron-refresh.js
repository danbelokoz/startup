// Runs daily to pre-warm Redis with fresh TrustMRR data.
// Triggered by Vercel Cron (vercel.json) and optionally GitHub Actions.
// Fetches ALL pages directly from TrustMRR and writes them to Redis,
// using the same cache key format as api/startups.js.

import { computeTotals } from './stats.js';
import { redisPipeline } from './_lib.js';

const FRESH_TTL = 82800; // 23 hour freshness window — must match api/startups.js
const DELAY_MS  = 3200;  // 3.2s between pages → ~18 req/min (limit is 20)

async function kv(method, path, body) {
  const url  = `${process.env.KV_REST_API_URL}${path}`;
  const opts = { method, headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(url, opts);
  return r.json();
}

async function redisSet(key, value, ttl) {
  try {
    const body = { value: JSON.stringify(value) };
    if (ttl) body.ex = ttl;
    await kv('POST', `/set/${encodeURIComponent(key)}`, body);
  } catch {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Records this run's status for the admin "Парсеры" tab (see api/admin.js):
// a "last run" blob + an entry in a 3-day run log (capped, auto-expiring).
async function recordParserRun(id, ok, count, note) {
  try {
    await redisSet(`sm_parser_${id}`, { ts: Date.now(), ok: !!ok, count: count || 0, note: String(note || '') });
    const logKey = `sm_parser_${id}_log`;
    await redisPipeline([
      ['LPUSH', logKey, JSON.stringify({ t: Date.now(), ok: ok ? 1 : 0, n: count || 0 })],
      ['LTRIM', logKey, '0', '999'],
      ['EXPIRE', logKey, '259200'], // 3 days
    ]);
  } catch {}
}

// Maps the public ?wf= name to its GitHub Actions workflow file.
const DISPATCH_WORKFLOWS = { scrape: 'scrape-daily-revenue.yml', catalog: 'refresh-cache.yml' };

// Fires a GitHub workflow_dispatch so a reliable external cron can drive the parsers
// (GitHub silently drops *schedule* runs, but never workflow_dispatch). Needs a
// fine-grained PAT in GH_DISPATCH_TOKEN (repo danbelokoz/startup, Actions: write).
async function dispatchWorkflow(req, res) {
  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) return res.status(500).json({ error: 'GH_DISPATCH_TOKEN not set' });
  const wfName = String(req.query.wf || '').toLowerCase();
  const wf = DISPATCH_WORKFLOWS[wfName];
  if (!wf) return res.status(400).json({ error: 'unknown wf', allowed: Object.keys(DISPATCH_WORKFLOWS) });

  // These workflows run ~8-min TrustMRR sweeps; firing them too often makes parallel
  // runs collide on the 20 req/min API limit and fail (exit 1 → GitHub failure email).
  // A misconfigured external cron (e.g. every 15 min) must not pile them up, so refuse
  // — with 200, so the caller doesn't see a failure — if one was dispatched within the
  // min gap. Redis SET NX EX is the lock; ?force=1 bypasses it; fail-open if Redis down.
  const minGapSec = wfName === 'catalog' ? 6 * 3600 : 2 * 3600;
  if (String(req.query.force || '') !== '1') {
    try {
      const lock = await kv('POST', `/set/${encodeURIComponent('sm_dispatch_' + wfName)}/1?NX=true&EX=${minGapSec}`);
      if (lock && lock.result === null) {
        return res.status(200).json({ ok: true, skipped: 'throttled', wf, minGapSec });
      }
    } catch {}
  }

  try {
    const r = await fetch(`https://api.github.com/repos/danbelokoz/startup/actions/workflows/${wf}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'startup-cron-dispatch',
      },
      body: JSON.stringify({ ref: 'main' }),
    });
    if (r.status === 204) return res.status(200).json({ ok: true, dispatched: wf });
    const body = await r.text();
    return res.status(502).json({ ok: false, status: r.status, body: body.slice(0, 300) });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String((e && e.message) || e).slice(0, 200) });
  }
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Lightweight dispatch mode: instead of the full ~8-min sweep, fire a GitHub
  // workflow_dispatch so a reliable external cron (cron-job.org) can drive the parsers
  // via /api/cron-refresh?op=dispatch&wf=scrape|catalog. workflow_dispatch runs are
  // NOT silently dropped the way GitHub's schedule trigger is.
  if ((req.query.op || '') === 'dispatch') return dispatchWorkflow(req, res);

  const apiKey = process.env.TRUSTMRR_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TRUSTMRR_API_KEY not set' });

  let page = 1, totalStartups = 0, hasMore = true;
  const allStartups = [];

  while (hasMore) {
    const params   = new URLSearchParams({ page, limit: 50, sort: 'revenue-desc' });
    const cacheKey = `sm_${params.toString()}`;
    const freshKey = `${cacheKey}_f`;

    let data;
    try {
      const r = await fetch(`https://trustmrr.com/api/v1/startups?${params}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (r.status === 401) { await recordParserRun('catalog', false, totalStartups, 'Неверный ключ TrustMRR API'); return res.status(500).json({ error: 'Invalid TrustMRR API key', page }); }
      if (!r.ok)            { await recordParserRun('catalog', false, totalStartups, `TrustMRR ${r.status} на стр. ${page}`); return res.status(500).json({ error: `TrustMRR ${r.status}`, page }); }
      data = await r.json();
    } catch (err) {
      await recordParserRun('catalog', false, totalStartups, `Ошибка на стр. ${page}: ${err.message}`);
      return res.status(500).json({ error: err.message, page });
    }

    await Promise.all([
      redisSet(cacheKey, data),
      redisSet(freshKey, 1, FRESH_TTL),
    ]);

    totalStartups += data.data?.length ?? 0;
    if (Array.isArray(data.data)) allStartups.push(...data.data);
    hasMore = data.meta?.hasMore ?? false;
    page++;

    if (hasMore) await sleep(DELAY_MS);
  }

  // Invalidate onSale aggregate so next request rebuilds from fresh data
  try { await kv('POST', `/del/${encodeURIComponent('sm_onsale_agg_revenue-desc')}`); } catch {}

  // Catalog-wide totals for the hero stats block (served by /api/stats)
  if (allStartups.length) {
    await redisSet('sm_totals_v1', { ...computeTotals(allStartups), updatedAt: new Date().toISOString() }, 25 * 3600);
  }

  // Write today's snapshots to Supabase for historical chart on detail page.
  let snapshotsWritten = 0;
  let snapshotsPruned = 0;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && allStartups.length) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = allStartups
      .filter(s => s && s.slug)
      .map(s => ({
        slug: s.slug,
        snap_date: today,
        mrr_cents: s.revenue && s.revenue.mrr != null ? Math.round(s.revenue.mrr) : null,
        rev30d_cents: s.revenue && s.revenue.last30Days != null ? Math.round(s.revenue.last30Days) : null,
        total_cents: s.revenue && s.revenue.total != null ? Math.round(s.revenue.total) : null,
        customers: s.customers ?? null,
        subscriptions: s.activeSubscriptions ?? null,
        growth30d: s.growth30d ?? null,
        visitors_30d: s.visitorsLast30Days ?? null,
      }));

    const supaHeaders = {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    };

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      try {
        const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/daily_snapshots?on_conflict=slug,snap_date`, {
          method: 'POST',
          headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(batch),
        });
        if (r.ok) snapshotsWritten += batch.length;
      } catch {}
    }

    // Prune snapshots older than 60 days to stay well within the Supabase free tier.
    try {
      const cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/daily_snapshots?snap_date=lt.${cutoff}`, {
        method: 'DELETE',
        headers: { ...supaHeaders, 'Prefer': 'return=representation,count=exact' },
      });
      if (r.ok) {
        const range = r.headers.get('content-range');
        if (range) snapshotsPruned = parseInt(range.split('/')[1], 10) || 0;
      }
    } catch {}
  }

  await recordParserRun('catalog', true, totalStartups, `${page - 1} стр. · снимков в Supabase: ${snapshotsWritten}`);
  return res.status(200).json({ ok: true, pages: page - 1, startups: totalStartups, snapshots: snapshotsWritten, pruned: snapshotsPruned });
}
