/**
 * Validation helpers for express-validator.
 */
const { param } = require('express-validator');

/**
 * Validate that a route param is a valid MongoDB ObjectId.
 */
const validateObjectId = (paramName) =>
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`);

module.exports = { validateObjectId };
