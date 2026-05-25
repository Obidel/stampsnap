const express = require('express');
const { get } = require('../db');
const { authenticate } = require('../middleware/auth');
const { createCheckoutSession, createPortalSession } = require('../services/stripe');

const router = express.Router();

router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId || priceId === 'price_placeholder') {
      return res.json({ demo: true, message: 'Stripe not configured. In demo mode, subscription would be created.', url: '/pricing.html?demo=success' });
    }
    const session = await createCheckoutSession(req.user, priceId);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/portal', authenticate, async (req, res) => {
  try {
    const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    const session = await createPortalSession(user.stripe_customer_id);
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

router.get('/status', authenticate, (req, res) => {
  const user = get('SELECT subscription_status, trial_end, scans_used, scans_limit FROM users WHERE id = ?', [req.user.id]);
  const trialActive = user.trial_end && new Date(user.trial_end) > new Date();
  const isActive = user.subscription_status === 'active' || user.subscription_status === 'trialing' || trialActive;
  const trialDaysLeft = trialActive ? Math.ceil((new Date(user.trial_end) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  res.json({
    status: user.subscription_status,
    trial_end: user.trial_end,
    trial_active: trialActive,
    trial_days_left: trialDaysLeft,
    is_active: isActive,
    scans_used: user.scans_used,
    scans_limit: user.scans_limit
  });
});

module.exports = router;
