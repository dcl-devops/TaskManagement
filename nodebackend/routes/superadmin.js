const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_secret_key_enterprise_2024';

// Middleware
function requireSuperAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (!decoded.is_superadmin) return res.status(403).json({ message: 'Forbidden' });
    req.superadmin = decoded;
    next();
  } catch (err) { return res.status(401).json({ message: 'Invalid token' }); }
}

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const result = await pool.query('SELECT * FROM superadmins WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name, is_superadmin: true }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Dashboard stats
router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const [orgs, users, tasks, projects, meetings, recentOrgs, monthlySignups] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM organizations'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM tasks'),
      pool.query('SELECT COUNT(*) FROM projects'),
      pool.query('SELECT COUNT(*) FROM meetings'),
      pool.query(`SELECT o.id, o.name, o.domain, o.created_at,
        (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.org_id = o.id) as task_count,
        (SELECT COUNT(*) FROM projects p WHERE p.org_id = o.id) as project_count,
        (SELECT COUNT(*) FROM meetings m WHERE m.org_id = o.id) as meeting_count
        FROM organizations o ORDER BY o.created_at DESC LIMIT 10`),
      pool.query(`SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count FROM organizations WHERE created_at > NOW() - INTERVAL '12 months' GROUP BY month ORDER BY month`)
    ]);
    res.json({
      total_orgs: parseInt(orgs.rows[0].count),
      total_users: parseInt(users.rows[0].count),
      total_tasks: parseInt(tasks.rows[0].count),
      total_projects: parseInt(projects.rows[0].count),
      total_meetings: parseInt(meetings.rows[0].count),
      recent_orgs: recentOrgs.rows,
      monthly_signups: monthlySignups.rows
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// List all organizations
router.get('/organizations', requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT o.id, o.name, o.domain, o.status, o.created_at,
      (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.org_id = o.id) as task_count,
      (SELECT COUNT(*) FROM projects p WHERE p.org_id = o.id) as project_count,
      (SELECT COUNT(*) FROM meetings m WHERE m.org_id = o.id) as meeting_count
      FROM organizations o ORDER BY o.created_at DESC`);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Org detail with users
router.get('/organizations/:id', requireSuperAdmin, async (req, res) => {
  try {
    const org = await pool.query(`SELECT o.*, 
      (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.org_id = o.id) as task_count,
      (SELECT COUNT(*) FROM projects p WHERE p.org_id = o.id) as project_count,
      (SELECT COUNT(*) FROM meetings m WHERE m.org_id = o.id) as meeting_count
      FROM organizations o WHERE o.id = $1`, [req.params.id]);
    if (org.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const users = await pool.query(`SELECT id, name, email, role, status, created_at FROM users WHERE org_id = $1 ORDER BY created_at`, [req.params.id]);
    const tasks = await pool.query(`SELECT status, COUNT(*) as count FROM tasks WHERE org_id = $1 GROUP BY status`, [req.params.id]);
    res.json({ ...org.rows[0], users: users.rows, task_breakdown: tasks.rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Activate/Deactivate org
router.patch('/organizations/:id/status', requireSuperAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    await pool.query('UPDATE organizations SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: `Organization ${status}` });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Delete org
router.delete('/organizations/:id', requireSuperAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.params.id;
    await client.query('DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM task_activities WHERE task_id IN (SELECT id FROM tasks WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM task_comments WHERE task_id IN (SELECT id FROM tasks WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM tasks WHERE org_id=$1', [orgId]);
    await client.query('DELETE FROM meeting_mom WHERE meeting_id IN (SELECT id FROM meetings WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM meeting_updates WHERE meeting_id IN (SELECT id FROM meetings WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM meeting_members WHERE meeting_id IN (SELECT id FROM meetings WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM meetings WHERE org_id=$1', [orgId]);
    await client.query('DELETE FROM project_updates WHERE project_id IN (SELECT id FROM projects WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM project_members WHERE project_id IN (SELECT id FROM projects WHERE org_id=$1)', [orgId]);
    await client.query('DELETE FROM projects WHERE org_id=$1', [orgId]);
    await client.query('DELETE FROM users WHERE org_id=$1', [orgId]);
    await client.query('DELETE FROM companies WHERE org_id=$1', [orgId]);
    await client.query('DELETE FROM locations WHERE org_id=$1', [orgId]);
    await client.query('DELETE FROM departments WHERE org_id=$1', [orgId]);
    await client.query('DELETE FROM designations WHERE org_id=$1', [orgId]);
    await client.query('DELETE FROM organizations WHERE id=$1', [orgId]);
    await client.query('COMMIT');
    res.json({ message: 'Organization deleted' });
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Delete failed' }); }
  finally { client.release(); }
});

module.exports = router;
