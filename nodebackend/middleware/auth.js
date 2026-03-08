const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_secret_key_2024';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    pool.query('SELECT id, name, email, role, org_id, avatar_url FROM users WHERE id = $1', [decoded.id])
      .then(result => {
        if (result.rows.length === 0) return res.status(401).json({ message: 'User not found' });
        req.user = result.rows[0];
        next();
      })
      .catch(() => res.status(500).json({ message: 'Auth error' }));
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

async function getVisibleUserIds(userId, orgId, role) {
  if (role === 'owner' || role === 'admin') {
    const result = await pool.query('SELECT id FROM users WHERE org_id = $1 AND status = $2', [orgId, 'active']);
    return result.rows.map(r => r.id);
  }
  if (role === 'manager') {
    const teamResult = await pool.query(
      'SELECT id FROM users WHERE (manager_id = $1 OR id = $1) AND org_id = $2',
      [userId, orgId]
    );
    return teamResult.rows.map(r => r.id);
  }
  return [userId];
}

module.exports = { requireAuth, requireRole, getVisibleUserIds, JWT_SECRET };
