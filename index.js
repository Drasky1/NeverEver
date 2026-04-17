const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(express.static('public'));

const RATE = 125; 
const TELEGRAM_BOT_TOKEN = '8680111413:AAEX2fGmxKYAd3z3MPjLeIFUR8QrcWkTvUQ'; 
const TELEGRAM_CHAT_ID = '1923704168';

mongoose.connect('mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority');

const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, costTHB: Number, price: Number,
    images: [String], description: String, availableSizes: [String],
    category: { type: String, default: 'Instock' }, 
    isSoldOut: { type: Boolean, default: false }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String, username: String, items: Array, totalMMK: Number,
    address: String, phone: String, paymentScreenshot: String, 
    status: { type: String, default: 'Pending' }, 
    estArrival: { type: String, default: '' }, 
    createdAt: { type: Date, default: Date.now }
}));

// ROUTES TO PREVENT "CANNOT GET"
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// API
app.get('/items', async (req, res) => res.json(await Item.find()));
app.get('/orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));
app.get('/my-orders/:userId', async (req, res) => res.json(await Order.find({ userId: req.params.userId })));

app.post('/add-item', async (req, res) => {
    const newItem = new Item({...req.body, price: Number(req.body.costTHB) * RATE});
    await newItem.save();
    res.json({ success: true });
});

app.post('/submit-order', async (req, res) => {
    const order = new Order(req.body);
    await order.save();
    try {
        const itemList = order.items.map(i => `${i.name} (${i.size}) x${i.qty}`).join('\n- ');
        const message = `🚨 NEW ORDER: ${order.username}\n📞 ${order.phone}\n📍 ${order.address}\nTOTAL: ${order.totalMMK.toLocaleString()} MMK\nITEMS:\n- ${itemList}`;
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            chat_id: TELEGRAM_CHAT_ID, photo: order.paymentScreenshot, caption: message
        });
    } catch (e) { console.error("Telegram error"); }
    res.json({ success: true });
});

app.put('/update-order/:id', async (req, res) => {
    await Order.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
});

app.put('/update-item/:id', async (req, res) => {
    await Item.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
});

app.listen(10000);