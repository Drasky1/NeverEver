/**
 * Express app setup — middleware, routes, error handling.
 * Separated from server startup for testability.
 */
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const compression = require('compression');

const { CORS_ORIGINS } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const siteContentRoutes = require('./routes/siteContent');

const app = express();
const publicDir = path.join(__dirname, '..', 'public');

// ── Security ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "data:", "https://accounts.google.com", "https://upload-widget.cloudinary.com", "https://apis.google.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://upload-widget.cloudinary.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com", "https://*.gstatic.com"],
      connectSrc: ["'self'", "https://api.telegram.org", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      frameSrc: ["'self'", "https://upload-widget.cloudinary.com", "https://accounts.google.com", "https://apis.google.com"],
      frameAncestors: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
    },
  },
}));

// ── Rate Limiting ─────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// ── Compression ───────────────────────────────────────────
app.use(compression());

// ── Body Parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = CORS_ORIGINS
  ? CORS_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Static Files ──────────────────────────────────────────
app.use(express.static(publicDir, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // HTML files should not be cached aggressively
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// ── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── API Routes ────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/site-content', siteContentRoutes);

// ── Legacy route compatibility ────────────────────────────
// Keep old endpoints working so existing frontend doesn't break
app.get('/api/items', (req, res, next) => next()); // handled by itemRoutes
app.get('/api/my-orders', require('./middleware/auth').verifyToken, async (req, res) => {
  const Order = require('./models/Order');
  const userId = req.user.id;
  const username = req.user.username;
  const query = [{ userId }];
  if (username) query.push({ username });
  res.json(await Order.find({ $or: query }).sort({ createdAt: -1 }));
});
app.get('/api/users', require('./middleware/auth').verifyAdmin, async (req, res) => {
  const User = require('./models/User');
  const users = await User.find().sort({ createdAt: -1 }).select('username createdAt');
  res.json(users);
});

// Legacy endpoints that map to new routes
app.post('/api/add-item', require('./middleware/auth').verifyAdmin, (req, res) => {
  // Proxy to the new POST /api/items endpoint
  req.url = '/api/items';
  req.method = 'POST';
  app.handle(req, res);
});
app.put('/api/update-item-cat/:id', require('./middleware/auth').verifyAdmin, (req, res) => {
  req.url = `/api/items/${req.params.id}/category`;
  req.method = 'PUT';
  app.handle(req, res);
});
app.put('/api/update-item/:id', require('./middleware/auth').verifyAdmin, (req, res) => {
  req.url = `/api/items/${req.params.id}`;
  req.method = 'PUT';
  app.handle(req, res);
});
app.post('/api/submit-order', require('./middleware/auth').verifyToken, (req, res) => {
  req.url = '/api/orders';
  req.method = 'POST';
  app.handle(req, res);
});
app.put('/api/update-order/:id', require('./middleware/auth').verifyAdmin, (req, res) => {
  req.url = `/api/orders/${req.params.id}`;
  req.method = 'PUT';
  app.handle(req, res);
});
app.delete('/api/delete-item/:id', require('./middleware/auth').verifyAdmin, (req, res) => {
  req.url = `/api/items/${req.params.id}`;
  req.method = 'DELETE';
  app.handle(req, res);
});
app.delete('/api/delete-order/:id', require('./middleware/auth').verifyAdmin, (req, res) => {
  req.url = `/api/orders/${req.params.id}`;
  req.method = 'DELETE';
  app.handle(req, res);
});
app.post('/api/reset-password', require('./middleware/auth').verifyAdmin, (req, res) => {
  req.url = '/api/admin/reset-password';
  req.method = 'POST';
  app.handle(req, res);
});
app.get('/debug', require('./middleware/auth').verifyAdmin, (req, res) => {
  req.url = '/api/admin/debug';
  app.handle(req, res);
});
app.get('/debug-telegram', require('./middleware/auth').verifyAdmin, (req, res) => {
  req.url = '/api/admin/debug-telegram';
  app.handle(req, res);
});
app.get('/debug-user-orders', require('./middleware/auth').verifyToken, (req, res) => {
  req.url = '/api/admin/debug-user-orders';
  app.handle(req, res);
});

// ── SPA Fallback ──────────────────────────────────────────
app.get('/admin', (req, res) => res.redirect('/admin.html'));
app.get(/.*/, (req, res) => res.redirect('/shop.html'));

// ── Error Handler (must be last) ──────────────────────────
app.use(errorHandler);

module.exports = app;
