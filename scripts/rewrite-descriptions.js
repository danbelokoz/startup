#!/usr/bin/env node
// Rewrites each startup's TrustMRR description in its own words so our pages aren't a
// 1:1 duplicate of trustmrr.com. Stores results in Supabase `startup_descriptions`
// and is read by api/enrich.js (which serves the rewrite to the detail page).
//
// Re-runnable & resumable: it SKIPS slugs already in the table, so it never
// overwrites an existing rewrite — and the nightly catalog refresh never touches this
// table either. New startups stay on their original description until a future run.
//
// Env: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//      LIMIT (max new rewrites per run, default 1500), MODEL (default Haiku 4.5)

const ANTHROPIC_API_KEY         = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = parseInt(process.env.LIMIT || '1500', 10);
const MODEL = process.env.MODEL || 'claude-haiku-4-5-20251001';
const API   = 'https://startupmarket.tech';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Slugs already rewritten — so we skip them (never overwrite, and resume cleanly).
async function fetchExistingSlugs() {
  const set = new Set();
  let offset = 0; const page = 1000;
  while (true) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/startup_descriptions?select=slug&limit=${page}&offset=${offset}`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!r.ok) break;
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) break;
    for (const x of rows) set.add(x.slug);
    if (rows.length < page) break;
    offset += page;
  }
  return set;
}

// Walk the catalog via our own (cached) API — already revenue-desc, deterministic.
async function* iterateStartups() {
  let page = 1;
  while (true) {
    const r = await fetch(`${API}/api/startups?page=${page}&limit=50&sort=revenue-desc`);
    if (!r.ok) break;
    const d = await r.json();
    for (const s of (Array.isArray(d.data) ? d.data : [])) yield s;
    if (!d.meta?.hasMore) break;
    page++;
    await sleep(250);
  }
}

const PROMPT = desc =>
  `Rewrite the following startup description in your own words. Keep every fact and the `
  + `same meaning and language, but change the wording and sentence structure so it is not `
  + `a word-for-word copy. Neutral, informational tone — no marketing hype, no superlatives, `
  + `no new claims or guarantees. Keep it roughly the same length. Output only the rewritten `
  + `description, with no preamble or quotes.\n\nDescription:\n${desc}`;

async function rewrite(desc) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 400, messages: [{ role: 'user', content: PROMPT(desc) }] }),
  });
  if (!r.ok) { const t = await r.text().catch(() => r.status); throw new Error(`Anthropic ${r.status}: ${String(t).slice(0, 160)}`); }
  const j = await r.json();
  return Array.isArray(j.content) ? j.content.map(b => b.text || '').join('').trim() : '';
}

async function store(slug, original, description) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/startup_descriptions?on_conflict=slug`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({ slug, description, original, model: MODEL }),
  });
  return r.ok;
}

async function main() {
  if (!ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1); }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('SUPABASE_* not set'); process.exit(1); }

  console.log(`Rewriting descriptions with ${MODEL} (up to ${LIMIT} new this run)\n`);
  const existing = await fetchExistingSlugs();
  console.log(`Already rewritten: ${existing.size}`);

  let done = 0, skipped = 0, failed = 0, seen = 0;
  for await (const s of iterateStartups()) {
    if (done >= LIMIT) break;
    seen++;
    const slug = s.slug, desc = (s.description || '').trim();
    if (!slug || existing.has(slug) || desc.length < 40) { skipped++; continue; }
    try {
      const rew = await rewrite(desc);
      if (rew && rew.length > 20) {
        if (await store(slug, desc, rew)) { done++; if (done % 25 === 0) console.log(`  ${done} rewritten (scanned ${seen})`); }
        else failed++;
      } else skipped++;
    } catch (e) {
      failed++;
      console.log(`  ✕ ${slug}: ${e.message}`);
      if (/429|overloaded|rate/i.test(e.message)) await sleep(5000);
    }
    await sleep(180); // gentle pacing
  }

  console.log(`\n─────────────`);
  console.log(`Rewritten this run: ${done} · skipped: ${skipped} · failed: ${failed} · scanned: ${seen}`);
}

main().catch(e => { console.error(e); process.exit(1); });
