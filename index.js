const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = 'never-ever-2026-secure-key-999'; 
const TELE_TOKEN = '8680111413:AAEX2fGmxKYAd3z3MPjLeIFUR8QrcWkTvUQ';
const ADMIN_IDS = ['1923704168'];
const RATE = 125; 

mongoose.connect('mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority')
    .then(() => console.log("✅ DB CONNECTED"))
    .catch(err => console.error("❌ DB ERROR:", err));

// MODELS
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, grade: String, costTHB: Number, price: Number,
    images: [String], description: String, availableSizes: [String],
    isSoldOut: { type: Boolean, default: false }
}));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true }, password: { type: String }, phone: String, address: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String, username: String, items: Array, totalMMK: Number,
    address: String, phone: String, paymentScreenshot: String, 
    status: { type: String, default: 'Pending' }, 
    estArrival: String, // e.g., "3-5 Days"
    createdAt: { type: Date, default: Date.now }
}));

// API ROUTES
app.get('/items', async (req, res) => res.json(await Item.find()));
app.get('/orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));
app.get('/my-orders/:userId', async (req, res) => res.json(await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 })));

app.post('/add-item', async (req, res) => {
    const newItem = new Item({...req.body, price: Number(req.body.costTHB) * RATE});
    await newItem.save();
    res.json({ success: true });
});

app.post('/submit-order', async (req, res) => {
    const order = new Order({...req.body, estArrival: "Calculating..."});
    await order.save();
    res.json({ success: true });
});

app.put('/update-order/:id', async (req, res) => {
    await Order.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
});

app.delete('/delete-item/:id', async (req, res) => { await Item.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// FAILSAFE ROUTING
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.includes('.')) res.sendFile(path.join(__dirname, 'public', 'shop.html'));
    else next();
});

app.listen(10000, () => console.log(`🚀 NEVEREVER LIVE`));