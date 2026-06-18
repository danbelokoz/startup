"""Shared helpers for the description generation workflow (no external deps).

These scripts run LOCALLY (in a Claude Code session), reading the Supabase
service-role key from .env.local so generated text can be written to the
startup_descriptions table. Nothing here runs in production.
"""
import json, os, urllib.request, urllib.error

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WORK = os.path.join(os.path.dirname(__file__), "_work")

# Target translation languages (en lives in the `description` column).
LANGS = ["ru", "de", "fr", "it", "zh", "ar"]

PUBLIC_API = "https://startupmarket.tech"


def load_env():
    """Load KEY=VALUE lines from .env.local / .env into os.environ (no override)."""
    for fn in (".env.local", ".env"):
        p = os.path.join(ROOT, fn)
        if not os.path.exists(p):
            continue
        for line in open(p, encoding="utf-8"):
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def supa_cfg():
    load_env()
    url = os.environ.get("SUPABASE_URL", "https://gebmvkghoshihlebgvxm.supabase.co").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise SystemExit(
            "SUPABASE_SERVICE_ROLE_KEY is not set.\n"
            "  → cp .env.local.example .env.local  and paste the service_role key\n"
            "    (Supabase dashboard → Project Settings → API → service_role)."
        )
    return url, key


def http(method, url, headers=None, body=None, timeout=60):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), dict(e.headers)


def supa_headers(key, extra=None):
    h = {"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"}
    if extra:
        h.update(extra)
    return h


def get_json(url, timeout=60):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.load(r)


def status_for(translations):
    """A row is 'done' only when every target language is filled in."""
    return "done" if all((translations.get(l) or "").strip() for l in LANGS) else "pending"
