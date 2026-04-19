/**
 * Global error handling middleware.
 */

/**
 * Catch async errors in route handlers.
 * Wrap route handlers with this to avoid try/catch boilerplate.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler — must be registered last with app.use().
 */
const errorHandler = (err, req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS origin not allowed' });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }

  // Mongoose cast error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry', field: Object.keys(err.keyPattern)[0] });
  }

  // Default server error
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = { asyncHandler, errorHandler };
