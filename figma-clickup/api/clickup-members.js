export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.CLICKUP_TOKEN;
  if (!token) return res.status(500).json({ error: 'CLICKUP_TOKEN not configured.' });

  try {
    const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
      headers: { 'Authorization': token }
    });
    const teamsData = await teamsRes.json();
    if (!teamsRes.ok) return res.status(401).json({ error: 'Invalid ClickUp token.' });

    const members = [];
    for (const team of teamsData.teams || []) {
      for (const m of team.members || []) {
        if (m.user?.id) {
          members.push({
            id: m.user.id,
            name: m.user.username || m.user.name || '',
            email: m.user.email || '',
            avatar: m.user.profilePicture || null
          });
        }
      }
    }

    // Deduplicate by id
    const seen = new Set();
    const unique = members.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

    res.status(200).json({ members: unique });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
