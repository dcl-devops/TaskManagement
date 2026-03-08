const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth, getVisibleUserIds } = require('../middleware/auth');

router.get('/events', requireAuth, async (req, res) => {
  const { start, end } = req.query;
  const visibleIds = await getVisibleUserIds(req.user.id, req.user.org_id, req.user.role);
  try {
    const [tasks, meetings] = await Promise.all([
      pool.query(
        `SELECT t.id, t.task_number, t.title, t.due_date as date, t.priority, t.status, 'task' as type,
          at2.name as assigned_to_name
         FROM tasks t LEFT JOIN users at2 ON at2.id=t.assigned_to
         WHERE t.org_id=$1 AND t.assigned_to = ANY($2::int[]) AND t.due_date BETWEEN $3 AND $4`,
        [req.user.org_id, visibleIds, start, end]
      ),
      pool.query(
        `SELECT m.id, m.meeting_number, m.title, m.meeting_date as date, 'meeting' as type, m.status,
          u.name as owner_name
         FROM meetings m LEFT JOIN users u ON u.id=m.owner_id
         WHERE m.org_id=$1 AND m.meeting_date::date BETWEEN $2 AND $3`,
        [req.user.org_id, start, end]
      )
    ]);
    const events = [
      ...tasks.rows.map(t => ({ ...t, color: getPriorityColor(t.priority) })),
      ...meetings.rows.map(m => ({ ...m, color: '#6366f1' }))
    ];
    res.json(events);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

function getPriorityColor(priority) {
  const colors = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
  return colors[priority] || '#64748b';
}

module.exports = router;
