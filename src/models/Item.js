const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: String,
  costTHB: Number,
  price: Number,
  quantity: { type: Number, default: 1 },
  images: [String],
  description: String,
  availableSizes: [String],
  availableColors: [String],
  category: { type: String, default: 'Instock' },
});

module.exports = mongoose.model('Item', itemSchema);
