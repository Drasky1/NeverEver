/**
 * Database connection setup.
 */
const mongoose = require('mongoose');
const { MONGODB_URI, MONGODB_DB_NAME } = require('./env');

async function connectDB() {
  const uriMatch = MONGODB_URI.match(/^[^:]+:\/\/[^/]+\/(.*)$/);
  const uriDbName = uriMatch ? uriMatch[1].split('?')[0] : null;
  const hasDbName = uriDbName && uriDbName.length > 0;

  const dbOptions = {};
  if (!hasDbName) {
    dbOptions.dbName = MONGODB_DB_NAME;
  }

  try {
    await mongoose.connect(MONGODB_URI, dbOptions);
    console.log('✅ DB CONNECTED');
  } catch (err) {
    console.error('❌ DB ERROR:', err);
    process.exit(1);
  }
}

module.exports = { connectDB };
