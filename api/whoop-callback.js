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
    const [recovery, sleep, profile] = await Promise.all([
      fetch('https://api.prod.whoop.com/developer/v1/recovery?limit=1', { headers: { Authorization: `Bearer ${tokens.access_token}` } }).then(r => r.json()),
      fetch('https://api.prod.whoop.com/developer/v1/activity/sleep?limit=1', { headers: { Authorization: `Bearer ${tokens.access_token}` } }).then(r => r.json()),
      fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', { headers: { Authorization: `Bearer ${tokens.access_token}` } }).then(r => r.json())
    ]);
    const rec = recovery?.records?.[0];
    const slp = sleep?.records?.[0];
    const data = {
      recovery: rec?.score?.recovery_score ?? null,
      hrv: rec?.score?.hrv_rmssd_milli ?? null,
      rhr: rec?.score?.resting_heart_rate ?? null,
      strain: rec?.score?.strain ?? null,
      slpperf: slp?.score?.sleep_performance_percentage ?? null,
      slpdur: slp?.score?.total_in_bed_time_milli ? slp.score.total_in_bed_time_milli / 3600000 : null,
      rem: slp?.score?.stage_summary?.total_rem_sleep_time_milli ? slp.score.stage_summary.total_rem_sleep_time_milli / 3600000 : null,
      deep: slp?.score?.stage_summary?.total_slow_wave_sleep_time_milli ? slp.score.stage_summary.total_slow_wave_sleep_time_milli / 3600000 : null,
      spo2: slp?.score?.respiratory_rate ?? null,
      firstName: profile?.first_name ?? ''
    };
    const html = `<!DOCTYPE html><html><head><script>
      localStorage.setItem('whoop_data', JSON.stringify(${JSON.stringify(data)}));
      window.location.href = '/';
    </script></head><body>Connecting...</body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
