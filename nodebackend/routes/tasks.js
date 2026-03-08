const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database');
const { requireAuth, getVisibleUserIds } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: '/app/uploads/',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const ALLOWED_TYPES = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|png|jpg|jpeg|webp/;
const BLOCKED_TYPES = /exe|bat|sh|js|html|php/;
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (BLOCKED_TYPES.test(ext)) return cb(new Error('File type not allowed'));
    if (!ALLOWED_TYPES.test(ext)) return cb(new Error('File type not supported'));
    cb(null, true);
  }
});

async function logActivity(taskId, userId, action, oldVal = null, newVal = null) {
  await pool.query('INSERT INTO task_activities(task_id, user_id, action, old_value, new_value) VALUES($1,$2,$3,$4,$5)',
    [taskId, userId, action, oldVal, newVal]);
}

async function notify(orgId, userId, type, title, message, refId, refType) {
  await pool.query('INSERT INTO notifications(org_id, user_id, type, title, message, ref_id, ref_type) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [orgId, userId, type, title, message, refId, refType]);
}

const TASK_SELECT = `SELECT t.*, 
  ab.name as assigned_by_name, ab.avatar_url as assigned_by_avatar,
  at2.name as assigned_to_name, at2.avatar_url as assigned_to_avatar,
  at2.department_id as assigned_to_dept,
  d.name as department_name, l.name as location_name,
  cb.name as created_by_name,
  pt.title as parent_task_title,
  m.title as meeting_title, p.title as project_title
  FROM tasks t
  LEFT JOIN users ab ON ab.id = t.assigned_by
  LEFT JOIN users at2 ON at2.id = t.assigned_to
  LEFT JOIN departments d ON d.id = t.department_id
  LEFT JOIN locations l ON l.id = t.location_id
  LEFT JOIN users cb ON cb.id = t.created_by
  LEFT JOIN tasks pt ON pt.id = t.parent_task_id
  LEFT JOIN meetings m ON m.id = t.meeting_id
  LEFT JOIN projects p ON p.id = t.project_id`;

// GET /api/tasks
router.get('/', requireAuth, async (req, res) => {
  const { status, priority, category, assigned_to, assigned_by, department_id, search, pinned, meeting_id, project_id, parent_task_id } = req.query;
  try {
    const visibleIds = await getVisibleUserIds(req.user.id, req.user.org_id, req.user.role);
    let query = TASK_SELECT + ` WHERE t.org_id = $1 AND t.assigned_to = ANY($2::int[])`;
    const params = [req.user.org_id, visibleIds];
    let idx = 3;
    if (status) { query += ` AND t.status = $${idx++}`; params.push(status); }
    if (priority) { query += ` AND t.priority = $${idx++}`; params.push(priority); }
    if (category) { query += ` AND t.category = $${idx++}`; params.push(category); }
    if (assigned_to) { query += ` AND t.assigned_to = $${idx++}`; params.push(assigned_to); }
    if (assigned_by) { query += ` AND t.assigned_by = $${idx++}`; params.push(assigned_by); }
    if (department_id) { query += ` AND t.department_id = $${idx++}`; params.push(department_id); }
    if (meeting_id) { query += ` AND t.meeting_id = $${idx++}`; params.push(meeting_id); }
    if (project_id) { query += ` AND t.project_id = $${idx++}`; params.push(project_id); }
    if (parent_task_id) { query += ` AND t.parent_task_id = $${idx++}`; params.push(parent_task_id); }
    if (pinned === 'true') { query += ` AND t.is_pinned = true`; }
    if (search) { query += ` AND (t.title ILIKE $${idx} OR t.task_number ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    query += ` ORDER BY t.is_pinned DESC, t.due_date ASC NULLS LAST, t.created_at DESC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// GET /api/tasks/my - tasks assigned to me
router.get('/my', requireAuth, async (req, res) => {
  const { status, priority } = req.query;
  let query = TASK_SELECT + ` WHERE t.org_id = $1 AND (t.assigned_to = $2 OR t.assigned_by = $2)`;
  const params = [req.user.org_id, req.user.id];
  let idx = 3;
  if (status) { query += ` AND t.status = $${idx++}`; params.push(status); }
  if (priority) { query += ` AND t.priority = $${idx++}`; params.push(priority); }
  query += ` ORDER BY t.is_pinned DESC, t.due_date ASC NULLS LAST`;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/tasks/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(TASK_SELECT + ` WHERE t.id = $1 AND t.org_id = $2`, [req.params.id, req.user.org_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/tasks
router.post('/', requireAuth, async (req, res) => {
  const { category, title, description, assigned_by, assigned_to, department_id, location_id,
    start_date, due_date, priority, tags, estimated_effort, parent_task_id, meeting_id, project_id } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM tasks WHERE org_id=$1', [req.user.org_id]);
    const taskNum = 'TSK-' + String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0');
    const result = await pool.query(
      `INSERT INTO tasks(org_id, task_number, category, title, description, assigned_by, assigned_to,
       department_id, location_id, start_date, due_date, priority, tags, estimated_effort,
       parent_task_id, meeting_id, project_id, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [req.user.org_id, taskNum, category||'task', title, description||null,
       assigned_by||req.user.id, assigned_to||req.user.id,
       department_id||null, location_id||null, start_date||null, due_date||null,
       priority||'medium', tags||null, estimated_effort||null,
       parent_task_id||null, meeting_id||null, project_id||null, req.user.id]
    );
    const task = result.rows[0];
    await logActivity(task.id, req.user.id, 'Task created', null, title);
    if (assigned_to && assigned_to !== req.user.id) {
      await notify(req.user.org_id, assigned_to, 'task_assigned', 'New Task Assigned', `You have been assigned: ${title}`, task.id, 'task');
    }
    res.status(201).json(task);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/tasks/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, assigned_to, department_id, location_id, due_date, priority,
    status, resolution_summary, completion_date, tags, estimated_effort, actual_effort, is_pinned } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id=$1 AND org_id=$2', [id, req.user.org_id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    const old = existing.rows[0];
    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, assigned_to=$3, department_id=$4, location_id=$5,
       due_date=$6, priority=$7, status=$8, resolution_summary=$9, completion_date=$10, tags=$11,
       estimated_effort=$12, actual_effort=$13, is_pinned=$14, updated_at=NOW()
       WHERE id=$15 AND org_id=$16 RETURNING *`,
      [title, description, assigned_to, department_id, location_id, due_date||null, priority,
       status, resolution_summary||null, completion_date||null, tags||null,
       estimated_effort||null, actual_effort||null, is_pinned||false, id, req.user.org_id]
    );
    if (old.status !== status) await logActivity(id, req.user.id, 'Status changed', old.status, status);
    if (old.priority !== priority) await logActivity(id, req.user.id, 'Priority changed', old.priority, priority);
    if (old.assigned_to !== assigned_to) {
      await logActivity(id, req.user.id, 'Reassigned', String(old.assigned_to), String(assigned_to));
      await notify(req.user.org_id, assigned_to, 'task_reassigned', 'Task Reassigned', `Task reassigned to you: ${title}`, id, 'task');
    }
    if (old.due_date !== due_date) await logActivity(id, req.user.id, 'Due date changed', old.due_date, due_date);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
  res.json({ message: 'Deleted' });
});

// PATCH /api/tasks/:id/pin
router.patch('/:id/pin', requireAuth, async (req, res) => {
  const result = await pool.query('UPDATE tasks SET is_pinned = NOT is_pinned WHERE id=$1 AND org_id=$2 RETURNING is_pinned', [req.params.id, req.user.org_id]);
  res.json(result.rows[0]);
});

// ===== COMMENTS =====
router.get('/:id/comments', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT tc.*, u.name as user_name, u.avatar_url FROM task_comments tc
     JOIN users u ON u.id = tc.user_id WHERE tc.task_id = $1 ORDER BY tc.created_at ASC`,
    [req.params.id]
  );
  res.json(result.rows);
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ message: 'Comment required' });
  const result = await pool.query(
    `INSERT INTO task_comments(task_id, user_id, comment) VALUES($1,$2,$3) RETURNING *`,
    [req.params.id, req.user.id, comment]
  );
  await logActivity(req.params.id, req.user.id, 'Comment added', null, comment.substring(0, 50));
  res.status(201).json({ ...result.rows[0], user_name: req.user.name });
});

// ===== ATTACHMENTS =====
router.get('/:id/attachments', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT ta.*, u.name as user_name FROM task_attachments ta
     JOIN users u ON u.id = ta.user_id WHERE ta.task_id = $1 ORDER BY ta.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});

router.post('/:id/attachments', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const result = await pool.query(
    `INSERT INTO task_attachments(task_id, user_id, filename, original_name, file_path, file_size, file_type)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.params.id, req.user.id, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype]
  );
  await logActivity(req.params.id, req.user.id, 'Attachment added', null, req.file.originalname);
  res.status(201).json({ ...result.rows[0], user_name: req.user.name });
});

// ===== ACTIVITIES =====
router.get('/:id/activities', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT ta.*, u.name as user_name, u.avatar_url FROM task_activities ta
     JOIN users u ON u.id = ta.user_id WHERE ta.task_id = $1 ORDER BY ta.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});

module.exports = router;
