#!/usr/bin/env python3
"""Upsert a generated batch of descriptions into Supabase startup_descriptions.

Input: a JSON array of objects:
  { "slug": "...", "original": "...(optional)",
    "description": "<English rephrase>",
    "translations": { "ru": "...", "de": "...", "fr": "...", "it": "...", "zh": "...", "ar": "..." } }

status is set automatically: 'done' when all target languages are present, else 'pending'.
Conflicts on slug are merged (re-running a batch is safe). The nightly catalog refresh
never touches this table, so a startup's stored description is preserved on updates.

Per-language merge: only the languages present (non-empty) in the batch are written;
any translations already stored for other languages are preserved. So a Russian-only
batch fills `ru` without wiping `de/fr/it/zh/ar`, and a later batch can complete them.
Pass --replace to overwrite the whole translations object instead of merging.

Usage:
  python3 scripts/descriptions/upsert.py _work/batch.json [--replace]
"""
import json, os, sys, datetime
sys.path.insert(0, os.path.dirname(__file__))
from _common import LANGS, status_for, supa_cfg, http, supa_headers


def fetch_existing_translations(url, key, slugs):
    """{slug: {lang: text}} for slugs already stored — so we merge, not clobber."""
    existing = {}
    CHUNK = 80
    for i in range(0, len(slugs), CHUNK):
        chunk = [s for s in slugs[i:i + CHUNK] if s]
        if not chunk:
            continue
        inlist = ",".join(chunk)  # slugs are url-safe (a-z0-9-)
        u = f"{url}/rest/v1/startup_descriptions?slug=in.({inlist})&select=slug,translations"
        st, body, _ = http("GET", u, supa_headers(key))
        if st != 200:
            print(f"  (note: could not read existing rows, HTTP {st} — not merging)", file=sys.stderr)
            return {}
        for r in json.loads(body) if body else []:
            existing[r["slug"]] = r.get("translations") or {}
    return existing


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    replace = "--replace" in sys.argv[1:]
    if not args:
        raise SystemExit("usage: upsert.py <batch.json> [--replace]")
    path = args[0]
    rows = json.load(open(path, encoding="utf-8"))
    if not isinstance(rows, list):
        raise SystemExit("batch file must be a JSON array")

    url, key = supa_cfg()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Preserve translations already stored for languages this batch doesn't include
    # (unless --replace). Fetched up front so we merge instead of clobbering.
    existing = {} if replace else fetch_existing_translations(
        url, key, [(r.get("slug") or "").strip() for r in rows])

    payload, skipped = [], 0
    for r in rows:
        slug = (r.get("slug") or "").strip()
        desc = (r.get("description") or "").strip()
        new_tr = {l: (r.get("translations", {}).get(l) or "").strip() for l in LANGS}
        if not slug or not desc:
            print(f"  ! skip (missing slug/description): {slug or '?'}")
            skipped += 1
            continue
        # Merge: keep stored language unless this batch provides a non-empty value.
        prev = existing.get(slug) or {}
        tr = {l: (new_tr[l] or (prev.get(l) or "").strip()) for l in LANGS}
        st = status_for(tr)
        missing = [l for l in LANGS if not tr[l]]
        if missing:
            print(f"  ~ {slug}: status=pending (missing: {', '.join(missing)})")
        payload.append({
            "slug": slug, "original": r.get("original") or None,
            "description": desc, "translations": tr,
            "status": st, "tr_updated_at": now,
        })

    if not payload:
        print("Nothing to upsert.")
        return

    # Bulk upsert in one request; merge on slug conflict.
    u = f"{url}/rest/v1/startup_descriptions?on_conflict=slug"
    headers = supa_headers(key, {"Prefer": "resolution=merge-duplicates,return=minimal"})
    status, body, _ = http("POST", u, headers, payload)
    if status in (200, 201, 204):
        done = sum(1 for p in payload if p["status"] == "done")
        print(f"\nUpserted {len(payload)} rows  (done: {done}, pending: {len(payload)-done}, skipped: {skipped})")
    else:
        print(f"\nUPSERT FAILED  HTTP {status}\n{body[:500]}")
        sys.exit(1)


if __name__ == "__main__":
    main()
