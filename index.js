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

// --- MODELS ---
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

// --- API ROUTES ---
app.get('/items', async (req, res) => res.json(await Item.find()));
app.get('/orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));

app.post('/add-item', async (req, res) => {
    try {
        const { name, costTHB, images, grade, description, sizes } = req.body;
        const newItem = new Item({
            name, grade, costTHB,
            price: parseFloat(costTHB) * RATE,
            images, description, availableSizes: sizes
        });
        await newItem.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

app.post('/submit-order', async (req, res) => {
    try {
        await new Order(req.body).save();
        const message = `🔥 *NEW ORDER*\n👤 *User:* ${req.body.username}\n💰 *Total:* ${req.body.totalMMK.toLocaleString()} MMK`;
        axios.post(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, { chat_id: ADMIN_IDS[0], text: message, parse_mode: 'Markdown' });
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// --- AUTH ROUTES ---
app.post('/auth/signup', async (req, res) => {
    try {
        const { username, password, phone, address } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashed, phone, address });
        await user.save();
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: "Username already exists" }); }
});

app.post('/auth/signup', async (req, res) => {
    try {
        const { username, password, phone, address } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashed, phone, address });
        await user.save();
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: "Username already exists" }); }
});

app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id }, JWT_SECRET);
        res.json({ token, user: { id: user._id, username: user.username, phone: user.phone, address: user.address } });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

// --- THE ULTIMATE FAILSAFE CATCH-ALL ---
// This does NOT use path-to-regexp, so it CANNOT throw that error.
app.use((req, res, next) => {
    // If it's a GET request and not an API call, send the HTML
    if (req.method === 'GET' && !req.path.startsWith('/auth') && !req.path.startsWith('/items')) {
        return res.sendFile(path.join(__dirname, 'public', 'shop.html'));
    }
    next();
});

app.listen(10000, () => console.log(`🚀 NEVEREVER LIVE`));