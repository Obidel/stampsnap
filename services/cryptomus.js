const crypto = require('crypto');
const { get, run } = require('../db');

const API_URL = 'https://api.cryptomus.com/v1';
const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID;
const API_KEY = process.env.CRYPTOMUS_API_KEY;

function generateSign(rawBody) {
  const base64 = Buffer.from(rawBody).toString('base64');
  return crypto.createHash('md5').update(base64 + API_KEY).digest('hex');
}

async function createPayment({ amount, orderId, userId, userEmail }) {
  const data = {
    amount: amount.toString(),
    currency: 'USD',
    order_id: orderId,
    url_return: `${process.env.BASE_URL}/pricing.html`,
    url_success: `${process.env.BASE_URL}/dashboard.html`,
    url_callback: `${process.env.BASE_URL}/webhook/cryptomus`,
    is_payment_multiple: false,
    to_currency: 'USD',
    email: userEmail
  };

  const json = JSON.stringify(data);
  const sign = generateSign(json);

  const res = await fetch(`${API_URL}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      merchant: MERCHANT_ID,
      sign
    },
    body: json
  });

  const result = await res.json();
  if (result.state !== 0) {
    throw new Error(result.message || 'Cryptomus payment creation failed');
  }
  return result.result;
}

async function handlePaymentWebhook(rawBody, sign) {
  const expectedSign = generateSign(rawBody);
  if (sign !== expectedSign) {
    throw new Error('Invalid webhook signature');
  }

  const body = JSON.parse(rawBody);
  const { order_id, status } = body;

  if (status === 'paid' || status === 'paid_over') {
    const user = get('SELECT * FROM users WHERE cryptomus_order_id = ?', [order_id]);
    if (user) {
      run(`UPDATE users SET subscription_status = 'active', subscription_end = datetime('now', '+30 days'), scans_limit = 999999 WHERE id = ?`, [user.id]);
      console.log(`Subscription activated for user ${user.id} via order ${order_id}`);
    }
  } else if (status === 'cancel' || status === 'wrong_amount') {
    run(`UPDATE users SET subscription_status = 'canceled', cryptomus_order_id = NULL WHERE cryptomus_order_id = ?`, [order_id]);
    console.log(`Subscription cancelled for order ${order_id}`);
  }
}

module.exports = { createPayment, handlePaymentWebhook };
