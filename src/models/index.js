/**
 * Central export for all Mongoose models.
 */
const Item = require('./Item');
const User = require('./User');
const Order = require('./Order');
const { SiteContent, getFooterContent, DEFAULT_CONTENT } = require('./SiteContent');

module.exports = { Item, User, Order, SiteContent, getFooterContent, DEFAULT_CONTENT };
