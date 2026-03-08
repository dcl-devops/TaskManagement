const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth, getVisibleUserIds } = require('../middleware/auth');

router.get('/overdue-tasks', requireAuth, async (req, res) => {
  const { department_id, assigned_to } = req.query;
  const visibleIds = await getVisibleUserIds(req.user.id, req.user.org_id, req.user.role);
  let query = `SELECT t.task_number, t.title, t.priority, t.status, t.due_date,
    t.due_date::date - CURRENT_DATE as days_overdue,
    at2.name as assigned_to_name, ab.name as assigned_by_name, d.name as department_name
    FROM tasks t LEFT JOIN users at2 ON at2.id=t.assigned_to
    LEFT JOIN users ab ON ab.id=t.assigned_by LEFT JOIN departments d ON d.id=t.department_id
    WHERE t.org_id=$1 AND t.assigned_to = ANY($2::int[]) AND t.due_date < CURRENT_DATE AND t.status NOT IN ('resolved','closed')`;
  const params = [req.user.org_id, visibleIds];
  let idx = 3;
  if (department_id) { query += ` AND t.department_id = $${idx++}`; params.push(department_id); }
  if (assigned_to) { query += ` AND t.assigned_to = $${idx++}`; params.push(assigned_to); }
  query += ' ORDER BY t.due_date ASC';
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.get('/task-aging', requireAuth, async (req, res) => {
  const visibleIds = await getVisibleUserIds(req.user.id, req.user.org_id, req.user.role);
  const result = await pool.query(
    `SELECT t.task_number, t.title, t.priority, t.status, t.created_at,
      CURRENT_DATE - t.created_at::date as age_days,
      at2.name as assigned_to_name, d.name as department_name
     FROM tasks t LEFT JOIN users at2 ON at2.id=t.assigned_to LEFT JOIN departments d ON d.id=t.department_id
     WHERE t.org_id=$1 AND t.assigned_to = ANY($2::int[]) AND t.status NOT IN ('closed')
     ORDER BY age_days DESC`,
    [req.user.org_id, visibleIds]
  );
  res.json(result.rows);
});

router.get('/user-productivity', requireAuth, async (req, res) => {
  const visibleIds = await getVisibleUserIds(req.user.id, req.user.org_id, req.user.role);
  const result = await pool.query(
    `SELECT u.id, u.name, u.department_id, d.name as department_name,
      COUNT(t.id) as total_tasks,
      COUNT(CASE WHEN t.status IN ('resolved','closed') THEN 1 END) as completed,
      COUNT(CASE WHEN t.status NOT IN ('resolved','closed') AND t.due_date < CURRENT_DATE THEN 1 END) as overdue,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress
     FROM users u
     LEFT JOIN tasks t ON t.assigned_to = u.id AND t.org_id = $1
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = ANY($2::int[]) AND u.org_id = $1
     GROUP BY u.id, u.name, u.department_id, d.name ORDER BY completed DESC`,
    [req.user.org_id, visibleIds]
  );
  res.json(result.rows);
});

router.get('/department-performance', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT d.name as department_name,
      COUNT(t.id) as total_tasks,
      COUNT(CASE WHEN t.status IN ('resolved','closed') THEN 1 END) as completed,
      COUNT(CASE WHEN t.status NOT IN ('resolved','closed') AND t.due_date < CURRENT_DATE THEN 1 END) as overdue
     FROM departments d LEFT JOIN tasks t ON t.department_id = d.id AND t.org_id = $1
     WHERE d.org_id = $1 GROUP BY d.name ORDER BY total_tasks DESC`,
    [req.user.org_id]
  );
  res.json(result.rows);
});

router.get('/project-progress', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT p.project_number, p.title, p.status, p.priority, p.start_date, p.end_date,
      u.name as owner_name,
      COUNT(t.id) as total_tasks,
      COUNT(CASE WHEN t.status IN ('resolved','closed') THEN 1 END) as completed_tasks
     FROM projects p LEFT JOIN users u ON u.id=p.owner_id
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.org_id = $1 GROUP BY p.id, p.project_number, p.title, p.status, p.priority, p.start_date, p.end_date, u.name
     ORDER BY p.created_at DESC`,
    [req.user.org_id]
  );
  res.json(result.rows);
});

module.exports = router;
