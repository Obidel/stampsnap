const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, run } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/create-checkout', authenticate, (req, res) => {
  try {
    const alias = process.env.DONATIONALERTS_ALIAS;
    if (!alias || alias === 'your_donationalerts_alias') {
      return res.json({ demo: true, message: 'DonationAlerts not configured. Demo mode.', url: '/dashboard.html?demo=success' });
    }

    const code = `stamp-${uuidv4().split('-')[0]}`;
    run('UPDATE users SET donation_code = ? WHERE id = ?', [code, req.user.id]);

    const daUrl = `https://www.donationalerts.com/r/${alias}`;
    res.json({ url: daUrl, code, message: `Send $5.45 on DonationAlerts. Include code ${code} in the message to activate premium.` });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

router.post('/claim', authenticate, async (req, res) => {
  try {
    const code = req.body?.code;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.donation_code !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    run(`UPDATE users SET subscription_status = 'active', subscription_end = datetime('now', '+30 days'), scans_limit = 999999, donation_code = NULL WHERE id = ?`, [req.user.id]);
    res.json({ success: true, message: 'Premium activated!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate premium' });
  }
});

router.post('/cancel', authenticate, (req, res) => {
  try {
    run(`UPDATE users SET subscription_status = 'canceled', subscription_end = NULL, donation_code = NULL, scans_limit = 5 WHERE id = ?`, [req.user.id]);
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
