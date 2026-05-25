const jwt = require('jsonwebtoken');
const { get } = require('../db');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = get('SELECT id, email, name, subscription_status, trial_end, scans_used, scans_limit FROM users WHERE id = ?', [decoded.userId]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireSubscription(req, res, next) {
  const now = new Date().toISOString();
  const trialActive = req.user.trial_end && new Date(req.user.trial_end) > new Date();
  const isSubscribed = req.user.subscription_status === 'active' || req.user.subscription_status === 'trialing';
  if (!isSubscribed && !trialActive) {
    return res.status(403).json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' });
  }
  next();
}

module.exports = { authenticate, requireSubscription };
