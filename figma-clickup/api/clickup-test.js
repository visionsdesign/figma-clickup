export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.CLICKUP_TOKEN;
  if (!token) return res.status(500).json({ error: 'CLICKUP_TOKEN not set in environment variables.' });

  try {
    // First verify the token works by getting the current user
    const userRes = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });
    const userData = await userRes.json();
    if (!userRes.ok) return res.status(401).json({ error: 'Invalid ClickUp token', detail: userData });

    // Get all teams/workspaces this token has access to
    const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
      headers: { 'Authorization': token }
    });
    const teamsData = await teamsRes.json();

    res.status(200).json({
      user: userData.user?.username || userData.user?.email,
      teams: (teamsData.teams || []).map(t => ({ id: t.id, name: t.name }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
