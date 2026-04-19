const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: String,
  username: String,
  customerName: String,
  telegram: String,
  items: Array,
  totalMMK: Number,
  totalCostMMK: Number,
  profitMMK: Number,
  address: String,
  phone: String,
  paymentScreenshot: String,
  status: { type: String, default: 'Pending' },
  estArrival: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
