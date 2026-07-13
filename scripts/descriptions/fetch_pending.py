#!/usr/bin/env python3
"""Collect the next batch of startups that still need our description.

Walks the public catalog (on-sale first, revenue-desc) and drops any slug already
marked status='done' in startup_descriptions, so we never redo finished work and
never overwrite. Writes the batch (slug + name + original English description) to
_work/pending.json for the model to rephrase + translate.

Usage:
  python3 scripts/descriptions/fetch_pending.py [--limit 12] [--all] [--min-len 40]
    --limit N   how many pending startups to emit (default 12)
    --all       scan the whole catalog instead of on-sale only
    --min-len   skip startups whose description is shorter than this (default 40)
"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _common import LANGS, PUBLIC_API, WORK, get_json, supa_cfg_optional, http, supa_headers


def fetch_done_slugs(url, key):
    """All slugs already finished (status='done'), paged out of Supabase."""
    done, offset, page = set(), 0, 1000
    while True:
        u = f"{url}/rest/v1/startup_descriptions?status=eq.done&select=slug&limit={page}&offset={offset}"
        st, body, _ = http("GET", u, supa_headers(key))
        if st != 200:
            # Likely the status column isn't migrated yet — treat as "nothing done".
            print(f"  (note: could not read done slugs, HTTP {st} — assuming none)", file=sys.stderr)
            break
        rows = json.loads(body) if body else []
        if not rows:
            break
        for r in rows:
            done.add(r["slug"])
        if len(rows) < page:
            break
        offset += page
    return done


def fetch_lang_slugs(url, key, lang):
    """All slugs that already have a non-empty translation for `lang`, paged out.

    Lets a single-language pass (e.g. Russian-only) skip startups it already covered
    even though they're still status='pending' (other languages not filled yet)."""
    have, offset, page = set(), 0, 1000
    while True:
        u = (f"{url}/rest/v1/startup_descriptions?translations->>{lang}=neq."
             f"&select=slug&limit={page}&offset={offset}")
        st, body, _ = http("GET", u, supa_headers(key))
        if st != 200:
            print(f"  (note: could not read '{lang}' slugs, HTTP {st} — assuming none)", file=sys.stderr)
            break
        rows = json.loads(body) if body else []
        if not rows:
            break
        for r in rows:
            have.add(r["slug"])
        if len(rows) < page:
            break
        offset += page
    return have


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=12)
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--min-len", type=int, default=40)
    ap.add_argument("--have-lang", metavar="LANG",
                    help="also skip slugs that already have this language filled "
                         "(e.g. --have-lang ru for a Russian-only pass)")
    args = ap.parse_args()

    url, key = supa_cfg_optional()
    if key:
        done = fetch_done_slugs(url, key)
        print(f"Already done: {len(done)}")
        if args.have_lang:
            have = fetch_lang_slugs(url, key, args.have_lang)
            done |= have
            print(f"Already have '{args.have_lang}': {len(have)} (skipping those too)")
    else:
        print("No SUPABASE_SERVICE_ROLE_KEY yet — not deduping against done "
              "(set .env.local before the real run).")
        done = set()

    on_sale = "" if args.all else "&onSale=true"
    pending, page, scanned, seen = [], 1, 0, set()
    while len(pending) < args.limit:
        d = get_json(f"{PUBLIC_API}/api/startups?page={page}&limit=50&sort=revenue-desc{on_sale}")
        rows = d.get("data") or []
        if not rows:
            break
        for s in rows:
            scanned += 1
            slug = s.get("slug")
            desc = (s.get("description") or "").strip()
            # skip done, already-seen this run (the catalog can repeat a slug across
            # pages), and items too short to be worth rephrasing
            if not slug or slug in done or slug in seen or len(desc) < args.min_len:
                continue
            seen.add(slug)
            pending.append({"slug": slug, "name": s.get("name") or "", "original": desc})
            if len(pending) >= args.limit:
                break
        if not (d.get("meta") or {}).get("hasMore"):
            break
        page += 1

    os.makedirs(WORK, exist_ok=True)
    out = os.path.join(WORK, "pending.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(pending, f, ensure_ascii=False, indent=2)
    print(f"Scanned {scanned} {'catalog' if args.all else 'on-sale'} startups → {len(pending)} pending")
    print(f"Wrote {out}")
    print(f"Target languages per startup: {', '.join(LANGS)}")


if __name__ == "__main__":
    main()
