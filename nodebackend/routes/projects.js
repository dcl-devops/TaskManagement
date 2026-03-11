const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

function cleanInt(v) { if (v === null || v === undefined || v === '' || v === 'null') return null; const n = parseInt(v); return isNaN(n) ? null : n; }

const PRJ_SELECT = `SELECT p.*, 
  u.name as owner_name, d.name as department_name, l.name as location_name,
  cb.name as created_by_name,
  (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id OR t.meeting_id IN (SELECT mm.id FROM meetings mm WHERE mm.project_id = p.id)) as total_tasks,
  (SELECT COUNT(*) FROM tasks t WHERE (t.project_id = p.id OR t.meeting_id IN (SELECT mm.id FROM meetings mm WHERE mm.project_id = p.id)) AND t.status IN ('resolved','closed')) as completed_tasks,
  (SELECT COUNT(*) FROM tasks t WHERE (t.project_id = p.id OR t.meeting_id IN (SELECT mm.id FROM meetings mm WHERE mm.project_id = p.id)) AND t.status NOT IN ('resolved','closed')) as pending_tasks,
  (SELECT COUNT(*) FROM meetings m WHERE m.project_id = p.id) as total_meetings,
  (SELECT COUNT(*) FROM meetings m WHERE m.project_id = p.id AND m.status = 'closed') as completed_meetings,
  (SELECT COUNT(*) FROM meetings m WHERE m.project_id = p.id AND m.status != 'closed') as pending_meetings,
  (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
  FROM projects p
  LEFT JOIN users u ON u.id = p.owner_id
  LEFT JOIN departments d ON d.id = p.department_id
  LEFT JOIN locations l ON l.id = p.location_id
  LEFT JOIN users cb ON cb.id = p.created_by`;

router.get('/', requireAuth, async (req, res) => {
  const { status, priority, search } = req.query;
  const uid = req.user.id;
  const role = req.user.role;
  let visClause;
  if (role === 'owner' || role === 'admin') {
    visClause = `p.org_id = $1`;
  } else {
    visClause = `p.org_id = $1 AND (p.owner_id = $2 OR p.created_by = $2 OR p.id IN (SELECT pm2.project_id FROM project_members pm2 WHERE pm2.user_id = $2))`;
  }
  let query = PRJ_SELECT + ` WHERE ` + visClause;
  const params = [req.user.org_id];
  let idx = 2;
  if (role !== 'owner' && role !== 'admin') { params.push(uid); idx = 3; }
  if (status) { query += ` AND p.status = $${idx++}`; params.push(status); }
  if (priority) { query += ` AND p.priority = $${idx++}`; params.push(priority); }
  if (search) { query += ` AND p.title ILIKE $${idx++}`; params.push(`%${search}%`); }
  query += ` ORDER BY p.created_at DESC`;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(PRJ_SELECT + ` WHERE p.id = $1 AND p.org_id = $2`, [req.params.id, req.user.org_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Project not found' });
    const project = result.rows[0];
    const members = await pool.query(
      `SELECT pm.user_id, u.name, u.email, u.avatar_url FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = $1`,
      [req.params.id]
    );
    project.members = members.rows;
    const meetings = await pool.query(
      `SELECT m.id, m.meeting_number, m.title, m.meeting_date, m.status,
        (SELECT COUNT(*) FROM tasks t WHERE t.meeting_id = m.id) as task_count
       FROM meetings m WHERE m.project_id = $1 ORDER BY m.meeting_date DESC`,
      [req.params.id]
    );
    project.meetings = meetings.rows;
    // All tasks: direct project tasks + tasks from project's meetings
    const allTasks = await pool.query(
      `SELECT t.id, t.task_number, t.title, t.priority, t.status, t.due_date, t.category,
        t.meeting_id, t.project_id, t.parent_task_id,
        at2.name as assigned_to_name, m.title as meeting_title
       FROM tasks t
       LEFT JOIN users at2 ON at2.id = t.assigned_to
       LEFT JOIN meetings m ON m.id = t.meeting_id
       WHERE t.org_id = $1 AND (t.project_id = $2 OR t.meeting_id IN (SELECT mm.id FROM meetings mm WHERE mm.project_id = $2))
       ORDER BY t.created_at DESC`,
      [req.user.org_id, req.params.id]
    );
    project.all_tasks = allTasks.rows;
    project.progress = parseInt(project.total_tasks) > 0 ? Math.round((parseInt(project.completed_tasks) / parseInt(project.total_tasks)) * 100) : 0;
    res.json(project);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, owner_id, department_id, location_id, start_date, end_date, priority, status, member_ids } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const countRes = await client.query('SELECT COUNT(*) FROM projects WHERE org_id=$1', [req.user.org_id]);
    const prjNum = 'PRJ-' + String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0');
    const result = await client.query(
      `INSERT INTO projects(org_id, project_number, title, description, owner_id, department_id, location_id, start_date, end_date, priority, status, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user.org_id, prjNum, title, description||null, cleanInt(owner_id)||req.user.id,
       cleanInt(department_id), cleanInt(location_id), start_date||null, end_date||null,
       priority||'medium', status||'active', req.user.id]
    );
    const project = result.rows[0];
    if (member_ids && member_ids.length > 0) {
      for (const uid of member_ids) {
        await client.query('INSERT INTO project_members(project_id, user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [project.id, uid]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json(project);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally { client.release(); }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, description, owner_id, department_id, location_id, start_date, end_date, priority, status, member_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE projects SET title=$1, description=$2, owner_id=$3, department_id=$4, location_id=$5,
       start_date=$6, end_date=$7, priority=$8, status=$9, updated_at=NOW()
       WHERE id=$10 AND org_id=$11 RETURNING *`,
      [title, description||null, cleanInt(owner_id), cleanInt(department_id), cleanInt(location_id),
       start_date||null, end_date||null, priority, status, req.params.id, req.user.org_id]
    );
    if (member_ids !== undefined) {
      await client.query('DELETE FROM project_members WHERE project_id=$1', [req.params.id]);
      for (const uid of member_ids) {
        await client.query('INSERT INTO project_members(project_id, user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [req.params.id, uid]);
      }
    }
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error' });
  } finally { client.release(); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
  res.json({ message: 'Deleted' });
});

// Updates
router.get('/:id/updates', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT pu.*, u.name as user_name, u.avatar_url FROM project_updates pu
     JOIN users u ON u.id = pu.user_id WHERE pu.project_id = $1 ORDER BY pu.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});
router.post('/:id/updates', requireAuth, async (req, res) => {
  const { remark } = req.body;
  if (!remark) return res.status(400).json({ message: 'Remark required' });
  const r = await pool.query(
    'INSERT INTO project_updates(project_id, user_id, remark) VALUES($1,$2,$3) RETURNING *',
    [req.params.id, req.user.id, remark]
  );
  res.status(201).json({ ...r.rows[0], user_name: req.user.name, avatar_url: req.user.avatar_url });
});

module.exports = router;
