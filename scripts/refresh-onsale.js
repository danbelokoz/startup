#!/usr/bin/env node
// Rolling refresh of the for-sale listings — the marketplace's actual inventory.
//
// WHY THIS EXISTS:
// TrustMRR's list endpoint only ever paginates the first 200 startups of any query
// (see scripts/refresh-catalog.js). The nightly sweep works around that by harvesting
// five overlapping on-sale "windows", but they overlap so heavily that only ~750 of
// ~1990 listings actually get refreshed — the other ~1240 sat frozen at whatever we
// last saw, so sold/withdrawn listings lingered and prices went stale.
//
// The way through: fetching a startup BY NAME is not capped. We already know every
// slug, so we don't need the list endpoint at all — we just walk our own on-sale list
// a batch at a time. Spread over the day (8 runs), a full cycle takes ~1 day, which
// keeps the inventory genuinely current instead of two weeks old.
//
// Rate: the 10 req/min key is shared with the live site and the nightly sweep, so this
// deliberately uses only half of it and backs off on 429 rather than competing.
//
// Env: KV_REST_API_URL, KV_REST_API_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      TRUSTMRR_API_KEY

const KV_REST_API_URL           = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN         = process.env.KV_REST_API_TOKEN;
const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRUSTMRR_API_KEY          = process.env.TRUSTMRR_API_KEY;

const BATCH         = parseInt(process.env.BATCH || '260', 10);  // slugs per run; 8 runs/day ≈ full cycle
const DELAY_MS      = 12000;   // 12s → 5 req/min, half the quota; the rest stays for the live site
const RETRY_429     = 4;
const RETRY_WAIT_MS = 65000;   // a 429 needs the per-minute window to roll over

// ── Two sources, alternating by day ───────────────────────────────────────────
// TrustMRR publishes a machine-readable profile per startup at /startup/<slug>.md,
// explicitly labelled for AI agents. Verified field-by-field against the API on
// startups the sweep had just refreshed: 31 of 32 values identical (the one gap was
// a few hours of MRR drift). It carries MRR, revenue, subscriptions, sale status,
// asking price and multiple — and it is bound by neither the 200-item pagination cap
// nor the 10 req/min key quota, so it survives whatever TrustMRR does to the API next.
//
// We alternate day by day rather than switching outright: each source keeps proving
// itself in production, and if the .md format ever changes we lose a day's refresh,
// not the pipeline. The run's note records which source it used.
const MD_DELAY_MS = 2000;      // public page, not the API quota — polite but ~10x faster
// The .md omits a few fields the API has (customers, category), so parsed values are
// MERGED over the existing row instead of replacing it. Overwriting wholesale here
// would quietly blank those columns for every listing we touch.
const MD_FIELDS_NOTE = 'merge, not replace';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function pickSource() {
  if (process.env.SOURCE === 'api' || process.env.SOURCE === 'md') return process.env.SOURCE;
  // Alternate on UTC day number so a whole day uses one source and the two stay comparable.
  return Math.floor(Date.now() / 86400000) % 2 === 0 ? 'api' : 'md';
}

