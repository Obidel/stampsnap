const { get, run } = require('../db');

const DONATION_AMOUNT = 5.45;
const WEBHOOK_SECRET = process.env.DONATIONALERTS_WEBHOOK_SECRET;

async function handleWebhook(rawBody, querySecret) {
  if (querySecret !== WEBHOOK_SECRET) {
    throw new Error('Invalid webhook secret');
  }

  const body = JSON.parse(rawBody);
  const { amount_main, currency, message } = body;

  if (amount_main >= DONATION_AMOUNT && currency === 'USD') {
    const match = message?.match(/stamp-(\w+)/);
    if (match) {
      const code = match[0];
      const user = get('SELECT * FROM users WHERE donation_code = ?', [code]);
      if (user) {
        run(`UPDATE users SET subscription_status = 'active', subscription_end = datetime('now', '+30 days'), scans_limit = 999999, donation_code = NULL WHERE id = ?`, [user.id]);
        console.log(`Subscription activated for user ${user.id} via donation code ${code}`);
        return { activated: true, userId: user.id };
      }
    }
  }
  return { activated: false };
}

module.exports = { handleWebhook, DONATION_AMOUNT };
