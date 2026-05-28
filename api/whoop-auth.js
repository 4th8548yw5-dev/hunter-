export default async function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID,
    redirect_uri: process.env.WHOOP_REDIRECT_URI,
    response_type: 'code',
    scope: 'read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement',
    state: 'dashboard'
  });
  return res.redirect(302, `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`);
}
