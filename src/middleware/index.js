/**
 * Central export for all middleware.
 */
const { verifyToken, verifyAdmin } = require('./auth');
const { validateObjectId } = require('./validate');
const { asyncHandler, errorHandler } = require('./errorHandler');

module.exports = { verifyToken, verifyAdmin, validateObjectId, asyncHandler, errorHandler };
