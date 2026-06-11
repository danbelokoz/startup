-- ============================================================
-- MRRket — Admin panel & analytics migration
-- Run AFTER supabase-schema.sql in: Supabase Dashboard > SQL Editor
-- Idempotent — safe to run more than once.
-- ============================================================

-- ============================================================
-- 1) Allow the 'admin' role on profiles
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'subscriber', 'admin'));

-- ============================================================
-- 2) Seller listing requests (the "Разместить стартап" form)
-- api_key_enc is AES-256-GCM encrypted by the server with LISTING_KEY_SECRET;
-- only /api/admin can decrypt it. Service-role only — no RLS policies on purpose.
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider     TEXT,                          -- 'stripe' | 'lemonsqueezy' | 'polar' | 'paddle'
  api_key_enc  TEXT,                          -- encrypted read-only key ("v1.<iv>.<ct>" base64)
  api_key_hint TEXT,                          -- masked form for list display, e.g. "rk_live…abcd (32)"
  price        NUMERIC(14,2),                 -- asking price, USD
  margin       NUMERIC(6,2),                  -- profit margin %
  anon         BOOLEAN     NOT NULL DEFAULT FALSE,
  plan         TEXT,                          -- 'starter' | 'pro' | 'premium'
  status       TEXT        NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new', 'processing', 'listed', 'rejected')),
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  email        TEXT                           -- submitter email when known
);

ALTER TABLE listing_requests ENABLE ROW LEVEL SECURITY;
-- No policies: readable/writable only via the service role (API layer).

CREATE INDEX IF NOT EXISTS idx_listing_requests_created
  ON listing_requests(created_at DESC);

-- ============================================================
-- 3) Pro waitlist (dashboard "upgrade" form)
-- ============================================================
CREATE TABLE IF NOT EXISTS waitlist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  source     TEXT        NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, source)
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

-- ============================================================
-- 4) Aggregation helpers for the admin panel
-- Called via service role; EXECUTE revoked from anon/authenticated so the
-- public PostgREST surface can't reach them.
-- ============================================================
CREATE OR REPLACE FUNCTION admin_signups(since TIMESTAMPTZ)
RETURNS TABLE (day DATE, signups BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT created_at::date AS day, COUNT(*)::bigint AS signups
  FROM   profiles
  WHERE  created_at >= since
  GROUP  BY 1
  ORDER  BY 1;
$$;

CREATE OR REPLACE FUNCTION admin_top_views(since DATE)
RETURNS TABLE (slug TEXT, views BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT slug, COUNT(*)::bigint AS views
  FROM   startup_views
  WHERE  view_date >= since
  GROUP  BY slug
  ORDER  BY views DESC
  LIMIT  50;
$$;

REVOKE ALL ON FUNCTION admin_signups(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION admin_top_views(DATE)      FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 5) Admins get unlimited reveals (same as subscribers).
-- Replaces the two helper functions from supabase-schema.sql.
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_access(uid UUID)
RETURNS TABLE (role TEXT, views_used INT, views_left INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_used INT;
BEGIN
  SELECT p.role INTO v_role FROM profiles p WHERE p.id = uid;

  IF NOT FOUND THEN
    v_role := 'user';
  END IF;

  -- Heal stale subscriber role when subscription has expired (admins are exempt)
  IF v_role = 'subscriber' AND NOT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE  user_id    = uid
      AND  status     = 'active'
      AND  expires_at > NOW()
  ) THEN
    UPDATE profiles SET role = 'user' WHERE id = uid;
    v_role := 'user';
  END IF;

  -- Subscriber / admin → unlimited
  IF v_role IN ('subscriber', 'admin') THEN
    RETURN QUERY SELECT v_role, 0, 999999;
    RETURN;
  END IF;

  SELECT COUNT(*)::INT INTO v_used
  FROM   startup_views
  WHERE  user_id   = uid
    AND  view_date = CURRENT_DATE;

  RETURN QUERY SELECT 'user'::TEXT, v_used, GREATEST(0, 8 - v_used);
END;
$$;

CREATE OR REPLACE FUNCTION record_startup_view(uid UUID, startup_slug TEXT)
RETURNS TABLE (allowed BOOLEAN, views_used INT, views_left INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role           TEXT;
  v_limit          INT;
  v_used           INT;
  v_already_viewed BOOLEAN;
BEGIN
  SELECT p.role INTO v_role FROM profiles p WHERE p.id = uid;
  v_limit := CASE WHEN v_role IN ('subscriber', 'admin') THEN 999999 ELSE 8 END;

  SELECT EXISTS(
    SELECT 1 FROM startup_views
    WHERE  user_id   = uid
      AND  slug      = startup_slug
      AND  view_date = CURRENT_DATE
  ) INTO v_already_viewed;

  SELECT COUNT(*)::INT INTO v_used
  FROM   startup_views
  WHERE  user_id   = uid
    AND  view_date = CURRENT_DATE;

  IF NOT v_already_viewed AND v_used >= v_limit THEN
    RETURN QUERY SELECT FALSE, v_used, 0;
    RETURN;
  END IF;

  INSERT INTO startup_views (user_id, slug, view_date)
  VALUES (uid, startup_slug, CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  SELECT COUNT(*)::INT INTO v_used
  FROM   startup_views
  WHERE  user_id   = uid
    AND  view_date = CURRENT_DATE;

  RETURN QUERY SELECT TRUE, v_used, GREATEST(0, v_limit - v_used);
END;
$$;

-- ============================================================
-- 6) Grant yourself admin — replace the email, then run:
-- ============================================================
-- UPDATE profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
