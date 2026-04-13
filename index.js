const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// --- CONFIGURATION ---
const TELE_TOKEN = '8680111413:AAEX2fGmxKYAd3z3MPjLeIFUR8QrcWkTvUQ';
const ADMIN_IDS = ['1923704168'];

const sendTeleNotification = async (message) => {
    try {
        const promises = ADMIN_IDS.map(id => 
            axios.post(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
                chat_id: id, text: message, parse_mode: 'HTML'
            })
        );
        await Promise.all(promises);
    } catch (err) { console.error("Telegram error", err); }
};

// --- DATABASE ---
mongoose.connect('mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority')
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log(err));

const ItemSchema = new mongoose.Schema({
    name: String,
    grade: { type: String, default: 'Pending' }, 
    price: { type: Number, default: 0 },
    productImage: String,
    customerPhone: String
});
const Item = mongoose.model('Item', ItemSchema);

// --- API ROUTES ---
app.get('/items', async (req, res) => { res.json(await Item.find()); });

app.post('/add-item', async (req, res) => {
    const newItem = new Item(req.body);
    await newItem.save();
    if (req.body.grade === 'Pending') {
        sendTeleNotification(`🚨 <b>New Request!</b>\nItem: ${req.body.name}\nFrom: ${req.body.customerPhone}`);
    }
    res.json(newItem);
});

app.put('/update-item/:id', async (req, res) => {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

app.delete('/delete-item/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// --- ROUTING FIX: HOME IS SHOP ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get('/track', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'track.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));