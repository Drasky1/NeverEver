const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Use an environment variable for security
const dbURI = process.env.MONGODB_URI || 'mongodb+srv://Malcolm:Sa1Mon3LLA@cluster0.h2cafaa.mongodb.net/?appName=Cluster0';

mongoose.connect(dbURI)
  .then(() => console.log('🚀 NEVER EVER DB CONNECTED'))
  .catch((err) => console.log('❌ DB Connection Error:', err));

app.use(express.json());
app.use(express.static('public'));

const Student = mongoose.model('Student', new mongoose.Schema({
    name: { type: String, required: true },
    customerName: String,
    customerPhone: String,
    address: String,
    grade: { type: String, required: true },
    price: { type: Number, default: 0 }
}));

app.get('/students', async (req, res) => {
    try {
        const data = await Student.find();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

app.post('/add-student', async (req, res) => {
    try {
        const newEntry = new Student(req.body);
        await newEntry.save();
        res.status(201).json(newEntry);
    } catch (err) {
        res.status(400).json({ error: "Save failed" });
    }
});

app.delete('/delete-student/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ NeverEver Admin Live: http://localhost:${PORT}`);
});