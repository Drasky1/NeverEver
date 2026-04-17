const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB CONNECTED"))
    .catch(err => console.log("❌ DB ERROR:", err));

const Item = mongoose.model('Item', { name: String, price: Number, costTHB: Number, images: Array, category: String, availableSizes: Array, isSoldOut: Boolean });
const Order = mongoose.model('Order', { userId: String, username: String, items: Array, totalMMK: Number, phone: String, tgUsername: String, address: String, paymentScreenshot: String, status: String, estArrival: String, createdAt: { type: Date, default: Date.now } });

// --- ROUTES ---
app.get('/items', async (req, res) => res.json(await Item.find()));
app.post('/add-item', async (req, res) => {
    const item = new Item(req.body);
    item.price = Math.floor(Number(req.body.costTHB) * 1.5 * 125); // Auto-price logic
    await item.save();
    res.json(item);
});
app.put('/update-item/:id', async (req, res) => res.json(await Item.findByIdAndUpdate(req.params.id, req.body)));

app.get('/orders', async (req, res) => res.json(await Order.find().sort({createdAt: -1})));
app.post('/submit-order', async (req, res) => res.json(await new Order(req.body).save()));
app.put('/update-order/:id', async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, req.body)));

// FIXED: Added manual login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if(username && password) {
        res.json({ success: true, user: { username, id: Date.now() } });
    } else {
        res.status(400).json({ success: false });
    }
});

app.get('/my-orders/:userId', async (req, res) => {
    res.json(await Order.find({ userId: req.params.userId }));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 SERVER LIVE ON ${PORT}`));