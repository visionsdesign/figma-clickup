export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.CLICKUP_TOKEN;
  if (!token) return res.status(500).json({ error: 'CLICKUP_TOKEN not configured on server.' });

  const { listId, tasks } = req.body || {};
  if (!listId || !tasks?.length) return res.status(400).json({ error: 'Missing listId or tasks.' });

  // Resolve assignee via the correct ClickUp endpoint
  async function resolveAssignee(nameOrEmail) {
    if (!nameOrEmail) return null;
    try {
      const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
        headers: { 'Authorization': token }
      });
      const teamsData = await teamsRes.json();

      for (const team of teamsData.teams || []) {
        const groupRes = await fetch(`https://api.clickup.com/api/v2/group?team_id=${team.id}`, {
          headers: { 'Authorization': token }
        });
        // Use the team members directly from the teams response
        const members = team.members || [];
        const needle = nameOrEmail.toLowerCase();
        const match = members.find(m =>
          m.user?.email?.toLowerCase() === needle ||
          m.user?.username?.toLowerCase() === needle ||
          m.user?.name?.toLowerCase().includes(needle)
        );
        if (match) return match.user.id;
      }
    } catch (e) {
      console.error('Assignee lookup error:', e.message);
    }
    return null;
  }

  const results = [];

  // Resolve assignee once for the whole batch
  let resolvedAssigneeId = null;
  if (tasks[0]?.assignee) {
    resolvedAssigneeId = await resolveAssignee(tasks[0].assignee);
  }

  for (const task of tasks) {
    try {
      const body = {
        name: task.name,
        description: task.description,
        notify_all: false,
        ...(task.priority ? { priority: task.priority } : {}),
        ...(task.tags?.length ? { tags: task.tags } : {}),
        ...(resolvedAssigneeId ? { assignees: [resolvedAssigneeId] } : {}),
        ...(task.startDate ? { start_date: task.startDate, start_date_time: true } : {}),
        ...(task.dueDate ? { due_date: task.dueDate, due_date_time: false } : {})
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