// Parse TrustMRR's public Markdown profile. Deliberately tolerant: every field is
// optional, and anything missing simply isn't merged. Treated purely as data —
// the file itself warns that founder-supplied text is untrusted content.
function parseMd(md) {
  const g = (re) => { const m = md.match(re); return m ? m[1].trim() : null; };
  const num = (s) => (s == null ? null : Number(String(s).replace(/[$,%]/g, '')));
  const out = {};
  const set = (k, v) => { if (v != null && !(typeof v === 'number' && Number.isNaN(v))) out[k] = v; };

  set('name', g(/^- Name:\s*(.+)$/m));
  // Trailing slash differs from the API's form; strip it so the two sources agree.
  const site = g(/^- Website:\s*\[([^\]]+)\]/m);
  set('website', site ? site.replace(/\/+$/, '') : null);
  set('icon', g(/^- Icon:\s*\[([^\]]+)\]/m));
  set('description', g(/^- Description:\s*(.+)$/m));
  set('country', g(/^- Country:\s*(.+)$/m));
  set('foundedDate', g(/^- Founded date:\s*(.+)$/m));

  const mrr   = num(g(/^- Current MRR:\s*\$?([\d,\.]+)/m));
  const rev30 = num(g(/^- Last 30 days revenue snapshot:\s*\$?([\d,\.]+)/m));
  const total = num(g(/^- All-time revenue snapshot:\s*\$?([\d,\.]+)/m));
  if (mrr != null || rev30 != null || total != null) {
    out.revenue = {};
    if (mrr   != null) out.revenue.mrr = mrr;
    if (rev30 != null) out.revenue.last30Days = rev30;
    if (total != null) out.revenue.total = total;
  }
  set('growthMRR30d', num(g(/^- Last 30 days MRR growth:\s*(-?[\d\.]+)/m)));
  set('growth30d',    num(g(/^- Last 30 days revenue growth:\s*(-?[\d\.]+)/m)));
  set('activeSubscriptions', num(g(/^- Current active subscriptions:\s*([\d,]+)/m)));

  const status = g(/^- Status:\s*(.+)$/m);
  if (status) out.onSale = /listed for sale/i.test(status);
  set('askingPrice', num(g(/^- Asking price:\s*\$?([\d,\.]+)/m)));
  const mult = g(/^- Revenue multiple:\s*([\d\.]+)x/m);
  set('multiple', mult ? Number(mult) : null);
  set('firstListedForSaleAt', g(/^- First listed for sale:\s*(.+)$/m));
  return out;
}

// ── Redis (Upstash REST) ──────────────────────────────────────────────────────
async function kv(method, path, body) {
  const opts = { method, headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(`${KV_REST_API_URL}${path}`, opts);
  return r.json();
}

// ── Parser status for the admin "Парсеры" tab ─────────────────────────────────
async function recordParserStart(id) {
  if (!KV_REST_API_URL) return;
  try {
    await fetch(`${KV_REST_API_URL}/set/${encodeURIComponent('sm_parser_' + id + '_run')}?EX=7200`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify({ startedAt: Date.now() }) }),
    });
  } catch {}
}
async function recordParserRun(id, ok, count, note, attempted) {
  if (!KV_REST_API_URL) return;
  try {
    const hdr = { Authorization: `Bearer ${KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' };
    const blob = { ts: Date.now(), ok: !!ok, count: count || 0, note: String(note || '') };
    if (typeof attempted === 'number') blob.attempted = attempted;
    await fetch(`${KV_REST_API_URL}/set/${encodeURIComponent('sm_parser_' + id)}`, {
      method: 'POST', headers: hdr, body: JSON.stringify({ value: JSON.stringify(blob) }),
    });
    await fetch(`${KV_REST_API_URL}/del/${encodeURIComponent('sm_parser_' + id + '_run')}`, {
      method: 'POST', headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
    }).catch(() => {});
    const logKey = 'sm_parser_' + id + '_log';
    await fetch(`${KV_REST_API_URL}/pipeline`, {
      method: 'POST', headers: hdr,
      body: JSON.stringify([
        ['LPUSH', logKey, JSON.stringify({ t: Date.now(), ok: ok ? 1 : 0, n: count || 0 })],
        ['LTRIM', logKey, '0', '999'],
        ['EXPIRE', logKey, '259200'],
      ]),
    });
  } catch {}
}

// ── Supabase ──────────────────────────────────────────────────────────────────
const SB_HEADERS = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

// Every listing we currently believe is for sale, in a stable order so the cursor
// walks the same sequence between runs.
async function readOnSaleSlugs() {
  const slugs = [];
  const PAGE = 1000;
  for (let p = 0; p < 20; p++) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/startup_archive?select=slug&data->>onSale=eq.true&order=slug.asc&limit=${PAGE}&offset=${p * PAGE}`,
      { headers: SB_HEADERS, signal: AbortSignal.timeout(30000) },
    );
    if (!r.ok) break;
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) break;
    for (const row of rows) if (row && row.slug) slugs.push(row.slug);
    if (rows.length < PAGE) break;
  }
  return slugs;
}

