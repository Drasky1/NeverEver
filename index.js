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

// --- STABLE DATABASE CONNECTION ---
// Using the long-form connection string to prevent Render timeout errors
const dbURI = 'mongodb://Malcolm:Sa1Mon3LLA@cluster0-shard-00-00.h2cafaa.mongodb.net:27017,cluster0-shard-00-01.h2cafaa.mongodb.net:27017,cluster0-shard-00-02.h2cafaa.mongodb.net:27017/NeverEver?ssl=true&replicaSet=atlas-h2cafaa-shard-0&authSource=admin&retryWrites=true&w=majority&connectTimeoutMS=30000';

mongoose.connect(dbURI)
  .then(() => console.log("✅ Render connected to MongoDB"))
  .catch(err => console.error("❌ Connection Error:", err.message));

const ItemSchema = new mongoose.Schema({
    name: String,
    grade: { type: String, default: 'Pending' }, 
    price: { type: Number, default: 0 },
    productImage: String,
    customerPhone: String,
    adminNote: { type: String, default: '' }
});
const Item = mongoose.model('Item', ItemSchema);

// --- ROUTES ---
app.get('/items', async (req, res) => { 
    try {
        const allItems = await Item.find().maxTimeMS(20000); // Give it extra time
        res.json(allItems); 
    } catch (err) { res.status(500).json({error: "Database Timeout"}); }
});

app.post('/add-item', async (req, res) => {
    const newItem = new Item(req.body);
    await newItem.save();
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

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));
app.get('/track', (req, res) => res.sendFile(path.join(__dirname, 'public', 'track.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));