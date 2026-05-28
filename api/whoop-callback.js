export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'No code' });
  try {
    const tokenRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.WHOOP_CLIENT_ID,
        client_secret: process.env.WHOOP_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.WHOOP_REDIRECT_URI
      })
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return res.status(400).json({ error: 'No token', tokens });
    const headers = { Authorization: `Bearer ${tokens.access_token}` };
    const cycleId = 1529083443;
    const [c1, c2, c3, c4] = await Promise.all([
      fetch(`https://api.prod.whoop.com/developer/v2/cycle/${cycleId}`, { headers }).then(r=>r.text()),
      fetch(`https://api.prod.whoop.com/developer/v2/cycle/${cycleId}/recovery`, { headers }).then(r=>r.text()),
      fetch(`https://api.prod.whoop.com/developer/v1/cycle/${cycleId}/recovery`, { headers }).then(r=>r.text()),
      fetch(`https://api.prod.whoop.com/developer/v2/recovery?limit=1`, { headers }).then(r=>r.text()),
    ]);
    return res.status(200).json({ c1, c2, c3, c4 });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
