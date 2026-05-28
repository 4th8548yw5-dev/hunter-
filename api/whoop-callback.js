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
    try { tokens = JSON.parse(tokenText); } catch(e) { return res.status(500).send('Token error: ' + tokenText); }
    if (!tokens.access_token) return res.status(400).json({ error: 'No token', tokens });
    const headers = { Authorization: `Bearer ${tokens.access_token}` };
    const [cyclesRes, sleepRes] = await Promise.all([
      fetch('https://api.prod.whoop.com/developer/v2/cycle?limit=1', { headers }),
      fetch('https://api.prod.whoop.com/developer/v2/activity/sleep?limit=1', { headers })
    ]);
    const cycles = await cyclesRes.json();
    const sleep = await sleepRes.json();
    const c = cycles?.records?.[0];
    const s = sleep?.records?.[0];
    const data = {
      recovery: c?.score?.recovery_score ?? null,
      hrv: c?.score?.hrv_rmssd_milli ?? null,
      rhr: c?.score?.resting_heart_rate ?? null,
      strain: c?.score?.strain ?? null,
      slpperf: s?.score?.sleep_performance_percentage ?? null,
      slpdur: s?.score?.total_in_bed_time_milli ? Math.round(s.score.total_in_bed_time_milli/360000)/10 : null,
      rem: s?.score?.stage_summary?.total_rem_sleep_time_milli ? Math.round(s.score.stage_summary.total_rem_sleep_time_milli/360000)/10 : null,
      deep: s?.score?.stage_summary?.total_slow_wave_sleep_time_milli ? Math.round(s.score.stage_summary.total_slow_wave_sleep_time_milli/360000)/10 : null,
      spo2: s?.score?.respiratory_rate ?? null
    };
    const html = `<!DOCTYPE html><html><head><script>
      localStorage.setItem('whoop_data', '${JSON.stringify(data).replace(/'/g, "\\'")}');
      window.location.href = '/';
    <\/script></head><body>Loading your WHOOP data...</body></html>`;
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
