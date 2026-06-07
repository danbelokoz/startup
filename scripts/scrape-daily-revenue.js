#!/usr/bin/env node
// Scrapes daily revenue chart data from TrustMRR startup pages via Puppeteer.
// TrustMRR loads chart data client-side (not in RSC payload), so we intercept
// the network response. Run via GitHub Actions — no Vercel 60s timeout issue.
//
// Usage:
//   TRUSTMRR_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/scrape-daily-revenue.js
//
// Env vars:
//   TRUSTMRR_API_KEY          — TrustMRR API key (to fetch slug list)
//   SUPABASE_URL              — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key
//   LIMIT                     — max startups to scrape (default 250)
//   DEBUG                     — set to 1 to log all intercepted API calls

import puppeteer from 'puppeteer';

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRUSTMRR_API_KEY         = process.env.TRUSTMRR_API_KEY;
const LIMIT                    = parseInt(process.env.LIMIT || '250', 10);
const DEBUG                    = process.env.DEBUG === '1';
const PAGE_DELAY_MS            = 2500;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Revenue detection ─────────────────────────────────────────────────────────
// TrustMRR loads chart data via a client-side fetch. We don't know the exact
// shape yet, so we try several heuristics and pick the best match.

function isISODate(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);
}

function isUnixSec(v) {
  return typeof v === 'number' && v > 1_000_000_000 && v < 2_000_000_000;
}

function tryExtractPoints(arr) {
  if (!Array.isArray(arr) || arr.length < 3 || arr.length > 2000) return null;
  const sample = arr[0];
  if (!sample || typeof sample !== 'object') return null;

  const keys = Object.keys(sample);

  const dateKey = keys.find(k => isISODate(sample[k]))
               || keys.find(k => isUnixSec(sample[k]))
               || keys.find(k => /^(date|day|time|period|dt)$/i.test(k) && sample[k]);

  const amountKey = keys.find(k =>
    typeof sample[k] === 'number' &&
    /amount|revenue|total|value|earnings?|net|gross|charged?/i.test(k)
  );

  const chargesKey = keys.find(k =>
    typeof sample[k] === 'number' &&
    /charges?|count|transactions?|payments?|events?/i.test(k)
  );

  if (!dateKey || !amountKey) return null;

  return arr
    .filter(p => p && typeof p === 'object')
    .map(p => {
      const rawDate = p[dateKey];
      const date = isUnixSec(rawDate)
        ? new Date(rawDate * 1000).toISOString().slice(0, 10)
        : String(rawDate).slice(0, 10);
      return {
        date,
        amount: p[amountKey],
        charges: chargesKey != null ? p[chargesKey] : null,
      };
    })
    .filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.date));
}

function extractDailyRevenue(json) {
  // Direct array
  const direct = tryExtractPoints(json);
  if (direct) return direct;

  if (!json || typeof json !== 'object') return null;

  // One level deep: { data: [...] } or { revenue: [...] } etc.
  for (const key of Object.keys(json)) {
    const v = json[key];
    if (Array.isArray(v)) {
      const result = tryExtractPoints(v);
      if (result) return result;
    }
    // Two levels: { chart: { current: [...] } }
    if (v && typeof v === 'object') {
      for (const k2 of Object.keys(v)) {
        const result = tryExtractPoints(v[k2]);
        if (result) return result;
      }
    }
  }

  return null;
}

// ── Puppeteer scraping ────────────────────────────────────────────────────────

async function scrapeStartup(page, slug) {
  const calls = [];
  let revenueData = null;

  async function onResponse(response) {
    try {
      if (response.status() !== 200) return;
      const ct = response.headers()['content-type'] || '';
      if (!ct.includes('application/json')) return;
      const url = response.url();
      // Skip noise: analytics, fonts, icons
      if (/google|gstatic|facebook|sentry|hotjar|logrocket|intercom|crisp/i.test(url)) return;

      const json = await response.json();
      const points = extractDailyRevenue(json);

      if (DEBUG) calls.push({ url, hasData: !!points, len: points?.length });

      // Require at least 7 points (1 week) to accept as chart data
      if (points && points.length >= 7 && !revenueData) {
        console.log(`    chart data → ${url} (${points.length} points)`);
        revenueData = points;
      }
    } catch { /* ignore parse errors */ }
  }

  page.on('response', onResponse);

  try {
    await page.goto(`https://trustmrr.com/startup/${encodeURIComponent(slug)}`, {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });
    // Extra wait: some charts lazy-load after initial render
    await sleep(3500);
  } catch (e) {
    if (!e.message.includes('net::ERR_ABORTED')) { // aborted = blocked resource (normal)
      console.log(`    nav error: ${e.message.slice(0, 100)}`);
    }
  }

  page.off('response', onResponse);

  if (DEBUG && calls.length) {
    console.log(`    intercepted ${calls.length} JSON calls:`);
    for (const c of calls.slice(0, 8)) {
      console.log(`      ${c.hasData ? '✓' : '·'} ${c.url}${c.hasData ? ` (${c.len})` : ''}`);
    }
  }

  return revenueData;
}

