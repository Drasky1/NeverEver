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
const ADMIN_IDS = ['1923704168']; // Add your friends' IDs here

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

    if (req.body.grade === 'Pending' || req.body.grade === 'Preorder') {
        const msg = `🚨 <b>New Order Request!</b>\n\n` +
                    `<b>Item:</b> ${req.body.name}\n` +
                    `<b>Customer:</b> ${req.body.customerName || 'Unknown'}\n` +
                    `<b>Contact:</b> ${req.body.customerPhone || 'None'}\n\n` +
                    `Check /admin to view the photo and quote!`;
        sendTeleNotification(msg);
    }
    res.json(newItem);
});

app.delete('/delete-student/:id', async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// --- CLEAN URL HANDLER ---
app.get('/:page', (req, res, next) => {
    const pageName = req.params.page;
    const filePath = path.join(__dirname, 'public', `${pageName}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));