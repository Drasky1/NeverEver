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
// Add your friends' Chat IDs here separated by commas
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
// Using the cleaned password and database name 'NeverEver'
mongoose.connect('mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority')
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

// Get all items
app.get('/students', async (req, res) => {
    const data = await Student.find();
    res.json(data);
});

// Add New Entry (Admin or Customer)
app.post('/add-student', async (req, res) => {
    const newItem = new Student(req.body);
    await newItem.save();

    // Trigger notification for new customer requests
    if (req.body.grade === 'Pending' || req.body.grade === 'Preorder') {
        const msg = `🚨 <b>New Order Request!</b>\n\n` +
                    `<b>Item:</b> ${req.body.name}\n` +
                    `<b>Customer:</b> ${req.body.customerName || 'Unknown'}\n` +
                    `<b>Contact:</b> ${req.body.customerPhone || 'None'}\n` +
                    `<b>Photo:</b> ${req.body.productImage ? 'Attached' : 'No Photo'}\n\n` +
                    `Check dashboard to calculate price and reply!`;
        sendTeleNotification(msg);
    }
    res.json(newItem);
});

// Delete Entry
app.delete('/delete-student/:id', async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// --- CLEAN URL LOGIC ---
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'public', `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) next(); 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));