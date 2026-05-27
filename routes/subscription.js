const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, run } = require('../db');
const { authenticate } = require('../middleware/auth');
const nowpayments = require('../services/nowpayments');

const router = express.Router();

router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey || apiKey === 'your_nowpayments_api_key') {
      return res.json({ demo: true, message: 'NowPayments not configured. In demo mode, subscription would be created.', url: '/dashboard.html?demo=success' });
    }

    const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const orderId = `stampsnap_sub_${uuidv4()}`;

    run('UPDATE users SET nowpayments_id = ? WHERE id = ?', [orderId, user.id]);

    const invoice = await nowpayments.createInvoice({
      amount: 5.45,
      orderId,
      userId: user.id,
      userEmail: user.email
    });

    res.json({ url: invoice.invoice_url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/cancel', authenticate, (req, res) => {
  try {
    run(`UPDATE users SET subscription_status = 'canceled', subscription_end = NULL, nowpayments_id = NULL, scans_limit = 5 WHERE id = ?`, [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

router.get('/status', authenticate, (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);

  let status = user.subscription_status;
  if (status === 'active' && user.subscription_end) {
    if (new Date(user.subscription_end) < new Date()) {
      run('UPDATE users SET subscription_status = ?, scans_limit = 5 WHERE id = ?', ['expired', user.id]);
      status = 'expired';
    }
  }

  const trialActive = user.trial_end && new Date(user.trial_end) > new Date();
  const isActive = status === 'active' || status === 'trialing' || trialActive;
  const trialDaysLeft = trialActive ? Math.ceil((new Date(user.trial_end) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  res.json({
    status,
    trial_end: user.trial_end,
    subscription_end: user.subscription_end,
    trial_active: trialActive,
    trial_days_left: trialDaysLeft,
    is_active: isActive,
    scans_used: user.scans_used,
    scans_limit: user.scans_limit
  });
});

module.exports = router;
