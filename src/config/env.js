/**
 * Environment configuration — validates required env vars at startup.
 */
require('dotenv').config();

const requiredEnvVars = [
  'MONGODB_URI',
  'GOOGLE_CLIENT_ID',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'ADMIN_PASSWORD',
  'JWT_SECRET',
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ ${varName} environment variable is required`);
    process.exit(1);
  }
}

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'NeverEver',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',
  PORT: process.env.PORT || 10000,
  RATE: 125, // THB → MMK conversion rate
};
