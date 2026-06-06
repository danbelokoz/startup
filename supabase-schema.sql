-- ============================================================
-- StartupMarket — Supabase Schema
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================
--
-- Access tiers:
--   Guest (unauthenticated)  → 3 startup detail views/day  [localStorage, no DB row]
--   User  (authenticated)    → 8 startup detail views/day  [startup_views table]
--   Subscriber (paid)        → unlimited for 1 month       [subscriptions table]
--
-- Key design decisions:
--   - profiles.role is a denormalized cache; triggers keep it in sync
--   - get_user_access() auto-heals stale 'subscriber' role on expired subscriptions
--   - startup_views uses (user, slug, date) PK — re-viewing same page is free
--   - All INSERT/UPDATE on protected tables goes through service role (API layer)

-- ============================================================
-- PROFILES
-- One row per auth.user. Auto-created by trigger on signup.
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'user'
                         CHECK (role IN ('user', 'subscriber')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Role changes are done exclusively by server (service role bypasses RLS)
-- No client-facing UPDATE/INSERT/DELETE policies

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SUBSCRIPTIONS
-- Paid access periods. One active, non-expired row = subscriber.
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL,    -- typically NOW() + INTERVAL '1 month'
  payment_provider TEXT,                    -- 'stripe' | 'lemonsqueezy'
  payment_id       TEXT UNIQUE,             -- external subscription/payment ID
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can see their own subscription history
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subs_user_id    ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_expires_at ON subscriptions(expires_at);

-- Keep profiles.role in sync whenever a subscription is created or changes state
CREATE OR REPLACE FUNCTION sync_subscription_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- New active subscription → elevate to subscriber
  IF NEW.status = 'active' AND NEW.expires_at > NOW() THEN
    UPDATE profiles SET role = 'subscriber' WHERE id = NEW.user_id;

  -- Cancelled or expired → downgrade (unless another active sub exists)
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE  user_id    = NEW.user_id
        AND  id        != NEW.id
        AND  status     = 'active'
        AND  expires_at > NOW()
    ) THEN
      UPDATE profiles SET role = 'user' WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_subscription_change ON subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE OF status, expires_at ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_role();

-- ============================================================
-- STARTUP VIEWS
-- Tracks which startup detail pages a user opened on each day.
-- PK = (user, slug, date) — re-opening the same page on the same day is free.
-- Daily limit: 8 for 'user', unlimited for 'subscriber'.
-- Guests are tracked client-side (localStorage) — no row here.
-- ============================================================
CREATE TABLE IF NOT EXISTS startup_views (
  user_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug      TEXT        NOT NULL,
  view_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, slug, view_date)
);

ALTER TABLE startup_views ENABLE ROW LEVEL SECURITY;

-- Users can read their own view history (for "views left" display)
CREATE POLICY "startup_views_select_own" ON startup_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_startup_views_user_date
  ON startup_views(user_id, view_date);

-- ============================================================
-- HELPER FUNCTIONS
-- Called from api/auth.js via service role key (bypasses RLS).
-- ============================================================

-- Returns effective access level for a given user.
-- Also auto-heals stale 'subscriber' role when subscription has expired.
--
-- Usage:  SELECT * FROM get_user_access('uuid-here');
-- Returns: role TEXT, views_used INT, views_left INT
CREATE OR REPLACE FUNCTION get_user_access(uid UUID)
RETURNS TABLE (role TEXT, views_used INT, views_left INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_used INT;
BEGIN
  SELECT p.role INTO v_role FROM profiles p WHERE p.id = uid;

  -- Edge case: profile not yet created (signup trigger delay)
  IF NOT FOUND THEN
    v_role := 'user';
  END IF;

  -- Heal stale subscriber role when subscription has expired
  IF v_role = 'subscriber' AND NOT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE  user_id    = uid
      AND  status     = 'active'
      AND  expires_at > NOW()
  ) THEN
    UPDATE profiles SET role = 'user' WHERE id = uid;
    v_role := 'user';
  END IF;

  -- Subscriber → unlimited
  IF v_role = 'subscriber' THEN
    RETURN QUERY SELECT 'subscriber'::TEXT, 0, 999999;
    RETURN;
  END IF;

  -- User → count today's unique views, compute remaining
  SELECT COUNT(*)::INT INTO v_used
  FROM   startup_views
  WHERE  user_id   = uid
    AND  view_date = CURRENT_DATE;

  RETURN QUERY SELECT 'user'::TEXT, v_used, GREATEST(0, 8 - v_used);
