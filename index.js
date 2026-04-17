const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public')); // ALL HTML/JS/CSS GOES IN 'public' FOLDER

const RATE = 125; 
const TELEGRAM_BOT_TOKEN = '8680111413:AAGQrF3NzoJ7oQduth5dSp5c-3Uo9fBHN0o'; 
const TELEGRAM_CHAT_ID = '1923704168';

mongoose.connect('mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority')
    .then(() => console.log("✅ DB CONNECTED"))
    .catch(err => console.error("❌ DB ERROR:", err));

const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, costTHB: Number, price: Number,
    images: [String], description: String, availableSizes: [String],
    category: { type: String, default: 'Instock' }
}));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true }, password: { type: String }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String, username: String, items: Array, totalMMK: Number,
    address: String, phone: String, paymentScreenshot: String, 
    status: { type: String, default: 'Pending' }, 
    estArrival: { type: String, default: '' }, 
    createdAt: { type: Date, default: Date.now }
}));

app.get('/api/items', async (req, res) => res.json(await Item.find()));
app.get('/api/orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));
app.get('/api/my-orders/:userId', async (req, res) => res.json(await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 })));

app.post('/api/add-item', async (req, res) => {
    const newItem = new Item({...req.body, price: Number(req.body.costTHB) * RATE});
    await newItem.save();
    res.json({ success: true });
});

app.post('/api/submit-order', async (req, res) => {
    const order = new Order(req.body);
    await order.save();

    try {
        const itemList = order.items.map(i => `${i.name} (${i.size}) x${i.qty}`).join('\n- ');
        const message = `🚨 NEW ORDER\n\nUSER: ${order.username}\nPHONE: ${order.phone}\nTOTAL: ${order.totalMMK.toLocaleString()} MMK\n\nITEMS:\n- ${itemList}\n\nADDRESS: ${order.address}`;
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            chat_id: TELEGRAM_CHAT_ID, photo: order.paymentScreenshot, caption: message
        });
    } catch (err) { console.error("Telegram error:", err.message); }
    res.json({ success: true });
});

app.put('/api/update-order/:id', async (req, res) => {
    await Order.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
});
app.delete('/api/delete-item/:id', async (req, res) => { await Item.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.delete('/api/delete-order/:id', async (req, res) => { await Order.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.post('/auth/signup', async (req, res) => {
    try {
        const hashed = await bcrypt.hash(req.body.password, 10);
        const user = new User({username: req.body.username, password: hashed});
        await user.save();
        res.json({ success: true, user: { id: user._id, username: user.username } });
    } catch (err) { res.status(400).json({ error: "Username taken" }); }
});

app.post('/auth/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        res.json({ success: true, user: { id: user._id, username: user.username } });
    } else { res.status(401).json({ error: "Invalid credentials" }); }
});

// Route everything else to the main app (SPA behavior)
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(10000, () => console.log("✅ SERVER RUNNING ON PORT 10000"));