async function writeArchive(rows) {
  if (!rows.length) return 0;
  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/startup_archive?on_conflict=slug`, {
        method: 'POST',
        headers: { ...SB_HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(batch),
      });
      if (r.ok) written += batch.length;
      else console.log(`  ⚠ archive batch ${i} → ${r.status}`);
    } catch (e) { console.log(`  ⚠ archive batch ${i}: ${e.message}`); }
  }
  return written;
}

// Same self-healing deny-list api/startup.js maintains: a 404 means TrustMRR dropped
// the listing, a later success brings it back.
async function markDead(slug, dead) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/dead_startups?on_conflict=slug`, {
      method: dead ? 'POST' : 'DELETE',
      headers: { ...SB_HEADERS, Prefer: dead ? 'resolution=ignore-duplicates,return=minimal' : 'return=minimal' },
      ...(dead ? { body: JSON.stringify({ slug }) } : {}),
    });
  } catch {}
}
async function clearDead(slug) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/dead_startups?slug=eq.${encodeURIComponent(slug)}`, {
      method: 'DELETE', headers: { ...SB_HEADERS, Prefer: 'return=minimal' },
    });
  } catch {}
}

// ── TrustMRR detail (NOT subject to the 200-item pagination cap) ──────────────
async function fetchDetail(slug) {
  for (let attempt = 0; attempt <= RETRY_429; attempt++) {
    try {
      const r = await fetch(`https://trustmrr.com/api/v1/startups/${encodeURIComponent(slug)}`, {
        headers: { Authorization: `Bearer ${TRUSTMRR_API_KEY}` },
        signal: AbortSignal.timeout(20000),
      });
      if (r.status === 401) throw new Error('Неверный ключ TrustMRR API');
      if (r.status === 404) return { gone: true };
      if (r.status === 429) {
        if (attempt === RETRY_429) return { skipped: '429' };
        await sleep(RETRY_WAIT_MS);
        continue;
      }
      if (!r.ok) return { skipped: String(r.status) };
      const body = await r.json().catch(() => null);
      const data = body && (body.data || body);
      return (data && data.slug) ? { data } : { skipped: 'пустой ответ' };
    } catch (err) {
      if (/Неверный ключ/.test(err.message)) throw err;
      if (attempt === RETRY_429) return { skipped: err.message.slice(0, 40) };
      await sleep(RETRY_WAIT_MS);
    }
  }
  return { skipped: 'не удалось' };
}

// The .md route. 404 means the listing is gone, same as the API's 404.
async function fetchMd(slug) {
  try {
    const r = await fetch(`https://trustmrr.com/startup/${encodeURIComponent(slug)}.md`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StartupMarketBot/1.0)', Accept: 'text/markdown,text/plain' },
      signal: AbortSignal.timeout(20000),
    });
    if (r.status === 404) return { gone: true };
    if (!r.ok) return { skipped: String(r.status) };
    const text = await r.text();
    if (!text || text.length < 200) return { skipped: 'пустой файл' };
    const parsed = parseMd(text);
    return parsed && parsed.name ? { parsed } : { skipped: 'не разобрался' };
  } catch (e) {
    return { skipped: (e.message || 'ошибка').slice(0, 40) };
  }
}

