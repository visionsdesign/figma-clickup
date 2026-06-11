export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.FIGMA_TOKEN;
  if (!token) return res.status(500).json({ error: 'FIGMA_TOKEN not configured on server.' });

  const { fileKey, commentId } = req.body || {};
  if (!fileKey || !commentId) return res.status(400).json({ error: 'Missing fileKey or commentId.' });

  console.log('Attempting to resolve comment:', { fileKey, commentId });

  // First, fetch all comments to find the exact internal ID Figma uses
  try {
    const listRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
      headers: { 'X-Figma-Token': token }
    });
    const listData = await listRes.json();
    const allComments = listData.comments || [];

    console.log('All comment IDs from Figma:', allComments.map(c => ({ id: c.id, client_meta: c.client_meta })));

    // Find matching comment — try exact match first, then string comparison
    const match = allComments.find(c =>
      String(c.id) === String(commentId) ||
      c.id === commentId
    );

    if (!match) {
      console.log('Comment not found. Available IDs:', allComments.map(c => c.id));
      return res.status(404).json({
        error: `Comment ID "${commentId}" not found in file. Available IDs: ${allComments.slice(0,5).map(c=>c.id).join(', ')}`,
        availableIds: allComments.map(c => c.id)
      });
    }

    const resolvedId = match.id;
    console.log('Found comment, resolving with ID:', resolvedId);

    const resolveRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments/${resolvedId}`, {
      method: 'PUT',
      headers: {
        'X-Figma-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resolved: true })
    });

    const resolveText = await resolveRes.text();
    console.log('Resolve response status:', resolveRes.status);
    console.log('Resolve response body:', resolveText);

    if (!resolveRes.ok) {
      let errMsg = resolveRes.statusText;
      try { errMsg = JSON.parse(resolveText).message || JSON.parse(resolveText).err || errMsg; } catch {}
      return res.status(resolveRes.status).json({ error: errMsg, detail: resolveText });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resolve error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
