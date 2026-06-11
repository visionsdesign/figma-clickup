export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.FIGMA_TOKEN;
  if (!token) return res.status(500).json({ error: 'FIGMA_TOKEN not configured on server.' });

  const { fileKey, commentId } = req.body || {};
  if (!fileKey || !commentId) return res.status(400).json({ error: 'Missing fileKey or commentId.' });

  // Try the correct Figma resolve endpoint
  // Figma API: POST /v1/files/:file_key/comments/:comment_id/reactions is not resolve
  // The correct way is PUT /v1/files/:file_key/comments/:comment_id with { resolved: true }
  // BUT this only works with OAuth tokens, not personal access tokens on some scopes
  // We also try the legacy approach just in case

  const url = `https://api.figma.com/v1/files/${fileKey}/comments/${commentId}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'X-Figma-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resolved: true })
    });

    const responseText = await response.text();
    let responseJson = {};
    try { responseJson = JSON.parse(responseText); } catch {}

    // Log full details so we can debug
    console.log('Figma resolve status:', response.status);
    console.log('Figma resolve body:', responseText);

    if (!response.ok) {
      return res.status(response.status).json({
        error: responseJson.message || responseJson.err || response.statusText,
        statusCode: response.status,
        detail: responseText
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
