<<<<<<< HEAD
/**
 * NeverEver Online Shop — Server Entry Point
 *
 * This file only connects to the database and starts the HTTP server.
 * All Express setup lives in src/app.js for testability.
 */
const { connectDB } = require('./src/config/database');
const { PORT } = require('./src/config/env');
const app = require('./src/app');

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ SERVER RUNNING ON PORT ${PORT}`);
  });
}

start();
=======
const express = require('express'); // Import the Express tool
const app = express(); // Create the app
const PORT = 3000; // The "address" on your laptop

// This is a "Mock Database" (just a simple list for now)
const students = [
    { id: 1, name: "Thant Zin", grade: "A" },
    { id: 2, name: "Somsak", grade: "B" },
    { id: 3, name: "Ananda", grade: "A-" }
];

// This is a "Route". When you go to /students, this runs.
app.get('/students', (req, res) => {
    res.json(students); // Send the list of students as JSON
});

// This starts the server
app.listen(PORT, () => {
    console.log(`LedgerEdu Server is running at http://localhost:${PORT}/students`);
});

// Route to get a SINGLE student by ID
app.get('/student/:id', (req, res) => {
    const studentId = parseInt(req.params.id); // Get the ID from the URL
    const student = students.find(s => s.id === studentId); // Find the matching student

    if (student) {
        res.json(student); // If found, show the student
    } else {
        res.status(404).send('Student not found! Check the ID.'); // If not found, show error
    }
});

// This starts the server
app.listen(PORT, () => {
    console.log(`LedgerEdu Server is running at http://localhost:${PORT}/students`);
});
>>>>>>> 15fb314 (Initial commit for LedgerEdu)
