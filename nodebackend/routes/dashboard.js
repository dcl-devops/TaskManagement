const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth, getVisibleUserIds } = require('../middleware/auth');

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const visibleIds = await getVisibleUserIds(req.user.id, req.user.org_id, req.user.role);
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [myTasks, allVisible, overdue, dueToday, dueWeek, byPriority, byStatus, recentTasks] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM tasks WHERE org_id=$1 AND assigned_to=$2 AND status NOT IN ('closed')`, [req.user.org_id, req.user.id]),
      pool.query(`SELECT COUNT(*) FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND status NOT IN ('closed')`, [req.user.org_id, visibleIds]),
      pool.query(`SELECT COUNT(*) FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND due_date < $3 AND status NOT IN ('resolved','closed')`, [req.user.org_id, visibleIds, today]),
      pool.query(`SELECT COUNT(*) FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND due_date = $3 AND status NOT IN ('resolved','closed')`, [req.user.org_id, visibleIds, today]),
      pool.query(`SELECT COUNT(*) FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND due_date BETWEEN $3 AND $4 AND status NOT IN ('resolved','closed')`, [req.user.org_id, visibleIds, today, weekEnd]),
      pool.query(`SELECT priority, COUNT(*) as count FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND status NOT IN ('closed') GROUP BY priority`, [req.user.org_id, visibleIds]),
      pool.query(`SELECT status, COUNT(*) as count FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) GROUP BY status`, [req.user.org_id, visibleIds]),
      pool.query(
        `SELECT t.id, t.task_number, t.title, t.priority, t.status, t.due_date, t.is_pinned,
          at2.name as assigned_to_name, d.name as department_name
         FROM tasks t LEFT JOIN users at2 ON at2.id=t.assigned_to LEFT JOIN departments d ON d.id=t.department_id
         WHERE t.org_id=$1 AND t.assigned_to = ANY($2::int[]) AND t.status NOT IN ('closed')
         ORDER BY t.is_pinned DESC, t.due_date ASC NULLS LAST LIMIT 10`,
        [req.user.org_id, visibleIds]
      )
    ]);

    const priorityMap = {};
    byPriority.rows.forEach(r => priorityMap[r.priority] = parseInt(r.count));

    const statusMap = {};
    byStatus.rows.forEach(r => statusMap[r.status] = parseInt(r.count));

    res.json({
      my_tasks: parseInt(myTasks.rows[0].count),
      total_visible: parseInt(allVisible.rows[0].count),
      overdue: parseInt(overdue.rows[0].count),
      due_today: parseInt(dueToday.rows[0].count),
      due_this_week: parseInt(dueWeek.rows[0].count),
      by_priority: {
        critical: priorityMap.critical || 0,
        high: priorityMap.high || 0,
        medium: priorityMap.medium || 0,
        low: priorityMap.low || 0
      },
      by_status: {
        open: statusMap.open || 0,
        in_progress: statusMap.in_progress || 0,
        on_hold: statusMap.on_hold || 0,
        resolved: statusMap.resolved || 0,
        closed: statusMap.closed || 0
      },
      recent_tasks: recentTasks.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/team-workload', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar_url,
        COUNT(CASE WHEN t.status NOT IN ('closed') THEN 1 END) as active_tasks,
        COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status NOT IN ('resolved','closed') THEN 1 END) as overdue_tasks
       FROM users u
       LEFT JOIN tasks t ON t.assigned_to = u.id AND t.org_id = u.org_id
       WHERE u.org_id = $1 AND (u.manager_id = $2 OR u.id = $2) AND u.status = 'active'
       GROUP BY u.id, u.name, u.avatar_url
       ORDER BY active_tasks DESC`,
      [req.user.org_id, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
