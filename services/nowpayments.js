const crypto = require('crypto');
const { get, run } = require('../db');

const API_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY;

async function createInvoice({ amount, orderId, userId, userEmail }) {
  const data = {
    price_amount: amount,
    price_currency: 'usd',
    order_id: orderId,
    order_description: 'StampSnap Premium Subscription - 1 month',
    ipn_callback_url: `${process.env.BASE_URL}/webhook/nowpayments`,
    success_url: `${process.env.BASE_URL}/dashboard.html`,
    cancel_url: `${process.env.BASE_URL}/pricing.html`,
    is_fixed_rate: true,
    is_fee_paid_by_user: true
  };

  const res = await fetch(`${API_URL}/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || result.msg || 'NowPayments invoice creation failed');
  }
  return result;
}

async function handlePaymentWebhook(rawBody, signature) {
  const expectedSig = crypto.createHmac('sha256', API_KEY).update(rawBody).digest('hex');
  if (signature !== expectedSig) {
    throw new Error('Invalid webhook signature');
  }

  const body = JSON.parse(rawBody);
  const { payment_status, order_id } = body;

  if (payment_status === 'finished') {
    const user = get('SELECT * FROM users WHERE nowpayments_id = ?', [order_id]);
    if (user) {
      run(`UPDATE users SET subscription_status = 'active', subscription_end = datetime('now', '+30 days'), scans_limit = 999999 WHERE id = ?`, [user.id]);
      console.log(`Subscription activated for user ${user.id} via order ${order_id}`);
    }
  }
}

module.exports = { createInvoice, handlePaymentWebhook };
