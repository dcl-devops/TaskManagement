const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

function cleanInt(v) { if (v === null || v === undefined || v === '' || v === 'null') return null; const n = parseInt(v); return isNaN(n) ? null : n; }

const MTG_SELECT = `SELECT m.*, 
  u.name as owner_name, l.name as location_name,
  cb.name as created_by_name, p.title as project_title,
  (SELECT COUNT(*) FROM tasks t WHERE t.meeting_id = m.id) as task_count,
  (SELECT COUNT(*) FROM tasks t WHERE t.meeting_id = m.id AND t.status IN ('resolved','closed')) as completed_tasks,
  (SELECT COUNT(*) FROM tasks t WHERE t.meeting_id = m.id AND t.status NOT IN ('resolved','closed')) as pending_tasks,
  (SELECT COUNT(*) FROM meeting_members mm WHERE mm.meeting_id = m.id) as member_count
  FROM meetings m
  LEFT JOIN users u ON u.id = m.owner_id
  LEFT JOIN locations l ON l.id = m.location_id
  LEFT JOIN users cb ON cb.id = m.created_by
  LEFT JOIN projects p ON p.id = m.project_id`;

router.get('/', requireAuth, async (req, res) => {
  const { status, search, project_id, customer_id } = req.query;
  const uid = req.user.id;
  const role = req.user.role;
  let visClause;
  if (role === 'owner' || role === 'admin') {
    visClause = `m.org_id = $1`;
  } else {
    visClause = `m.org_id = $1 AND (m.owner_id = $2 OR m.created_by = $2 OR m.id IN (SELECT mm2.meeting_id FROM meeting_members mm2 WHERE mm2.user_id = $2))`;
  }
  let query = MTG_SELECT + ` WHERE ` + visClause;
  const params = [req.user.org_id];
  let idx = 2;
  if (role !== 'owner' && role !== 'admin') { params.push(uid); idx = 3; }
  if (status) { query += ` AND m.status = $${idx++}`; params.push(status); }
  if (project_id) { query += ` AND m.project_id = $${idx++}`; params.push(project_id); }
  if (customer_id) { query += ` AND m.project_id IN (SELECT cp.id FROM projects cp WHERE cp.customer_id = $${idx++})`; params.push(customer_id); }
  if (search) { query += ` AND m.title ILIKE $${idx++}`; params.push(`%${search}%`); }
  query += ` ORDER BY m.meeting_date DESC`;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(MTG_SELECT + ` WHERE m.id = $1 AND m.org_id = $2`, [req.params.id, req.user.org_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Meeting not found' });
    const meeting = result.rows[0];
    const members = await pool.query(
      `SELECT mm.user_id, u.name, u.email, u.avatar_url FROM meeting_members mm JOIN users u ON u.id = mm.user_id WHERE mm.meeting_id = $1`,
      [req.params.id]
    );
    meeting.members = members.rows;
    res.json(meeting);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, owner_id, meeting_date, location_id, virtual_link, status, member_ids, project_id } = req.body;
  if (!title || !meeting_date) return res.status(400).json({ message: 'Title and date required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const countRes = await client.query('SELECT COUNT(*) FROM meetings WHERE org_id=$1', [req.user.org_id]);
    const meetNum = 'MTG-' + String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0');
    const result = await client.query(
      `INSERT INTO meetings(org_id, meeting_number, title, description, owner_id, meeting_date, location_id, virtual_link, status, created_by, project_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.org_id, meetNum, title, description||null, cleanInt(owner_id)||req.user.id, meeting_date, cleanInt(location_id), virtual_link||null, status||'open', req.user.id, cleanInt(project_id)]
    );
    const meeting = result.rows[0];
    if (member_ids && member_ids.length > 0) {
      for (const uid of member_ids) {
        await client.query('INSERT INTO meeting_members(meeting_id, user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [meeting.id, uid]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json(meeting);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally { client.release(); }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, description, owner_id, meeting_date, location_id, virtual_link, status, member_ids, project_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE meetings SET title=$1, description=$2, owner_id=$3, meeting_date=$4,
       location_id=$5, virtual_link=$6, status=$7, project_id=$8, updated_at=NOW()
       WHERE id=$9 AND org_id=$10 RETURNING *`,
      [title, description||null, cleanInt(owner_id), meeting_date, cleanInt(location_id), virtual_link||null, status, cleanInt(project_id), req.params.id, req.user.org_id]
    );
    if (member_ids !== undefined) {
      await client.query('DELETE FROM meeting_members WHERE meeting_id=$1', [req.params.id]);
      for (const uid of member_ids) {
        await client.query('INSERT INTO meeting_members(meeting_id, user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [req.params.id, uid]);
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
  await pool.query('DELETE FROM meetings WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
  res.json({ message: 'Deleted' });
});

// Updates
router.get('/:id/updates', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT mu.*, u.name as user_name, u.avatar_url FROM meeting_updates mu
     JOIN users u ON u.id = mu.user_id WHERE mu.meeting_id = $1 ORDER BY mu.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});
router.post('/:id/updates', requireAuth, async (req, res) => {
  const { remark } = req.body;
  if (!remark) return res.status(400).json({ message: 'Remark required' });
  const r = await pool.query(
    'INSERT INTO meeting_updates(meeting_id, user_id, remark) VALUES($1,$2,$3) RETURNING *',
    [req.params.id, req.user.id, remark]
  );
  res.status(201).json({ ...r.rows[0], user_name: req.user.name, avatar_url: req.user.avatar_url });
});

// MOM
router.get('/:id/mom', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT mm.*, u.name as user_name, u.avatar_url FROM meeting_mom mm
     JOIN users u ON u.id = mm.user_id WHERE mm.meeting_id = $1 ORDER BY mm.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});
router.post('/:id/mom', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'Content required' });
  const r = await pool.query(
    'INSERT INTO meeting_mom(meeting_id, user_id, content) VALUES($1,$2,$3) RETURNING *',
    [req.params.id, req.user.id, content]
  );
  res.status(201).json({ ...r.rows[0], user_name: req.user.name, avatar_url: req.user.avatar_url });
});

module.exports = router;
