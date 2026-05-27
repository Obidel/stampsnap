require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();

const nowpayments = require('./services/nowpayments');

app.post('/webhook/nowpayments', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-nowpayments-sig'];
    await nowpayments.handlePaymentWebhook(req.body.toString(), signature);
    res.json({ received: true });
  } catch (err) {
    console.error('NowPayments webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authRoutes = require('./routes/auth');
const stampRoutes = require('./routes/stamps');
const subscriptionRoutes = require('./routes/subscription');

app.use('/api/auth', authRoutes);
app.use('/api/stamps', stampRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`StampSnap server running on http://localhost:${PORT}`);
  });
}

start();
