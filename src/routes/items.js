/**
 * Item (product) routes: list, add, update, delete.
 */
const express = require('express');
const { body, validationResult } = require('express-validator');

const Item = require('../models/Item');
const { verifyAdmin, validateObjectId } = require('../middleware');
const { RATE } = require('../config/env');

const router = express.Router();

// GET /api/items — List all products (public)
router.get('/', async (req, res) => {
  res.json(await Item.find());
});

// POST /api/items — Add new product (admin)
router.post('/', verifyAdmin, [
  body('name').isLength({ min: 1 }).trim().escape(),
  body('costTHB').isNumeric(),
  body('priceMMK').optional().isNumeric(),
  body('quantity').isNumeric(),
  body('description').optional().trim().escape(),
  body('availableSizes').optional().isArray(),
  body('availableColors').optional().isArray(),
  body('images').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const calculatedPrice = req.body.priceMMK ? Number(req.body.priceMMK) : Number(req.body.costTHB) * RATE;
  const newItem = new Item({ ...req.body, price: calculatedPrice });
  await newItem.save();
  res.json({ success: true });
});

// PUT /api/items/:id — Update product (admin)
router.put('/:id', verifyAdmin, [validateObjectId('id')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  let updateData = { ...req.body };
  if (req.body.priceMMK) {
    updateData.price = Number(req.body.priceMMK);
  } else if (req.body.costTHB) {
    updateData.price = Number(req.body.costTHB) * RATE;
  }
  await Item.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
  res.json({ success: true });
});

// PUT /api/items/:id/category — Update product category only (admin)
router.put('/:id/category', verifyAdmin, [validateObjectId('id')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  await Item.findByIdAndUpdate(req.params.id, { category: req.body.category }, { returnDocument: 'after' });
  res.json({ success: true });
});

// DELETE /api/items/:id — Remove product (admin)
router.delete('/:id', verifyAdmin, [validateObjectId('id')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  await Item.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
