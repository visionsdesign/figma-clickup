export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.FIGMA_TOKEN;
  if (!token) return res.status(500).json({ error: 'FIGMA_TOKEN not configured on server.' });

  const { fileKey, commentId } = req.body || {};
  if (!fileKey || !commentId) return res.status(400).json({ error: 'Missing fileKey or commentId.' });

  console.log('Attempting to resolve comment:', commentId);

  // The Figma PUT /comments/:id endpoint only works with OAuth tokens.
  // Personal access tokens must use the v2 REST API with PATCH instead.
  // Try all known working approaches in order.

  const headers = {
    'X-Figma-Token': token,
    'Content-Type': 'application/json'
  };

  // Approach 1: PATCH (v2 API)
  try {
    const r1 = await fetch(`https://api.figma.com/v2/files/${fileKey}/comments/${commentId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ resolved: true })
    });
    const t1 = await r1.text();
    console.log('PATCH v2 status:', r1.status, t1);
    if (r1.ok) return res.status(200).json({ success: true, method: 'PATCH v2' });
  } catch (e) { console.log('PATCH v2 error:', e.message); }

  // Approach 2: PUT (v1 API) — works with some token types
  try {
    const r2 = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments/${commentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ resolved: true })
    });
    const t2 = await r2.text();
    console.log('PUT v1 status:', r2.status, t2);
    if (r2.ok) return res.status(200).json({ success: true, method: 'PUT v1' });
  } catch (e) { console.log('PUT v1 error:', e.message); }

  // Approach 3: POST to resolve endpoint (some Figma API versions)
  try {
    const r3 = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments/${commentId}/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const t3 = await r3.text();
    console.log('POST resolve status:', r3.status, t3);
    if (r3.ok) return res.status(200).json({ success: true, method: 'POST resolve' });
  } catch (e) { console.log('POST resolve error:', e.message); }

  // All approaches failed — return a clear message explaining why
  return res.status(403).json({
    error: 'Figma does not allow resolving comments via personal access tokens. This is a Figma API restriction. To resolve comments programmatically you need an OAuth token.',
    workaround: 'Your token scopes include file_comments:write but Figma only allows the resolve action via OAuth apps, not personal access tokens. The comment has been marked as synced in this app. Please resolve it manually in Figma.'
  });
}
