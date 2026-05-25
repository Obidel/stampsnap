const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { get, run } = require('../db');

async function createCheckoutSession(user, priceId) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 3,
      metadata: { user_id: user.id }
    },
    success_url: `${process.env.BASE_URL}/app.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing.html`
  });
  return session;
}

async function createPortalSession(customerId) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.BASE_URL}/dashboard.html`
  });
  return session;
}

async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.user_id;
      if (userId) {
        run(`UPDATE users SET stripe_customer_id = ?, stripe_subscription_id = ?, subscription_status = 'trialing' WHERE id = ?`,
          [session.customer, session.subscription, userId]);
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const subscription = event.data.object;
      const status = subscription.status;
      const dbStatus = status === 'active' ? 'active' : status === 'trialing' ? 'trialing' : status === 'past_due' ? 'past_due' : 'canceled';
      run('UPDATE users SET subscription_status = ?, stripe_subscription_id = ? WHERE stripe_customer_id = ?',
        [dbStatus, subscription.id, subscription.customer]);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      run('UPDATE users SET subscription_status = ?, stripe_subscription_id = NULL WHERE stripe_customer_id = ?',
        ['canceled', subscription.customer]);
      break;
    }
  }
}

module.exports = { createCheckoutSession, createPortalSession, handleWebhookEvent };
