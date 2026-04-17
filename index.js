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

const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, 
    grade: { type: String, default: 'Instock' }, 
    costTHB: Number,
    price: Number,
    images: [String], 
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

// API
app.get('/items', async (req, res) => res.json(await Item.find()));
app.post('/add-item', async (req, res) => {
    const { name, costTHB, images, grade, description, sizes } = req.body;
    const newItem = new Item({
        name, grade, costTHB: Number(costTHB),
        price: Number(costTHB) * RATE,
        images, description, availableSizes: sizes
    });
    await newItem.save();
    res.json({ success: true });
});
app.delete('/delete-item/:id', async (req, res) => { await Item.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// AUTH
app.post('/auth/signup', async (req, res) => {
    try {
        const hashed = await bcrypt.hash(req.body.password, 10);
        const user = new User({...req.body, password: hashed});
        await user.save();
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: "Exists" }); }
});

app.post('/auth/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ id: user._id }, JWT_SECRET);
        res.json({ token, user: { id: user._id, username: user.username, phone: user.phone, address: user.address } });
    } else { res.status(401).json({ error: "Invalid" }); }
});

// ROUTING
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.get('*', (req, res) => {
    // If asking for a file that doesn't exist or a route, send shop
    if (!req.path.startsWith('/items') && !req.path.startsWith('/auth')) {
        res.sendFile(path.join(__dirname, 'public', 'shop.html'));
    }
});

app.listen(10000, () => console.log(`🚀 NEVEREVER LIVE`));