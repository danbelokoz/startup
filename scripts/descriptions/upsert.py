#!/usr/bin/env python3
"""Upsert a generated batch of descriptions into Supabase startup_descriptions.

Input: a JSON array of objects:
  { "slug": "...", "original": "...(optional)",
    "description": "<English rephrase>",
    "translations": { "ru": "...", "de": "...", "fr": "...", "it": "...", "zh": "...", "ar": "..." } }

status is set automatically: 'done' when all target languages are present, else 'pending'.
Conflicts on slug are merged (re-running a batch is safe). The nightly catalog refresh
never touches this table, so a startup's stored description is preserved on updates.

Usage:
  python3 scripts/descriptions/upsert.py _work/batch.json
"""
import json, os, sys, datetime
sys.path.insert(0, os.path.dirname(__file__))
from _common import LANGS, status_for, supa_cfg, http, supa_headers


def main():
    if len(sys.argv) < 2:
        raise SystemExit("usage: upsert.py <batch.json>")
    path = sys.argv[1]
    rows = json.load(open(path, encoding="utf-8"))
    if not isinstance(rows, list):
        raise SystemExit("batch file must be a JSON array")

    url, key = supa_cfg()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    payload, skipped = [], 0
    for r in rows:
        slug = (r.get("slug") or "").strip()
        desc = (r.get("description") or "").strip()
        tr = {l: (r.get("translations", {}).get(l) or "").strip() for l in LANGS}
        if not slug or not desc:
            print(f"  ! skip (missing slug/description): {slug or '?'}")
            skipped += 1
            continue
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
