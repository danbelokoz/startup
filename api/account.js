// DELETE /api/account — permanently deletes the authenticated user.
//
// Reads:  Authorization: Bearer <supabase-jwt>
// Validates the token, then deletes the user via the Supabase Admin API using
// the service role key. profiles → subscriptions / startup_views all cascade
// via ON DELETE CASCADE, so this fully removes the account.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate a Supabase JWT using /auth/v1/user — returns user object or null
async function getUser(token) {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data && data.id ? data : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Allow POST as a fallback for clients/proxies that strip DELETE bodies/methods
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(503).json({ error: 'Auth service not configured' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const user = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' });

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: 'Failed to delete user', detail: detail.slice(0, 200) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
