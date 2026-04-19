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
