export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.FIGMA_TOKEN;
  if (!token) return res.status(500).json({ error: 'FIGMA_TOKEN not configured on server.' });

  const { fileKey, commentId } = req.body || {};
  if (!fileKey || !commentId) return res.status(400).json({ error: 'Missing fileKey or commentId.' });

  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'X-Figma-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resolved: true })
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errMsg = response.statusText;
      try { errMsg = JSON.parse(responseText).message || errMsg; } catch {}
      return res.status(response.status).json({ error: errMsg });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
