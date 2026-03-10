const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, orgName, email, password, mobile } = req.body;
  if (!name || !orgName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const domain = email.split('@')[1];
    const publicDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
    if (!publicDomains.includes(domain)) {
      const orgExists = await client.query('SELECT id FROM organizations WHERE domain = $1', [domain]);
      if (orgExists.rows.length > 0) {
        return res.status(409).json({ message: 'Your organization already has an account. Please contact your administrator.' });
      }
    }
    const orgResult = await client.query(
      'INSERT INTO organizations(name, domain) VALUES($1, $2) RETURNING id',
      [orgName, publicDomains.includes(domain) ? null : domain]
    );
    const orgId = orgResult.rows[0].id;
    // Auto-create the first company with the organization name
    await client.query(
      'INSERT INTO companies(org_id, name) VALUES($1, $2) ON CONFLICT DO NOTHING',
      [orgId, orgName]
    );
    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users(org_id, name, email, password_hash, mobile, role, force_password_change)
       VALUES($1,$2,$3,$4,$5,'owner',false) RETURNING id, name, email, role, org_id`,
      [orgId, name, email, passwordHash, mobile || null]
    );
    await client.query('COMMIT');
    const user = userResult.rows[0];
    const token = jwt.sign({ id: user.id, org_id: user.org_id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, org_id: user.org_id } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const result = await pool.query(
      `SELECT u.*, o.name as org_name,
        d.name as department_name, l.name as location_name
       FROM users u
       LEFT JOIN organizations o ON o.id = u.org_id
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN locations l ON l.id = u.location_id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });
    const user = result.rows[0];
    if (user.status === 'inactive') return res.status(403).json({ message: 'Account is inactive. Contact administrator.' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign(
      { id: user.id, org_id: user.org_id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        org_id: user.org_id, org_name: user.org_name,
        department_name: user.department_name, location_name: user.location_name,
        force_password_change: user.force_password_change,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both fields required' });
  if (newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1, force_password_change = false, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.org_id, u.employee_code, u.mobile,
              u.force_password_change, u.avatar_url, u.department_id, u.location_id,
              u.company_id, u.designation_id, u.manager_id, u.status,
              o.name as org_name, d.name as department_name, l.name as location_name,
              m.name as manager_name
       FROM users u
       LEFT JOIN organizations o ON o.id = u.org_id
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN locations l ON l.id = u.location_id
       LEFT JOIN users m ON m.id = u.manager_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
