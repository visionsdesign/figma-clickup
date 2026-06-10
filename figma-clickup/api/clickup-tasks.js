export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.CLICKUP_TOKEN;
  if (!token) return res.status(500).json({ error: 'CLICKUP_TOKEN not configured on server.' });

  const { listId, tasks } = req.body || {};
  if (!listId || !tasks?.length) return res.status(400).json({ error: 'Missing listId or tasks.' });

  const results = [];

  for (const task of tasks) {
    try {
      const body = {
        name: task.name,
        description: task.description,
        priority: task.priority || null,
        tags: task.tags || []
      };

      const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        results.push({ commentId: task.commentId, success: false, error: err.err || response.statusText });
      } else {
        const data = await response.json();
        results.push({ commentId: task.commentId, success: true, taskId: data.id, taskUrl: data.url, taskName: data.name });
      }
    } catch (err) {
      results.push({ commentId: task.commentId, success: false, error: err.message });
    }
  }

  res.status(200).json({ results });
}
