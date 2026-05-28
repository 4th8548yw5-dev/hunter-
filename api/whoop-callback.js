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
    const tokenText = await tokenRes.text();
    let tokens;
    try { tokens = JSON.parse(tokenText); } catch(e) { return res.status(500).send('Token parse error: ' + tokenText); }
    if (!tokens.access_token) return res.status(400).json({ error: 'No token', tokens });
    const headers = { Authorization: `Bearer ${tokens.access_token}` };
    const recRes = await fetch('https://api.prod.whoop.com/developer/v1/recovery?limit=1', { headers });
    const recText = await recRes.text();
    return res.status(200).send('DEBUG: ' + recText);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
