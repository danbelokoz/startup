// Returns daily snapshots for a startup, accumulated by the daily cron.
// TrustMRR doesn't expose history, so we collect snapshots ourselves —
// the chart starts empty and fills out over time (one row per day per slug).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(200).json({ data: [], note: 'history_not_configured' });
  }

  const days = Math.min(parseInt(req.query.days || '90', 10) || 90, 365);
  const url = `${process.env.SUPABASE_URL}/rest/v1/daily_snapshots`
    + `?slug=eq.${encodeURIComponent(slug)}`
    + `&order=snap_date.asc`
    + `&limit=${days}`;

  try {
    const r = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
    });
    if (!r.ok) return res.status(200).json({ data: [], note: 'history_error' });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ data });
  } catch (e) {
    return res.status(200).json({ data: [], note: 'history_error' });
  }
}
