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
app.set('trust proxy', 1); // Required for Render to see correct user IPs
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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Limit each IP to 200 requests per 15 mins for API calls
  standardHeaders: true,
  legacyHeaders: false,
});
// Apply limiter only to API and Auth routes (not static files)
app.use('/auth', limiter);
app.use('/api', limiter);

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
  extensions: ['html'],
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
// Note: rateLimit applies to these routes via the 'limiter' middleware defined above
app.use('/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/site-content', siteContentRoutes);


// ── SPA Fallback ──────────────────────────────────────────
app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
app.get(/.*/, (req, res) => res.sendFile(path.join(publicDir, 'shop.html')));

// ── Error Handler (must be last) ──────────────────────────
app.use(errorHandler);

module.exports = app;
