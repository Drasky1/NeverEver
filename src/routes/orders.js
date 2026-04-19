/**
 * Order routes: submit, list, update, delete.
 */
const express = require('express');
const { body, validationResult } = require('express-validator');

const Item = require('../models/Item');
const Order = require('../models/Order');
const { verifyToken, verifyAdmin, validateObjectId } = require('../middleware');
const { sendOrderNotification } = require('../services/telegram');
const { RATE } = require('../config/env');

const router = express.Router();

// GET /api/orders — List all orders (admin)
router.get('/', verifyAdmin, async (req, res) => {
  res.json(await Order.find().sort({ createdAt: -1 }));
});

// GET /api/orders/mine — List current user's orders
router.get('/mine', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const username = req.user.username;
  const query = [{ userId }];
  if (username) query.push({ username });
  res.json(await Order.find({ $or: query }).sort({ createdAt: -1 }));
});

// POST /api/orders — Submit a new order
router.post('/', verifyToken, [
  body('customerName').isLength({ min: 1 }).trim().escape(),
  body('telegram').trim().escape(),
  body('phone').isLength({ min: 1 }).trim().escape(),
  body('address').isLength({ min: 1 }).trim().escape(),
  body('items').isArray({ min: 1 }),
  body('paymentScreenshot').isURL(),
  body('totalMMK').isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  req.body.userId = req.user.id;
  req.body.username = req.user.username;

  // Calculate cost and update stock
  let totalCostMMK = 0;
  try {
    for (const item of req.body.items) {
      const dbItem = await Item.findOne({ name: item.name });
      if (dbItem) {
        totalCostMMK += (Number(dbItem.costTHB) * RATE) * item.qty;

        dbItem.quantity = (dbItem.quantity || 0) - item.qty;
        if (dbItem.quantity <= 0) {
          dbItem.quantity = 0;
          if (dbItem.category === 'Instock') {
            dbItem.category = 'Sold Out';
          }
        }
        await dbItem.save();
      }
    }
  } catch (e) {
    console.error('Order item update error:', e);
  }

  req.body.totalCostMMK = totalCostMMK;
  req.body.profitMMK = req.body.totalMMK - totalCostMMK;

  const order = new Order(req.body);
  await order.save();
  console.log('Order saved', order._id.toString());

  // Send Telegram notification (non-blocking)
  await sendOrderNotification(order);

  res.json({ success: true, orderId: order._id.toString() });
});

// PUT /api/orders/:id — Update order status (admin)
router.put('/:id', verifyAdmin, [validateObjectId('id')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  await Order.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

// DELETE /api/orders/:id — Delete order (admin)
router.delete('/:id', verifyAdmin, [validateObjectId('id')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  await Order.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