END;
$$;

-- Records a startup detail view for a user, enforcing the daily limit.
-- Re-viewing the same slug on the same day is always allowed (idempotent).
-- Returns (allowed, views_used, views_left).
--   allowed = FALSE → user is at the daily limit and this is a new slug.
--
-- Usage:  SELECT * FROM record_startup_view('uuid-here', 'startup-slug');
CREATE OR REPLACE FUNCTION record_startup_view(uid UUID, startup_slug TEXT)
RETURNS TABLE (allowed BOOLEAN, views_used INT, views_left INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role              TEXT;
  v_limit             INT;
  v_used              INT;
  v_already_viewed    BOOLEAN;
BEGIN
  -- Determine limit based on role (subscriber = unlimited)
  SELECT p.role INTO v_role FROM profiles p WHERE p.id = uid;
  v_limit := CASE WHEN v_role = 'subscriber' THEN 999999 ELSE 8 END;

  -- Re-viewing the same slug today is always free
  SELECT EXISTS(
    SELECT 1 FROM startup_views
    WHERE  user_id   = uid
      AND  slug      = startup_slug
      AND  view_date = CURRENT_DATE
  ) INTO v_already_viewed;

  -- Count distinct slugs viewed today
  SELECT COUNT(*)::INT INTO v_used
  FROM   startup_views
  WHERE  user_id   = uid
    AND  view_date = CURRENT_DATE;

  -- Block if at limit and this is a brand-new slug
  IF NOT v_already_viewed AND v_used >= v_limit THEN
    RETURN QUERY SELECT FALSE, v_used, 0;
    RETURN;
  END IF;

  -- Record the view (no-op if slug already seen today)
  INSERT INTO startup_views (user_id, slug, view_date)
  VALUES (uid, startup_slug, CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  -- Return updated state
  SELECT COUNT(*)::INT INTO v_used
  FROM   startup_views
  WHERE  user_id   = uid
    AND  view_date = CURRENT_DATE;

  RETURN QUERY SELECT TRUE, v_used, GREATEST(0, v_limit - v_used);
END;
$$;

-- ============================================================
-- DAILY SNAPSHOTS
-- One row per (slug, day) — daily snapshot of revenue metrics.
-- Cron writes once per day; chart on startup detail page reads from here.
-- TrustMRR doesn't expose history, so we accumulate it ourselves.
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_snapshots (
  slug          TEXT   NOT NULL,
  snap_date     DATE   NOT NULL DEFAULT CURRENT_DATE,
  mrr_cents     BIGINT,
  rev30d_cents  BIGINT,
  total_cents   BIGINT,
  customers     INT,
  subscriptions INT,
  growth30d     NUMERIC,
  visitors_30d  INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (slug, snap_date)
);

ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can read snapshots — used by chart on public detail page
CREATE POLICY "daily_snapshots_select_all" ON daily_snapshots
  FOR SELECT USING (TRUE);

CREATE INDEX IF NOT EXISTS idx_snap_slug_date
  ON daily_snapshots(slug, snap_date DESC);

-- ============================================================
-- GRANTS
-- Supabase anon/authenticated roles need USAGE on schema.
-- Table-level access is controlled by RLS policies above.
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON profiles         TO authenticated;
GRANT SELECT ON subscriptions    TO authenticated;
GRANT SELECT ON startup_views    TO authenticated;
GRANT SELECT ON daily_snapshots  TO anon, authenticated;

-- INSERT/UPDATE/DELETE on all tables is done via service role in Vercel API functions.
-- The service role key bypasses RLS entirely — never expose it to the client.
