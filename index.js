const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. MIDDLEWARE
app.use(express.json());

// 2. STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// 3. DATABASE CONNECTION (Using the stable Shard link for hotspots)
const mongoURI = process.env.MONGO_URI || "mongodb://Malcolm:Sa1Mon3LLA@cluster0-shard-00-00.h2cafaa.mongodb.net:27017,cluster0-shard-00-01.h2cafaa.mongodb.net:27017,cluster0-shard-00-02.h2cafaa.mongodb.net:27017/NeverEverDB?ssl=true&replicaSet=atlas-h2cafaa-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 15000 // Give the hotspot more time to connect
})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch(err => {
    console.log("❌ CONNECTION ERROR:", err.message);
    console.log("NOTE: If this fails locally, it's because your hotspot is blocking Port 27017.");
});

// 4. DATA SCHEMA
const studentSchema = new mongoose.Schema({
    name: String,
    grade: String, 
    price: Number,
    customerName: String,
    customerPhone: String,
    address: String,
    date: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// 5. API ROUTES
app.get('/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ date: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/add-student', async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        res.status(201).send("Entry Added");
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.delete('/delete-student/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.send("Entry Deleted");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 6. CATCH-ALL ROUTE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 7. START SERVER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 NeverEver Server running on port ${PORT}`);
});