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

const JWT_SECRET = 'never-ever-2026-secure-key-999'; 
const TELE_TOKEN = '8680111413:AAEX2fGmxKYAd3z3MPjLeIFUR8QrcWkTvUQ';
const ADMIN_IDS = ['1923704168'];

mongoose.connect('mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority', { family: 4 })
    .then(() => console.log("✅ SYSTEM ONLINE"));

const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, 
    category: { type: String, default: 'General' },
    grade: { type: String, default: 'Instock' }, 
    price: Number, 
    productImage: String, 
    customerPhone: { type: String, default: 'Admin' }
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

// AUTH
app.post('/auth/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await new User({ ...req.body, password: hashedPassword }).save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "User exists" }); }
});

app.post('/auth/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ error: "Invalid" });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { username: user.username, id: user._id, address: user.address, phone: user.phone } });
});

// GETTERS
app.get('/items', async (req, res) => res.json(await Item.find()));
app.get('/all-orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));
app.get('/my-orders/:userId', async (req, res) => res.json(await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 })));

// ORDERING
app.post('/submit-order', async (req, res) => {
    await new Order(req.body).save();
    axios.post(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, { 
        chat_id: ADMIN_IDS[0], text: `📦 NEW ORDER: ${req.body.username} - ${req.body.totalMMK} MMK` 
    });
    res.json({ success: true });
});

// ADMIN
app.post('/add-item', async (req, res) => res.json(await new Item(req.body).save()));
app.delete('/delete-item/:id', async (req, res) => { await Item.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.put('/update-item/:id', async (req, res) => res.json(await Item.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.put('/update-order/:id', async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, req.body, { new: true })));

app.get('*', (req, res) => {
    const p = req.path === '/' ? 'shop.html' : req.path.split('/')[1] + '.html';
    res.sendFile(path.join(__dirname, 'public', p));
});

app.listen(10000);