require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI', 'GOOGLE_CLIENT_ID', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'ADMIN_PASSWORD', 'JWT_SECRET'];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`❌ ${varName} environment variable is required`);
        process.exit(1);
    }
}

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "data:", "https://accounts.google.com", "https://cdn.tailwindcss.com", "https://upload-widget.cloudinary.com", "https://accounts.google.com", "https://apis.google.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://cdn.tailwindcss.com", "https://upload-widget.cloudinary.com", "https://apis.google.com", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com", "https://*.gstatic.com"],
      connectSrc: ["'self'", "https://api.telegram.org", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      frameSrc: ["'self'", "https://upload-widget.cloudinary.com", "https://accounts.google.com", "https://apis.google.com"],
      frameAncestors: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://accounts.google.com"],
    },
  },
}));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true
}));
app.use(express.static('public')); // ALL HTML/JS/CSS GOES IN 'public' FOLDER

const RATE = 125;

if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is required");
    process.exit(1);
}

const uriMatch = process.env.MONGODB_URI.match(/^[^:]+:\/\/[^/]+\/(.*)$/);
const uriDbName = uriMatch ? uriMatch[1].split('?')[0] : null;
const hasDbName = uriDbName && uriDbName.length > 0;
const dbOptions = {};
if (!hasDbName) {
    dbOptions.dbName = process.env.MONGODB_DB_NAME || 'NeverEver';
}

mongoose.connect(process.env.MONGODB_URI, dbOptions)
    .then(() => console.log("✅ DB CONNECTED"))
    .catch(err => {
        console.error("❌ DB ERROR:", err);
        process.exit(1);
    });

const Item = mongoose.model('Item', new mongoose.Schema({
    name: String, costTHB: Number, price: Number, quantity: { type: Number, default: 1 },
    images: [String], description: String, availableSizes: [String], availableColors: [String],
    category: { type: String, default: 'Instock' }
}));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true }, password: { type: String }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String, username: String, customerName: String, telegram: String, items: Array, totalMMK: Number,
    totalCostMMK: Number, profitMMK: Number,
    address: String, phone: String, paymentScreenshot: String,
    status: { type: String, default: 'Pending' },
    estArrival: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}));

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

app.get('/api/items', async (req, res) => res.json(await Item.find()));
app.get('/api/orders', verifyAdmin, async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));
app.get('/api/my-orders', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const username = req.user.username;
    const query = [{ userId }];
    if (username) query.push({ username });
    res.json(await Order.find({ $or: query }).sort({ createdAt: -1 }));
});
app.post('/api/add-item', verifyAdmin, [
  body('name').isLength({ min: 1 }).trim().escape(),
  body('costTHB').isNumeric(),
  body('priceMMK').optional().isNumeric(),
  body('quantity').isNumeric(),
  body('description').optional().trim().escape(),
  body('availableSizes').optional().isArray(),
  body('availableColors').optional().isArray(),
  body('images').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const calculatedPrice = req.body.priceMMK ? Number(req.body.priceMMK) : Number(req.body.costTHB) * RATE;
  const newItem = new Item({ ...req.body, price: calculatedPrice });
  await newItem.save();
  res.json({ success: true });
});

app.put('/api/update-item-cat/:id', verifyAdmin, async (req, res) => {
    await Item.findByIdAndUpdate(req.params.id, { category: req.body.category });
    res.json({ success: true });
});

app.put('/api/update-item/:id', verifyAdmin, async (req, res) => {
    let updateData = { ...req.body };
    if (req.body.priceMMK) {
        updateData.price = Number(req.body.priceMMK);
    } else if (req.body.costTHB) {
        updateData.price = Number(req.body.costTHB) * RATE;
    }
    await Item.findByIdAndUpdate(req.params.id, updateData);
    res.json({ success: true });
});

