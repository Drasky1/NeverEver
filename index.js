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

const JWT_SECRET = 'never-ever-2026-secure-key'; 
const TELE_TOKEN = '8680111413:AAEX2fGmxKYAd3z3MPjLeIFUR8QrcWkTvUQ';
const ADMIN_IDS = ['1923704168'];

const dbURI = 'mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority';
mongoose.connect(dbURI, { family: 4 }).then(() => console.log("✅ DB CONNECTED"));

// --- MODELS ---
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, grade: { type: String, default: 'Instock' }, price: Number, productImage: String, customerPhone: { type: String, default: 'Admin' }
}));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true }, password: { type: String }, phone: String, address: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String, username: String, items: Array, totalMMK: Number, address: String, phone: String, paymentScreenshot: String, status: { type: String, default: 'Pending Verification' }, createdAt: { type: Date, default: Date.now }
}));

// --- AUTH ---
app.post('/auth/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ ...req.body, password: hashedPassword });
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Username taken" }); }
});

app.post('/auth/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ error: "Invalid" });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { username: user.username, id: user._id, address: user.address, phone: user.phone } });
});

// --- SHOP DATA ---
app.get('/items', async (req, res) => res.json(await Item.find()));
app.get('/all-orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));
app.get('/my-orders/:userId', async (req, res) => res.json(await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 })));

app.post('/submit-order', async (req, res) => {
    const order = new Order(req.body);
    await order.save();
    const msg = `💰 NEW ORDER: ${req.body.totalMMK.toLocaleString()} MMK\nFrom: ${req.body.username}\nPhone: ${req.body.phone}`;
    ADMIN_IDS.forEach(id => axios.post(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, { chat_id: id, text: msg }));
    res.json({ success: true });
});

// --- ADMIN CONTROLS ---
app.post('/add-item', async (req, res) => { res.json(await new Item(req.body).save()); });
app.delete('/delete-item/:id', async (req, res) => { await Item.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.put('/update-item/:id', async (req, res) => {
    const up = await Item.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(up);
});

app.put('/update-order/:id', async (req, res) => {
    const up = await Order.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(up);
});

// --- ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/track', (req, res) => res.sendFile(path.join(__dirname, 'public', 'track.html')));

app.listen(10000, () => console.log("🚀 SERVER RUNNING ON 10000"));