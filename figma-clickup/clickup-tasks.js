export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.CLICKUP_TOKEN;
  if (!token) return res.status(500).json({ error: 'CLICKUP_TOKEN not configured on server.' });

  const { listId, tasks } = req.body || {};
  if (!listId || !tasks?.length) return res.status(400).json({ error: 'Missing listId or tasks.' });

  // If an assignee name/email is provided, look up their ClickUp user ID
  async function resolveAssignee(nameOrEmail) {
    if (!nameOrEmail) return null;
    try {
      const r = await fetch('https://api.clickup.com/api/v2/team', { headers: { 'Authorization': token } });
      const d = await r.json();
      for (const team of d.teams || []) {
        const membersRes = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/member`, { headers: { 'Authorization': token } });
        const membersData = await membersRes.json();
        const match = (membersData.members || []).find(m =>
          m.user?.email?.toLowerCase() === nameOrEmail.toLowerCase() ||
          m.user?.username?.toLowerCase() === nameOrEmail.toLowerCase() ||
          m.user?.name?.toLowerCase().includes(nameOrEmail.toLowerCase())
        );
        if (match) return match.user.id;
      }
    } catch {}
    return null;
  }

  const results = [];
  let resolvedAssigneeId = null;

  // Resolve assignee once for the whole batch
  if (tasks[0]?.assignee) {
    resolvedAssigneeId = await resolveAssignee(tasks[0].assignee);
  }

  for (const task of tasks) {
    try {
      const body = {
        name: task.name,
        description: task.description,
        ...(task.priority ? { priority: task.priority } : {}),
        ...(task.tags?.length ? { tags: task.tags } : {}),
        ...(resolvedAssigneeId ? { assignees: [resolvedAssigneeId] } : {}),
        ...(task.dueDate ? { due_date: task.dueDate, due_date_time: true } : {})
      };

      const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
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
