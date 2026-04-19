/**
 * Authentication routes: login, signup, Google OAuth, admin login, profile, password management.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');

const { JWT_SECRET, GOOGLE_CLIENT_ID, ADMIN_PASSWORD } = require('../config/env');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /auth/google — Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    let user = await User.findOne({ username: payload.email });
    if (!user) {
      user = new User({ username: payload.email, password: '' });
      await user.save();
    }
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } catch (e) {
    res.status(401).json({ error: 'Google verification failed' });
  }
});

// POST /auth/login — Email/password login
router.post('/login', [
  body('username').trim().escape(),
  body('password').isLength({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// POST /auth/signup — New user registration
router.post('/signup', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = new User({ username: req.body.username, password: hashed });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(400).json({ error: 'Username taken' });
  }
});

// POST /auth/admin — Admin login with env password
router.post('/admin', [
  body('password').isLength({ min: 1 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  // Never log passwords — compare securely
  if (req.body.password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin', id: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid admin password' });
  }
});

// GET /auth/me — Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  res.json({ success: true, user: { id: req.user.id, username: req.user.username } });
});

// POST /auth/change-password — User changes their own password
router.post('/change-password', verifyToken, [
  body('oldPassword').isLength({ min: 1 }),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(req.body.oldPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = router;