// Existing rows for the batch, so .md values can be merged onto them rather than
// replacing fields the Markdown profile doesn't carry.
async function readExisting(slugs) {
  const map = new Map();
  for (let i = 0; i < slugs.length; i += 50) {
    const chunk = slugs.slice(i, i + 50);
    const list = chunk.map(s => `"${s.replace(/"/g, '')}"`).join(',');
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/startup_archive?slug=in.(${encodeURIComponent(list)})&select=slug,data`,
        { headers: SB_HEADERS, signal: AbortSignal.timeout(30000) },
      );
      if (!r.ok) continue;
      const rows = await r.json();
      if (Array.isArray(rows)) for (const row of rows) if (row && row.slug) map.set(row.slug, row.data || {});
    } catch {}
  }
  return map;
}

// Rotating window over the on-sale list, so consecutive runs cover different slugs and
// the whole inventory comes round about once a day.
async function nextOffset(total) {
  if (!KV_REST_API_URL || !total) return 0;
  try {
    const j = await kv('POST', `/incr/${encodeURIComponent('sm_onsale_cursor')}`);
    const n = typeof j.result === 'number' ? j.result : parseInt(j.result, 10);
    if (Number.isFinite(n)) return (((n - 1) * BATCH) % total + total) % total;
  } catch {}
  // Fallback: derive a window from the clock so a run without Redis still rotates.
  return (Math.floor(Date.now() / (3 * 3600 * 1000)) * BATCH) % total;
}

async function main() {
  if (!TRUSTMRR_API_KEY) { console.error('TRUSTMRR_API_KEY not set'); process.exit(1); }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('SUPABASE_* not set'); process.exit(1); }

  console.log('Обновление листингов на продаже (по именам — потолок пагинации не действует)\n');
  await recordParserStart('onsale');

  const all = await readOnSaleSlugs();
  if (!all.length) {
    await recordParserRun('onsale', false, 0, 'Не удалось прочитать список на продаже');
    process.exit(1);
  }
  const offset = await nextOffset(all.length);
  // Wrap around the end so the last partial window isn't short.
  const slugs = all.length <= BATCH ? all : Array.from({ length: BATCH }, (_, i) => all[(offset + i) % all.length]);
  const source = pickSource();
  const pause  = source === 'md' ? MD_DELAY_MS : DELAY_MS;
  console.log(`На продаже: ${all.length} · обрабатываем ${slugs.length}, начиная с #${offset}`);
  console.log(`Источник сегодня: ${source === 'md' ? 'машиночитаемая страница (.md)' : 'API'} · пауза ${pause / 1000}с\n`);

  // Only the .md path needs the current rows (it merges rather than replaces).
  const existing = source === 'md' ? await readExisting(slugs) : new Map();

  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const rows = [];
  let updated = 0, gone = 0, skipped = 0, offSale = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    let res;
    try { res = source === 'md' ? await fetchMd(slug) : await fetchDetail(slug); }
    catch (e) {   // 401 — the key itself is bad, no point walking 260 more
      await recordParserRun('onsale', false, updated, e.message, slugs.length);
      process.exit(1);
    }

    // Whichever source ran, settle on one full object to store.
    let data = null;
    if (res.data) data = res.data;                                   // API: complete object
    else if (res.parsed) data = { ...(existing.get(slug) || {}), ...res.parsed, slug };  // .md: overlay

    if (res.gone) {
      // Delisted upstream. Keep the row (the detail page still renders from it) but
      // stop counting it as inventory, and let the deny-list hide it from the catalog.
      gone++;
      rows.push({ slug, data: { ...(existing.get(slug) || {}), slug, onSale: false, __delisted: true }, last_seen: today, updated_at: nowIso });
      await markDead(slug, true);
    } else if (data) {
      updated++;
      if (!data.onSale) offSale++;              // still listed on TrustMRR, no longer for sale
      rows.push({ slug, data, last_seen: today, updated_at: nowIso });
      await clearDead(slug);                    // came back → un-mark
    } else {
      skipped++;
    }

    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${slugs.length} · обновлено ${updated} · снято ${gone + offSale}`);
    if (i < slugs.length - 1) await sleep(pause);
  }

  const written = await writeArchive(rows);

  console.log(`\n─────────────────────────────────────`);
  console.log(`Обновлено: ${updated} · удалено у TrustMRR: ${gone} · снято с продажи: ${offSale} · пропущено: ${skipped} · записано: ${written}`);

  // Half the batch failing means the source itself changed shape (a reformatted .md,
  // say) — surface that as a red run instead of quietly refreshing nothing.
  const healthy = updated >= slugs.length * 0.5;
  const note = `источник: ${source === 'md' ? '.md' : 'API'} · обновлено ${updated} из ${slugs.length}`
    + (gone ? ` · удалено у TrustMRR: ${gone}` : '')
    + (offSale ? ` · снято с продажи: ${offSale}` : '')
    + (skipped ? ` · пропущено: ${skipped}` : '')
    + ` · всего на продаже ${all.length}`
    + (healthy ? '' : ' · ⚠ слишком много неудач — источник мог измениться');
  await recordParserRun('onsale', healthy, updated, note, slugs.length);
}

main().catch(async (e) => {
  console.error(e);
  await recordParserRun('onsale', false, 0, e && e.message ? e.message : 'fatal error');
  process.exit(1);
});
