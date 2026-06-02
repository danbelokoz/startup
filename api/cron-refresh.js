// Called by Vercel Cron every hour to refresh the server cache
// This way ALL users get fresh data without waiting

export default async function handler(req, res) {
  // Security: only allow Vercel Cron calls
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const trustmrrKey = process.env.TRUSTMRR_API_KEY;
  if (!trustmrrKey) return res.status(500).json({ error: 'No TrustMRR API key configured' });

  try {
    // Trigger cache refresh
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const res2 = await fetch(`${baseUrl}/api/startups?refresh=1`, {
      headers: { Authorization: `Bearer ${trustmrrKey}` }
    });
    const data = await res2.json();
    return res.status(200).json({ ok: true, count: data.count });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
