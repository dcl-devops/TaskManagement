const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

function cleanInt(v) { if (v === null || v === undefined || v === '' || v === 'null') return null; const n = parseInt(v); return isNaN(n) ? null : n; }

// GET /api/customers
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `SELECT c.*,
      (SELECT COUNT(DISTINCT p.id) FROM projects p WHERE p.customer_id = c.id) as project_count,
      (SELECT COUNT(DISTINCT m.id) FROM meetings m JOIN projects p2 ON p2.id = m.project_id WHERE p2.customer_id = c.id) as meeting_count,
      (SELECT COUNT(DISTINCT t.id) FROM tasks t LEFT JOIN meetings mt ON mt.id = t.meeting_id LEFT JOIN projects pt ON pt.id = COALESCE(t.project_id, mt.project_id) WHERE pt.customer_id = c.id) as task_count,
      u.name as created_by_name
      FROM customers c LEFT JOIN users u ON u.id = c.created_by
      WHERE c.org_id = $1`;
    const params = [req.user.org_id];
    let idx = 2;
    if (status) { query += ` AND c.status = $${idx++}`; params.push(status); }
    if (search) { query += ` AND (c.name ILIKE $${idx} OR c.customer_code ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    query += ` ORDER BY c.name ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// GET /api/customers/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as created_by_name FROM customers c LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1 AND c.org_id = $2`, [req.params.id, req.user.org_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
    const customer = result.rows[0];
    // Get projects under this customer
    const projects = await pool.query(
      `SELECT p.id, p.project_number, p.title, p.priority, p.status, p.owner_id, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id OR t.meeting_id IN (SELECT m.id FROM meetings m WHERE m.project_id = p.id)) as task_count,
        (SELECT COUNT(*) FROM meetings m WHERE m.project_id = p.id) as meeting_count
       FROM projects p LEFT JOIN users u ON u.id = p.owner_id WHERE p.customer_id = $1 ORDER BY p.created_at DESC`, [req.params.id]);
    customer.projects = projects.rows;
    // Get meetings under customer's projects
    const meetings = await pool.query(
      `SELECT m.id, m.meeting_number, m.title, m.meeting_date, m.status, p.title as project_title
       FROM meetings m JOIN projects p ON p.id = m.project_id WHERE p.customer_id = $1 ORDER BY m.meeting_date DESC`, [req.params.id]);
    customer.meetings = meetings.rows;
    // Get all tasks under customer's projects (direct + via meetings)
    const tasks = await pool.query(
      `SELECT t.id, t.task_number, t.title, t.priority, t.status, t.due_date, at2.name as assigned_to_name,
        p.title as project_title, m.title as meeting_title
       FROM tasks t
       LEFT JOIN users at2 ON at2.id = t.assigned_to
       LEFT JOIN meetings m ON m.id = t.meeting_id
       LEFT JOIN projects p ON p.id = COALESCE(t.project_id, m.project_id)
       WHERE p.customer_id = $1
       ORDER BY t.created_at DESC`, [req.params.id]);
    customer.tasks = tasks.rows;
    res.json(customer);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// POST /api/customers
router.post('/', requireAuth, async (req, res) => {
  const { customer_code, name, address, city, state, country, industry, contact_person, mobile, email, status } = req.body;
  if (!name) return res.status(400).json({ message: 'Customer name is required' });
  try {
    if (customer_code) {
      const exists = await pool.query('SELECT id FROM customers WHERE customer_code = $1 AND org_id = $2', [customer_code, req.user.org_id]);
      if (exists.rows.length > 0) return res.status(409).json({ message: 'Customer code already exists' });
    }
    const result = await pool.query(
      `INSERT INTO customers(org_id, customer_code, name, address, city, state, country, industry, contact_person, mobile, email, status, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user.org_id, customer_code||null, name, address||null, city||null, state||null, country||null, industry||null, contact_person||null, mobile||null, email||null, status||'active', req.user.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/customers/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { customer_code, name, address, city, state, country, industry, contact_person, mobile, email, status } = req.body;
  try {
    if (customer_code) {
      const exists = await pool.query('SELECT id FROM customers WHERE customer_code = $1 AND org_id = $2 AND id != $3', [customer_code, req.user.org_id, req.params.id]);
      if (exists.rows.length > 0) return res.status(409).json({ message: 'Customer code already exists' });
    }
    const result = await pool.query(
      `UPDATE customers SET customer_code=$1, name=$2, address=$3, city=$4, state=$5, country=$6, industry=$7, contact_person=$8, mobile=$9, email=$10, status=$11, updated_at=NOW()
       WHERE id=$12 AND org_id=$13 RETURNING *`,
      [customer_code||null, name, address||null, city||null, state||null, country||null, industry||null, contact_person||null, mobile||null, email||null, status, req.params.id, req.user.org_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/customers/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1 AND org_id = $2', [req.params.id, req.user.org_id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
