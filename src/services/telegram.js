/**
 * Telegram notification service.
 */
const axios = require('axios');
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = require('../config/env');

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Send an order notification with the payment screenshot to Telegram.
 */
async function sendOrderNotification(order) {
  const itemList = order.items.map((i) => `${i.name} (${i.size}) x${i.qty}`).join('\n- ');
  const tgLabel = order.telegram ? `\nTELEGRAM: @${order.telegram.replace('@', '')}` : '';
  const nameLabel = order.customerName || order.username;
  const message = `🚨 NEW ORDER\n\nUSER: ${nameLabel}${tgLabel}\nPHONE: ${order.phone}\nTOTAL: ${order.totalMMK.toLocaleString()} MMK\n\nITEMS:\n- ${itemList}\n\nADDRESS: ${order.address}`;

  try {
    await axios.post(`${TELEGRAM_API}/sendPhoto`, {
      chat_id: TELEGRAM_CHAT_ID,
      photo: order.paymentScreenshot,
      caption: message,
    });
  } catch (err) {
    console.error('Telegram error:', err.message);
    if (err.response) {
      console.error('Telegram response status:', err.response.status);
      console.error('Telegram response data:', err.response.data);
    }
    // Don't throw — Telegram failure shouldn't block the order
  }
}

/**
 * Send a debug ping to verify the bot is configured correctly.
 */
async function sendDebugPing() {
  const botInfo = await axios.get(`${TELEGRAM_API}/getMe`);
  const chatTest = await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: 'DEBUG: Telegram notifications are configured correctly.',
  });
  return { bot: botInfo.data, chat: chatTest.data };
}

module.exports = { sendOrderNotification, sendDebugPing };
