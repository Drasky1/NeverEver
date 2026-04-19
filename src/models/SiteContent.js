const mongoose = require('mongoose');

const DEFAULT_CONTENT = {
  faqs: 'FAQS WILL BE UPDATED SOON.\n\nFOR ORDER QUESTIONS, CONTACT SUPPORT @tfuwnthuh.',
  policy: 'STORE POLICY WILL BE UPDATED SOON.\n\nPLEASE CONFIRM SIZE, COLOR, AND DELIVERY DETAILS BEFORE PLACING AN ORDER.',
};

const siteContentSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'footer' },
  faqs: { type: String, default: DEFAULT_CONTENT.faqs },
  policy: { type: String, default: DEFAULT_CONTENT.policy },
}, { timestamps: true });

const SiteContent = mongoose.model('SiteContent', siteContentSchema);

/**
 * Get or create the footer content document.
 */
async function getFooterContent() {
  const content = await SiteContent.findOneAndUpdate(
    { key: 'footer' },
    { $setOnInsert: { key: 'footer', ...DEFAULT_CONTENT } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    faqs: content.faqs || DEFAULT_CONTENT.faqs,
    policy: content.policy || DEFAULT_CONTENT.policy,
  };
}

module.exports = { SiteContent, getFooterContent, DEFAULT_CONTENT };
