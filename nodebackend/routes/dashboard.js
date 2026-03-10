const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth, getVisibleUserIds } = require('../middleware/auth');

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const visibleIds = await getVisibleUserIds(req.user.id, req.user.org_id, req.user.role);
    const today = new Date().toISOString().split('T')[0];
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const [myOpenTasks, overdue, dueToday, byPriority, byStatus, totalProjects, activeProjects,
           totalMeetings, openMeetings, pinnedTasks, teamWorkload, todayMeetings,
           monthlyTasks, monthlyMeetings] = await Promise.all([
      // Open tasks (not closed/resolved)
      pool.query(`SELECT COUNT(*) FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND status NOT IN ('resolved','closed')`, [req.user.org_id, visibleIds]),
      // Overdue
      pool.query(`SELECT COUNT(*) FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND due_date < $3 AND status NOT IN ('resolved','closed')`, [req.user.org_id, visibleIds, today]),
      // Due today
      pool.query(`SELECT COUNT(*) FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND due_date = $3 AND status NOT IN ('resolved','closed')`, [req.user.org_id, visibleIds, today]),
      // By priority
      pool.query(`SELECT priority, COUNT(*) as count FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) AND status NOT IN ('closed') GROUP BY priority`, [req.user.org_id, visibleIds]),
      // By status
      pool.query(`SELECT status, COUNT(*) as count FROM tasks WHERE org_id=$1 AND assigned_to = ANY($2::int[]) GROUP BY status`, [req.user.org_id, visibleIds]),
      // Total projects
      pool.query(`SELECT COUNT(DISTINCT p.id) FROM projects p LEFT JOIN project_members pm ON pm.project_id=p.id WHERE p.org_id=$1 AND (p.owner_id=$2 OR p.created_by=$2 OR pm.user_id=$2)`, [req.user.org_id, req.user.id]),
      // Active projects
      pool.query(`SELECT COUNT(DISTINCT p.id) FROM projects p LEFT JOIN project_members pm ON pm.project_id=p.id WHERE p.org_id=$1 AND (p.owner_id=$2 OR p.created_by=$2 OR pm.user_id=$2) AND p.status='active'`, [req.user.org_id, req.user.id]),
      // Total meetings
      pool.query(`SELECT COUNT(DISTINCT m.id) FROM meetings m LEFT JOIN meeting_members mm ON mm.meeting_id=m.id WHERE m.org_id=$1 AND (m.owner_id=$2 OR m.created_by=$2 OR mm.user_id=$2)`, [req.user.org_id, req.user.id]),
      // Open meetings
      pool.query(`SELECT COUNT(DISTINCT m.id) FROM meetings m LEFT JOIN meeting_members mm ON mm.meeting_id=m.id WHERE m.org_id=$1 AND (m.owner_id=$2 OR m.created_by=$2 OR mm.user_id=$2) AND m.status='open'`, [req.user.org_id, req.user.id]),
      // Pinned tasks
      pool.query(
        `SELECT t.id, t.task_number, t.title, t.priority, t.status, t.due_date, t.is_pinned,
          at2.name as assigned_to_name
         FROM tasks t LEFT JOIN users at2 ON at2.id=t.assigned_to
         WHERE t.org_id=$1 AND t.assigned_to = ANY($2::int[]) AND t.is_pinned = true
         ORDER BY t.due_date ASC NULLS LAST LIMIT 10`,
        [req.user.org_id, visibleIds]
      ),
      // Team workload
      pool.query(
        `SELECT u.id, u.name, u.avatar_url,
          COUNT(CASE WHEN t.status NOT IN ('closed') THEN 1 END) as active_tasks,
          COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status NOT IN ('resolved','closed') THEN 1 END) as overdue_tasks
         FROM users u LEFT JOIN tasks t ON t.assigned_to=u.id AND t.org_id=u.org_id
         WHERE u.org_id=$1 AND (u.manager_id=$2 OR u.id=$2) AND u.status='active'
         GROUP BY u.id, u.name, u.avatar_url ORDER BY active_tasks DESC`,
        [req.user.org_id, req.user.id]
      ),
      // Today's meetings
      pool.query(
        `SELECT m.id, m.meeting_number, m.title, m.meeting_date, m.status, u.name as owner_name
         FROM meetings m LEFT JOIN users u ON u.id=m.owner_id
         LEFT JOIN meeting_members mm ON mm.meeting_id=m.id
         WHERE m.org_id=$1 AND (m.owner_id=$2 OR m.created_by=$2 OR mm.user_id=$2)
         AND DATE(m.meeting_date)=$3
         GROUP BY m.id, m.meeting_number, m.title, m.meeting_date, m.status, u.name
         ORDER BY m.meeting_date ASC`,
        [req.user.org_id, req.user.id, today]
      ),
      // Monthly tasks created/completed for the year
      pool.query(
        `SELECT 
          EXTRACT(MONTH FROM t.created_at) as month,
          COUNT(*) as created,
          COUNT(CASE WHEN t.status IN ('resolved','closed') THEN 1 END) as completed
         FROM tasks t
         WHERE t.org_id=$1 AND t.assigned_to = ANY($2::int[]) AND t.created_at BETWEEN $3 AND $4
         GROUP BY EXTRACT(MONTH FROM t.created_at) ORDER BY month`,
        [req.user.org_id, visibleIds, yearStart, yearEnd + ' 23:59:59']
      ),
      // Monthly meetings for the year
      pool.query(
        `SELECT EXTRACT(MONTH FROM m.meeting_date) as month, COUNT(DISTINCT m.id) as count
         FROM meetings m LEFT JOIN meeting_members mm ON mm.meeting_id=m.id
         WHERE m.org_id=$1 AND (m.owner_id=$2 OR m.created_by=$2 OR mm.user_id=$2)
         AND m.meeting_date BETWEEN $3 AND $4
         GROUP BY EXTRACT(MONTH FROM m.meeting_date) ORDER BY month`,
        [req.user.org_id, req.user.id, yearStart, yearEnd + ' 23:59:59']
      )
    ]);

    const priorityMap = {};
    byPriority.rows.forEach(r => priorityMap[r.priority] = parseInt(r.count));
    const statusMap = {};
    byStatus.rows.forEach(r => statusMap[r.status] = parseInt(r.count));

    // Build monthly arrays (12 months)
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const taskTrend = { labels: months, created: Array(12).fill(0), completed: Array(12).fill(0) };
    monthlyTasks.rows.forEach(r => {
      const i = parseInt(r.month) - 1;
      taskTrend.created[i] = parseInt(r.created);
      taskTrend.completed[i] = parseInt(r.completed);
    });
    const meetingTrend = { labels: months, count: Array(12).fill(0) };
    monthlyMeetings.rows.forEach(r => {
      const i = parseInt(r.month) - 1;
      meetingTrend.count[i] = parseInt(r.count);
    });

    res.json({
      open_tasks: parseInt(myOpenTasks.rows[0].count),
      overdue: parseInt(overdue.rows[0].count),
      due_today: parseInt(dueToday.rows[0].count),
      total_projects: parseInt(totalProjects.rows[0].count),
      active_projects: parseInt(activeProjects.rows[0].count),
      total_meetings: parseInt(totalMeetings.rows[0].count),
      open_meetings: parseInt(openMeetings.rows[0].count),
      by_priority: { critical: priorityMap.critical||0, high: priorityMap.high||0, medium: priorityMap.medium||0, low: priorityMap.low||0 },
      by_status: { open: statusMap.open||0, in_progress: statusMap.in_progress||0, on_hold: statusMap.on_hold||0, resolved: statusMap.resolved||0, closed: statusMap.closed||0 },
      total_visible: Object.values(statusMap).reduce((a, b) => a + b, 0),
      pinned_tasks: pinnedTasks.rows,
      team_workload: teamWorkload.rows,
      today_meetings: todayMeetings.rows,
      task_trend: taskTrend,
      meeting_trend: meetingTrend,
      year
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
