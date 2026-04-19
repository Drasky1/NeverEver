/**
 * Site content routes: FAQs and policy (public read, admin write).
 */
const express = require('express');
const { body, validationResult } = require('express-validator');

const { SiteContent, getFooterContent } = require('../models/SiteContent');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/site-content — Public: read footer content
router.get('/', async (req, res) => {
  res.json(await getFooterContent());
});

// PUT /api/site-content — Admin: update footer content
router.put('/', verifyAdmin, [
  body('faqs').optional().isString().trim().isLength({ max: 5000 }),
  body('policy').optional().isString().trim().isLength({ max: 5000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const updated = await SiteContent.findOneAndUpdate(
    { key: 'footer' },
    {
      $set: { faqs: req.body.faqs || '', policy: req.body.policy || '' },
      $setOnInsert: { key: 'footer' },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  ).lean();

  res.json({
    success: true,
    content: { faqs: updated.faqs || '', policy: updated.policy || '' },
  });
});

module.exports = router;