app.post('/api/submit-order', verifyToken, [
  body('customerName').isLength({ min: 1 }).trim().escape(),
  body('telegram').trim().escape(),
  body('phone').isLength({ min: 1 }).trim().escape(),
  body('address').isLength({ min: 1 }).trim().escape(),
  body('items').isArray({ min: 1 }),
  body('paymentScreenshot').isURL(),
  body('totalMMK').isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  let totalCostMMK = 0;
  try {
    for (const item of req.body.items) {
      const dbItem = await Item.findOne({ name: item.name });
      if (dbItem) { 
        totalCostMMK += (Number(dbItem.costTHB) * RATE) * item.qty; 
        
        dbItem.quantity = (dbItem.quantity || 0) - item.qty;
        if (dbItem.quantity <= 0) {
          dbItem.quantity = 0;
          if (dbItem.category === 'Instock') {
            dbItem.category = 'Sold Out';
          }
        }
        await dbItem.save();
      }
    }
  } catch (e) { console.error(e); }
  req.body.totalCostMMK = totalCostMMK;
  req.body.profitMMK = req.body.totalMMK - totalCostMMK;

  const order = new Order(req.body);
  await order.save();

  try {
    const itemList = order.items.map(i => `${i.name} (${i.size}) x${i.qty}`).join('\n- ');
    const tgLabel = order.telegram ? `\nTELEGRAM: @${order.telegram.replace('@', '')}` : '';
    const nameLabel = order.customerName || order.username;
    const message = `🚨 NEW ORDER\n\nUSER: ${nameLabel}${tgLabel}\nPHONE: ${order.phone}\nTOTAL: ${order.totalMMK.toLocaleString()} MMK\n\nITEMS:\n- ${itemList}\n\nADDRESS: ${order.address}`;
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      chat_id: process.env.TELEGRAM_CHAT_ID, photo: order.paymentScreenshot, caption: message
    });
  } catch (err) {
    console.error("Telegram error:", err.message);
    if (err.response) {
      console.error("Telegram response status:", err.response.status);
      console.error("Telegram response data:", err.response.data);
    }
  }
  res.json({ success: true });
});

app.get('/debug-telegram', async (req, res) => {
  try {
    const result = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
    const chatTest = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: 'DEBUG: Telegram notifications are configured correctly.'
    });
    res.json({ success: true, bot: result.data, chat: chatTest.data });
  } catch (err) {
    res.status(500).json({ error: 'Telegram debug failed', message: err.message, response: err.response?.data || null });
  }
});

app.put('/api/update-order/:id', verifyAdmin, async (req, res) => {
    await Order.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
});
app.delete('/api/delete-item/:id', verifyAdmin, async (req, res) => { await Item.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.delete('/api/delete-order/:id', verifyAdmin, async (req, res) => { await Order.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.post('/auth/google', async (req, res) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: req.body.token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        let user = await User.findOne({ username: payload.email });
        if (!user) {
            user = new User({ username: payload.email, password: '' });
            await user.save();
        }
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user._id, username: user.username } });
    } catch (e) { res.status(401).json({ error: "Google verification failed" }); }
});

app.post('/auth/login', [
  body('username').trim().escape(),
  body('password').isLength({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/auth/signup', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = new User({ username: req.body.username, password: hashed });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } catch (err) { res.status(400).json({ error: "Username taken" }); }
});

app.post('/auth/admin', [
  body('password').isLength({ min: 1 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  console.log('Admin login attempt:', req.body.password, 'expected:', process.env.ADMIN_PASSWORD);
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid admin password' });
  }
});

app.get('/debug', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  let admin = false;
  if (token) {
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      admin = verified.role === 'admin';
    } catch (err) {
      admin = false;
    }
  }

  const debugData = {
    status: 'ok',
    env: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      JWT_SECRET: !!process.env.JWT_SECRET,
    },
    dbState: mongoose.connection.readyState,
    dbHost: process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@')[1]?.split('/')[0] : null,
    dbName: process.env.MONGODB_URI ? process.env.MONGODB_URI.split('/').pop().split('?')[0] : null,
  };

  debugData.counts = {
    items: await Item.countDocuments(),
    orders: await Order.countDocuments(),
  };

  if (admin) {
    debugData.admin = true;
  }

  res.json(debugData);
});

// Route everything else to the main app (SPA behavior)
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));

app.listen(10000, () => console.log("✅ SERVER RUNNING ON PORT 10000"));