// ── Supabase write ────────────────────────────────────────────────────────────

function normalizeAmount(points) {
  // If values look like cents (e.g. 24400 for $244), divide by 100.
  // Heuristic: if median value > 5000 and max < 10_000_000, assume cents.
  const vals = points.map(p => p.amount).filter(v => typeof v === 'number' && v >= 0);
  if (!vals.length) return points;
  const sorted = [...vals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const isCents = median > 5000; // $50+ daily = >5000 cents vs >50 dollars
  return points.map(p => ({
    ...p,
    amount_usd: isCents ? +(p.amount / 100).toFixed(2) : +(p.amount).toFixed(2),
  }));
}

async function upsertRevenue(slug, rawPoints) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('    ⚠ Supabase not configured, skipping write');
    return 0;
  }

  const points = normalizeAmount(rawPoints);
  const rows = points
    .filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && typeof p.amount_usd === 'number')
    .map(p => ({
      slug,
      rev_date:  p.date,
      rev_usd:   p.amount_usd,
      charges:   p.charges ?? null,
    }));

  if (!rows.length) return 0;

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/daily_revenue?on_conflict=slug,rev_date`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':         SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer':         'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    }
  );

  if (!r.ok) {
    const err = await r.text().catch(() => r.status);
    console.log(`    ⚠ Supabase error ${r.status}: ${String(err).slice(0, 120)}`);
    return 0;
  }
  return rows.length;
}

// ── Slug list ─────────────────────────────────────────────────────────────────

async function getSlugs() {
  if (!TRUSTMRR_API_KEY) throw new Error('TRUSTMRR_API_KEY not set');

  const slugs = [];
  let page = 1;
  const maxPages = Math.ceil(LIMIT / 50);

  while (page <= maxPages) {
    const r = await fetch(
      `https://trustmrr.com/api/v1/startups?page=${page}&limit=50&sort=revenue-desc`,
      { headers: { Authorization: `Bearer ${TRUSTMRR_API_KEY}` } }
    );
    if (!r.ok) throw new Error(`TrustMRR API ${r.status} on page ${page}`);
    const data = await r.json();
    if (Array.isArray(data.data)) {
      slugs.push(...data.data.map(s => s.slug).filter(Boolean));
    }
    if (!data.meta?.hasMore) break;
    page++;
    if (page <= maxPages) await sleep(3200); // TrustMRR rate limit: 20 req/min
  }

  return slugs.slice(0, LIMIT);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`TrustMRR daily revenue scraper — limit: ${LIMIT} startups\n`);

  console.log('Fetching slug list from TrustMRR API...');
  const slugs = await getSlugs();
  console.log(`Got ${slugs.length} slugs.\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
    ],
  });

  let found = 0;
  let totalRows = 0;

  try {
    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i];
      console.log(`[${i + 1}/${slugs.length}] ${slug}`);

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      );
      // Block images/fonts/media — we only care about JSON API calls
      await page.setRequestInterception(true);
      page.on('request', req => {
        if (['image', 'font', 'media', 'stylesheet'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      try {
        const points = await scrapeStartup(page, slug);
        if (points && points.length) {
          found++;
          const written = await upsertRevenue(slug, points);
          totalRows += written;
          console.log(`    stored ${written} rows`);
        } else {
          console.log(`    no chart data found`);
        }
      } catch (e) {
        console.log(`    error: ${e.message}`);
      } finally {
        await page.close();
      }

      if (i < slugs.length - 1) await sleep(PAGE_DELAY_MS);
    }
  } finally {
    await browser.close();
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Scraped ${slugs.length} startups.`);
  console.log(`Chart data found: ${found}/${slugs.length}`);
  console.log(`Revenue rows stored: ${totalRows}`);
}

main().catch(e => { console.error(e); process.exit(1); });
