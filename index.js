const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. MIDDLEWARE
app.use(express.json());

// THIS IS THE CRITICAL LINE: 
// It tells the server to look for index.html inside the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// 2. DATABASE CONNECTION (Using your existing MongoDB setup)
// Replace 'YOUR_MONGODB_URI' with your actual connection string if not using environment variables
const mongoURI = process.env.MONGO_URI || 'YOUR_MONGODB_URI'; 

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// 3. DATA SCHEMA (Based on your ledger fields)
const studentSchema = new mongoose.Schema({
    name: String,
    grade: String, // This stores 'Preorder', 'Instock', or 'Soldout'
    price: Number,
    customerName: String,
    customerPhone: String,
    address: String,
    date: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// 4. API ROUTES
// Get all entries
app.get('/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ date: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Add new entry
app.post('/add-student', async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        res.status(201).send("Entry Added");
    } catch (err) {
        res.status(400).send(err);
    }
});

// Delete an entry
app.delete('/delete-student/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.send("Entry Deleted");
    } catch (err) {
        res.status(500).send(err);
    }
});

// 5. CATCH-ALL ROUTE
// Ensures that visiting the base URL '/' always loads the dashboard
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. START SERVER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 NeverEver Server running on port ${PORT}`);
});