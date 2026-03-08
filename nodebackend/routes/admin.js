const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const adminOnly = [requireAuth, requireRole('owner', 'admin')];

// ===== USERS =====
router.get('/users', requireAuth, async (req, res) => {
  const { company_id, location_id, department_id, role, status, search } = req.query;
  let query = `SELECT u.id, u.employee_code, u.name, u.email, u.mobile, u.role, u.status,
    u.force_password_change, u.created_at, u.department_id, u.location_id, u.company_id,
    u.designation_id, u.manager_id,
    d.name as department_name, l.name as location_name,
    c.name as company_name, des.name as designation_name, m.name as manager_name
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN locations l ON l.id = u.location_id
    LEFT JOIN companies c ON c.id = u.company_id
    LEFT JOIN designations des ON des.id = u.designation_id
    LEFT JOIN users m ON m.id = u.manager_id
    WHERE u.org_id = $1`;
  const params = [req.user.org_id];
  let idx = 2;
  if (company_id) { query += ` AND u.company_id = $${idx++}`; params.push(company_id); }
  if (location_id) { query += ` AND u.location_id = $${idx++}`; params.push(location_id); }
  if (department_id) { query += ` AND u.department_id = $${idx++}`; params.push(department_id); }
  if (role) { query += ` AND u.role = $${idx++}`; params.push(role); }
  if (status) { query += ` AND u.status = $${idx++}`; params.push(status); }
  if (search) { query += ` AND (u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.employee_code ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
  query += ' ORDER BY u.name';
  try {
    const result = await pool.query(query, params);
    res.json({ users: result.rows, total: result.rows.length });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/users', adminOnly, async (req, res) => {
  const { employee_code, name, email, password, mobile, company_id, location_id, department_id, designation_id, manager_id, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password required' });
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(409).json({ message: 'Email already exists' });
    if (employee_code) {
      const codeExists = await pool.query('SELECT id FROM users WHERE employee_code = $1 AND org_id = $2', [employee_code, req.user.org_id]);
      if (codeExists.rows.length > 0) return res.status(409).json({ message: 'Employee code already exists' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users(org_id, employee_code, name, email, password_hash, mobile,
        company_id, location_id, department_id, designation_id, manager_id, role, force_password_change)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true) RETURNING id, name, email, role`,
      [req.user.org_id, employee_code||null, name, email, hash, mobile||null,
       company_id||null, location_id||null, department_id||null, designation_id||null, manager_id||null, role||'user']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.put('/users/:id', adminOnly, async (req, res) => {
  const { id } = req.params;
  const { employee_code, name, mobile, company_id, location_id, department_id, designation_id, manager_id, role, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET employee_code=$1, name=$2, mobile=$3, company_id=$4, location_id=$5,
       department_id=$6, designation_id=$7, manager_id=$8, role=$9, status=$10, updated_at=NOW()
       WHERE id=$11 AND org_id=$12 RETURNING id, name, email, role, status`,
      [employee_code||null, name, mobile||null, company_id||null, location_id||null,
       department_id||null, designation_id||null, manager_id||null, role, status, id, req.user.org_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/users/:id/reset-password', adminOnly, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  try {
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=$1, force_password_change=true, updated_at=NOW() WHERE id=$2 AND org_id=$3', [hash, req.params.id, req.user.org_id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ===== COMPANIES =====
router.get('/companies', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM companies WHERE org_id=$1 ORDER BY name', [req.user.org_id]);
  res.json(result.rows);
});
router.post('/companies', adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  try {
    const r = await pool.query('INSERT INTO companies(org_id, name) VALUES($1,$2) RETURNING *', [req.user.org_id, name]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Company already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/companies/:id', adminOnly, async (req, res) => {
  const r = await pool.query('UPDATE companies SET name=$1 WHERE id=$2 AND org_id=$3 RETURNING *', [req.body.name, req.params.id, req.user.org_id]);
  res.json(r.rows[0]);
});
router.delete('/companies/:id', adminOnly, async (req, res) => {
  await pool.query('DELETE FROM companies WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
  res.json({ message: 'Deleted' });
});

// ===== LOCATIONS =====
router.get('/locations', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM locations WHERE org_id=$1 ORDER BY name', [req.user.org_id]);
  res.json(result.rows);
});
router.post('/locations', adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  try {
    const r = await pool.query('INSERT INTO locations(org_id, name) VALUES($1,$2) RETURNING *', [req.user.org_id, name]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Location already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/locations/:id', adminOnly, async (req, res) => {
  const r = await pool.query('UPDATE locations SET name=$1 WHERE id=$2 AND org_id=$3 RETURNING *', [req.body.name, req.params.id, req.user.org_id]);
  res.json(r.rows[0]);
});
router.delete('/locations/:id', adminOnly, async (req, res) => {
  await pool.query('DELETE FROM locations WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
  res.json({ message: 'Deleted' });
});

// ===== DEPARTMENTS =====
router.get('/departments', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM departments WHERE org_id=$1 ORDER BY name', [req.user.org_id]);
  res.json(result.rows);
});
router.post('/departments', adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  try {
    const r = await pool.query('INSERT INTO departments(org_id, name) VALUES($1,$2) RETURNING *', [req.user.org_id, name]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Department already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/departments/:id', adminOnly, async (req, res) => {
  const r = await pool.query('UPDATE departments SET name=$1 WHERE id=$2 AND org_id=$3 RETURNING *', [req.body.name, req.params.id, req.user.org_id]);
  res.json(r.rows[0]);
});
router.delete('/departments/:id', adminOnly, async (req, res) => {
  await pool.query('DELETE FROM departments WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
  res.json({ message: 'Deleted' });
});

// ===== DESIGNATIONS =====
router.get('/designations', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM designations WHERE org_id=$1 ORDER BY name', [req.user.org_id]);
  res.json(result.rows);
});
router.post('/designations', adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  try {
    const r = await pool.query('INSERT INTO designations(org_id, name) VALUES($1,$2) RETURNING *', [req.user.org_id, name]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Designation already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/designations/:id', adminOnly, async (req, res) => {
  const r = await pool.query('UPDATE designations SET name=$1 WHERE id=$2 AND org_id=$3 RETURNING *', [req.body.name, req.params.id, req.user.org_id]);
  res.json(r.rows[0]);
});
router.delete('/designations/:id', adminOnly, async (req, res) => {
  await pool.query('DELETE FROM designations WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
