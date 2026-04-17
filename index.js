const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Your direct connection string - no dotenv needed
const mongoURI = "mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/NeverEver?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ DB CONNECTED"))
    .catch(err => console.log("❌ DB ERROR:", err));

const Item = mongoose.model('Item', { 
    name: String, price: Number, costTHB: Number, images: Array, 
    category: String, availableSizes: Array, isSoldOut: Boolean,
    stock: { type: Number, default: 0 } // Added Stock field
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
    data.stock = Number(data.stock) || 0;
    const item = new Item(data);
    await item.save();
    res.json(item);
});

app.post('/submit-order', async (req, res) => {
    const order = new Order(req.body);
    await order.save();
    
    // AUTO-SUBTRACT STOCK
    for (const item of req.body.items) {
        await Item.findByIdAndUpdate(item._id, { $inc: { stock: -1 } });
    }
    res.json(order);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if(username && password) {
        res.json({ success: true, user: { username, id: 'u' + Date.now() } });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/orders', async (req, res) => res.json(await Order.find().sort({createdAt: -1})));
app.get('/my-orders/:userId', async (req, res) => res.json(await Order.find({ userId: req.params.userId })));
app.put('/update-order/:id', async (req, res) => res.json(await Order.findByIdAndUpdate(req.params.id, req.body)));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 SERVER LIVE ON ${PORT}`));