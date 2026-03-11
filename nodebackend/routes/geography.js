const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// ===== COUNTRIES =====
router.get('/countries', requireAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM countries';
    const params = [];
    if (search) { query += ' WHERE name ILIKE $1'; params.push(`%${search}%`); }
    query += ' ORDER BY name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/countries', requireAuth, async (req, res) => {
  const { name, code } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  try {
    const r = await pool.query('INSERT INTO countries(name, code) VALUES($1,$2) RETURNING *', [name, code || null]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Country already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/countries/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('UPDATE countries SET name=$1, code=$2 WHERE id=$3 RETURNING *', [req.body.name, req.body.code || null, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/countries/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM countries WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ===== STATES =====
router.get('/states', requireAuth, async (req, res) => {
  try {
    const { search, country_id } = req.query;
    let query = 'SELECT s.*, c.name as country_name FROM states s LEFT JOIN countries c ON c.id = s.country_id';
    const params = [];
    const conditions = [];
    let idx = 1;
    if (country_id) { conditions.push(`s.country_id = $${idx++}`); params.push(country_id); }
    if (search) { conditions.push(`s.name ILIKE $${idx++}`); params.push(`%${search}%`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY s.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/states', requireAuth, async (req, res) => {
  const { name, country_id } = req.body;
  if (!name || !country_id) return res.status(400).json({ message: 'Name and country required' });
  try {
    const r = await pool.query('INSERT INTO states(name, country_id) VALUES($1,$2) RETURNING *', [name, country_id]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'State already exists in this country' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/states/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('UPDATE states SET name=$1, country_id=$2 WHERE id=$3 RETURNING *', [req.body.name, req.body.country_id, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/states/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM states WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ===== CITIES =====
router.get('/cities', requireAuth, async (req, res) => {
  try {
    const { search, state_id, country_id } = req.query;
    let query = `SELECT ci.*, s.name as state_name, s.country_id, co.name as country_name 
                 FROM cities ci 
                 LEFT JOIN states s ON s.id = ci.state_id 
                 LEFT JOIN countries co ON co.id = s.country_id`;
    const params = [];
    const conditions = [];
    let idx = 1;
    if (state_id) { conditions.push(`ci.state_id = $${idx++}`); params.push(state_id); }
    if (country_id) { conditions.push(`s.country_id = $${idx++}`); params.push(country_id); }
    if (search) { conditions.push(`ci.name ILIKE $${idx++}`); params.push(`%${search}%`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY ci.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/cities', requireAuth, async (req, res) => {
  const { name, state_id } = req.body;
  if (!name || !state_id) return res.status(400).json({ message: 'Name and state required' });
  try {
    const r = await pool.query('INSERT INTO cities(name, state_id) VALUES($1,$2) RETURNING *', [name, state_id]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'City already exists in this state' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/cities/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('UPDATE cities SET name=$1, state_id=$2 WHERE id=$3 RETURNING *', [req.body.name, req.body.state_id, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/cities/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cities WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
