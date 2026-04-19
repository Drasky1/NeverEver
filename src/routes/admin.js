/**
 * Admin-only routes: users, site content, debug, password resets.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const { SiteContent, getFooterContent } = require('../models/SiteContent');
const { verifyAdmin } = require('../middleware/auth');
const { sendDebugPing } = require('../services/telegram');

const router = express.Router();

// GET /api/admin/users — List all users
router.get('/users', verifyAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select('username createdAt');
  res.json(users);
});

// POST /api/admin/reset-password — Reset a customer's password
router.post('/reset-password', verifyAdmin, [
  body('username').isLength({ min: 1 }).trim().escape(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.json({ success: true, message: 'Customer password updated' });
});

// GET /api/admin/debug — System debug info
router.get('/debug', verifyAdmin, async (req, res) => {
  res.json({
    status: 'ok',
    env: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      JWT_SECRET: !!process.env.JWT_SECRET,
    },
    dbState: mongoose.connection.readyState,
    counts: {
      items: await Item.countDocuments(),
      orders: await Order.countDocuments(),
    },
    admin: true,
  });
});

// GET /api/admin/debug-telegram — Test Telegram integration
router.get('/debug-telegram', verifyAdmin, async (req, res) => {
  try {
    const result = await sendDebugPing();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({
      error: 'Telegram debug failed',
      message: err.message,
      response: err.response?.data || null,
    });
  }
});

// GET /api/admin/debug-user-orders — Debug a user's orders
router.get('/debug-user-orders', verifyAdmin, async (req, res) => {
  // Require a userId or username query param for admin debugging
  const { userId, username } = req.query;
  if (!userId && !username) {
    return res.status(400).json({ error: 'Provide userId or username query param' });
  }
  const query = [];
  if (userId) query.push({ userId });
  if (username) query.push({ username });
  const orders = await Order.find({ $or: query }).sort({ createdAt: -1 });
  res.json({
    query,
    ordersCount: orders.length,
    orders: orders.map((o) => ({
      id: o._id,
      userId: o.userId,
      username: o.username,
      customerName: o.customerName,
      totalMMK: o.totalMMK,
      status: o.status,
      createdAt: o.createdAt,
    })),
  });
});

module.exports = router;
