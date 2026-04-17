const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

const mongoURI = "mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ DB CONNECTED"))
    .catch(err => console.log("❌ DB ERROR:", err));

const Item = mongoose.model('Item', { 
    name: String, price: Number, costTHB: Number, images: Array, 
    category: String, availableSizes: Array, isSoldOut: Boolean,
    stock: Number // Added stock field
});

const Order = mongoose.model('Order', { 
    userId: String, username: String, items: Array, totalMMK: Number, 
    phone: String, tgUsername: String, address: String, 
    paymentScreenshot: String, status: String, estArrival: String, 
    createdAt: { type: Date, default: Date.now } 
});

app.get('/items', async (req, res) => res.json(await Item.find()));

app.post('/add-item', async (req, res) => {
    const data = req.body;
    data.price = Math.floor(Number(data.costTHB) * 1.5 * 125);
    data.stock = Number(data.stock) || 0; // Ensure stock is a number
    const item = new Item(data);
    await item.save();
    res.json(item);
});

app.post('/submit-order', async (req, res) => {
    const orderData = req.body;
    const order = new Order(orderData);
    await order.save();

    // AUTO-DECREMENT STOCK
    for (const orderItem of orderData.items) {
        await Item.findByIdAndUpdate(orderItem._id, { $inc: { stock: -1 } });
    }
    
    res.json(order);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if(username && password) {
        res.json({ success: true, user: { username, id: 'u_' + Date.now() } });
    } else {
        res.status(400).json({ success: false });
    }
});

app.get('/orders', async (req, res) => res.json(await Order.find().sort({createdAt: -1})));
app.get('/my-orders/:userId', async (req, res) => res.json(await Order.find({ userId: req.params.userId })));
app.put('/update-order/:id', async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, req.body)));
app.put('/update-item/:id', async (req, res) => res.json(await Item.findByIdAndUpdate(req.params.id, req.body)));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 SERVER LIVE ON ${PORT}`));