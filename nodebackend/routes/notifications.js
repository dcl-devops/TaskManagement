const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  res.json(result.rows);
});

router.get('/unread-count', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false',
    [req.user.id]
  );
  res.json({ count: parseInt(result.rows[0].count) });
});

router.patch('/:id/read', requireAuth, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Marked as read' });
});

router.patch('/read-all', requireAuth, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
  res.json({ message: 'All marked as read' });
});

module.exports = router;
