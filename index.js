const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = 'never-ever-secret-2026'; 
const TELE_TOKEN = '8680111413:AAEX2fGmxKYAd3z3MPjLeIFUR8QrcWkTvUQ';
const ADMIN_IDS = ['1923704168'];

const dbURI = 'mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority';
mongoose.connect(dbURI, { family: 4 }).then(() => console.log("✅ BUSINESS DB CONNECTED"));

// --- MODELS ---
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, grade: String, price: Number, productImage: String
}));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: String,
    address: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String,
    username: String,
    items: Array,
    totalMMK: Number,
    address: String,
    phone: String,
    paymentScreenshot: String,
    status: { type: String, default: 'Pending Verification' },
    createdAt: { type: Date, default: Date.now }
}));

// --- AUTH ---
app.post('/auth/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ ...req.body, password: hashedPassword });
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Username already taken" }); }
});

app.post('/auth/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).json({ error: "Wrong username/password" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { username: user.username, id: user._id, address: user.address, phone: user.phone } });
});

// --- ORDERS ---
app.post('/submit-order', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        
        const message = `💰 NEW ORDER: ${req.body.totalMMK} MMK\nFrom: ${req.body.username}\nPhone: ${req.body.phone}\nCheck Admin for screenshot!`;
        ADMIN_IDS.forEach(id => axios.post(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, { chat_id: id, text: message }));
        
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/items', async (req, res) => res.json(await Item.find()));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Store Live on ${PORT}`));