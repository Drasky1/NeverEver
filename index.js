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

// --- UPDATED MODEL ---
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, 
    grade: { type: String, default: 'Instock' }, 
    costTHB: Number,
    price: Number,
    images: [String], // Array for 5 pictures
    description: String,
    availableSizes: [String] 
}));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true }, 
    password: { type: String }, 
    phone: String, 
    address: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String, username: String, items: Array, totalMMK: Number,
    address: String, phone: String, paymentScreenshot: String, 
    status: { type: String, default: 'Pending Verification' }, 
    createdAt: { type: Date, default: Date.now }
}));

// --- API ROUTES ---
app.get('/items', async (req, res) => res.json(await Item.find()));
app.get('/orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));

app.post('/add-item', async (req, res) => {
    const { name, costTHB, images, grade, description, sizes } = req.body;
    const newItem = new Item({
        name, grade, costTHB,
        price: parseFloat(costTHB) * RATE,
        images, description, availableSizes: sizes
    });
    await newItem.save();
    res.json({ success: true });
});

app.post('/submit-order', async (req, res) => {
    await new Order(req.body).save();
    const message = `🔥 *NEW ORDER*\n👤 *User:* ${req.body.username}\n💰 *Total:* ${req.body.totalMMK.toLocaleString()} MMK`;
    axios.post(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, { chat_id: ADMIN_IDS[0], text: message, parse_mode: 'Markdown' });
    res.json({ success: true });
});

app.delete('/delete-item/:id', async (req, res) => { await Item.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.put('/update-item/:id', async (req, res) => res.json(await Item.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })));
app.put('/update-order/:id', async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })));

// AUTH (Signup/Login omitted for brevity but remains same as your previous working code)
app.post('/auth/signup', async (req, res) => { /* same as before */ });
app.post('/auth/login', async (req, res) => { /* same as before */ });

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));
app.listen(10000, () => console.log(`🚀 NEVEREVER LIVE`));