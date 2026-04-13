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
                chat_id: id,
                text: message,
                parse_mode: 'HTML'
            })
        );
        await Promise.all(promises);
    } catch (err) {
        console.error("Telegram notification failed", err);
    }
};

// --- MONGODB CONNECTION ---
mongoose.connect('mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority')
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log("MongoDB Error:", err));

const StudentSchema = new mongoose.Schema({
    name: String,
    grade: String, 
    price: Number,
    productImage: String,
    customerName: String,
    customerPhone: String,
    adminNote: String
});
const Student = mongoose.model('Student', StudentSchema);

// --- ROUTES ---
app.get('/students', async (req, res) => {
    const data = await Student.find();
    res.json(data);
});

app.post('/add-student', async (req, res) => {
    const newItem = new Student(req.body);
    await newItem.save();
    if (req.body.grade === 'Pending') {
        const msg = `🚨 <b>New Order!</b>\n<b>Item:</b> ${req.body.name}\n<b>From:</b> ${req.body.customerPhone}`;
        sendTeleNotification(msg);
    }
    res.json(newItem);
});

// Added PUT route so you can actually save price updates from Admin
app.put('/update-student/:id', async (req, res) => {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

app.delete('/delete-student/:id', async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// --- ROUTING: SHOP IS HOME ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get('/:page', (req, res) => {
    const filePath = path.join(__dirname, 'public', `${req.params.page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) res.sendFile(path.join(__dirname, 'public', 'shop.html'));
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));