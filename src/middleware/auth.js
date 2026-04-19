/**
 * JWT authentication middleware.
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Verify user JWT token — attaches `req.user`.
 */
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Verify admin JWT token — attaches `req.admin`.
 */
const verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (verified.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken, verifyAdmin };
