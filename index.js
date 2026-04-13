const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // We use this to send the Telegram message

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// --- TELEGRAM CONFIG ---
const TELE_TOKEN = '8680111413:AAEX2fGmxKYAd3z3MPjLeIFUR8QrcWkTvUQ';
const MY_CHAT_ID = '1923704168';

const sendTeleNotification = async (message) => {
    try {
        await axios.post(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
            chat_id: MY_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
    } catch (err) {
        console.error("Telegram notification failed", err);
    }
};

// --- MONGODB CONNECTION ---
mongoose.connect('your_mongodb_connection_string')
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log("MongoDB Error:", err));

const StudentSchema = new mongoose.Schema({
    name: String,
    grade: String, // Status: Pending, Preorder, Instock, Soldout
    price: Number,
    productImage: String,
    customerName: String,
    customerPhone: String,
    adminNote: String
});
const Student = mongoose.model('Student', StudentSchema);

// --- ROUTES ---

// 1. Get all items
app.get('/students', async (req, res) => {
    const data = await Student.find();
    res.json(data);
});

// 2. Add New Entry + Send Telegram Notification
app.post('/add-student', async (req, res) => {
    const newItem = new Student(req.body);
    await newItem.save();

    // Only notify if it's a customer request (Pending/Preorder)
    if (req.body.grade === 'Pending' || req.body.grade === 'Preorder') {
        const msg = `🚨 <b>New Order!</b>\n\n` +
                    `<b>Item:</b> ${req.body.name}\n` +
                    `<b>Customer:</b> ${req.body.customerName || 'Unknown'}\n` +
                    `<b>Contact:</b> ${req.body.customerPhone || 'No contact provided'}\n\n` +
                    `Check the Admin Dashboard to reply.`;
        sendTeleNotification(msg);
    }
    
    res.json(newItem);
});

// 3. Delete Entry
app.delete('/delete-student/:id', async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// --- CLEAN URL LOGIC ---
// This serves your .html files without the extension in the URL
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'public', `${page}.html`);
    
    res.sendFile(filePath, (err) => {
        if (err) {
            next(); // If file doesn't exist, go to 404/other routes
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));