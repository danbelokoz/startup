// GET  /api/auth          — returns current user's access level
// POST /api/auth { slug } — records a startup view, returns updated access
//
// Both endpoints read:  Authorization: Bearer <supabase-jwt>
// All DB operations use the service role key (bypasses RLS).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Supabase HTTP wrapper ─────────────────────────────────────────────────────
async function sb(path, { method = 'GET', userToken, body } = {}) {
  try {
    const r = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${userToken || SERVICE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    const data = text ? JSON.parse(text) : null;
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 500, data: null };
  }
}

// Validate a Supabase JWT using /auth/v1/user — returns user object or null
async function getUser(token) {
  const { ok, data } = await sb('/auth/v1/user', { userToken: token });
  return (ok && data?.id) ? data : null;
}

// Calls get_user_access(uid) — returns { role, views_used, views_left }
async function getAccess(userId) {
  const { data } = await sb('/rest/v1/rpc/get_user_access', {
    method: 'POST',
    body: { uid: userId },
  });
  const row = Array.isArray(data) ? data[0] : data;
  return row || { role: 'user', views_used: 0, views_left: 8 };
}

// Calls record_startup_view(uid, slug) — returns { allowed, views_used, views_left }
async function recordView(userId, slug) {
  const { data } = await sb('/rest/v1/rpc/record_startup_view', {
    method: 'POST',
    body: { uid: userId, startup_slug: slug },
  });
  const row = Array.isArray(data) ? data[0] : data;
  return row || { allowed: false, views_used: 0, views_left: 0 };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Graceful degradation when Supabase is not configured (e.g. local dev)
  if (!SUPABASE_URL || !SERVICE_KEY) {
    if (req.method === 'GET') {
      return res.status(200).json({ authenticated: false, role: 'guest', viewsLeft: 3 });
    }
    return res.status(503).json({ error: 'Auth service not configured' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || null;

  // ── GET: return access info ───────────────────────────────────────────────
  if (req.method === 'GET') {
    // No token → guest
    if (!token) {
      return res.status(200).json({ authenticated: false, role: 'guest', viewsLeft: 3 });
    }

    const user = await getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid or expired token' });

    const access = await getAccess(user.id);
    return res.status(200).json({
      authenticated: true,
      userId:        user.id,
      email:         user.email,
      role:          access.role,
      viewsUsed:     access.views_used,
      viewsLeft:     access.views_left,
    });
  }

  // ── POST: record a startup view ───────────────────────────────────────────
  if (req.method === 'POST') {
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const user = await getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid or expired token' });

    // Vercel auto-parses JSON bodies; body is available as req.body
    const { slug } = req.body || {};
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid slug' });
    }

    const result = await recordView(user.id, slug.trim());

    if (!result.allowed) {
      return res.status(403).json({
        error:     'Daily view limit reached',
        viewsUsed: result.views_used,
        viewsLeft: 0,
      });
    }

    return res.status(200).json({
      ok:        true,
      viewsUsed: result.views_used,
      viewsLeft: result.views_left,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
