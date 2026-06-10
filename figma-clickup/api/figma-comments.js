export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { fileKey } = req.query;
  const token = process.env.FIGMA_TOKEN;

  if (!token) return res.status(500).json({ error: 'FIGMA_TOKEN not configured on server.' });
  if (!fileKey) return res.status(400).json({ error: 'Missing fileKey parameter.' });

  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
      headers: { 'X-Figma-Token': token }
    });

    if (response.status === 403) return res.status(403).json({ error: 'Invalid Figma token. Check your FIGMA_TOKEN environment variable.' });
    if (response.status === 404) return res.status(404).json({ error: 'Figma file not found. Check the file key and that the token has access.' });
    if (!response.ok) return res.status(response.status).json({ error: `Figma API error: ${response.statusText}` });

    const data = await response.json();
    const topLevel = (data.comments || []).filter(c => !c.parent_id);
    res.status(200).json({ comments: topLevel });
  } catch (err) {
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
