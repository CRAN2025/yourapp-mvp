// functions/index.js  (CommonJS, Node 18+)
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');

admin.initializeApp();

/**
 * POST /createCheckout
 * body: { priceId: string, email?: string }
 * Returns: { url }
 */
exports.createCheckout = onRequest({ secrets: [STRIPE_SECRET_KEY], region: 'us-central1' }, (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.set('Allow', 'POST');
        return res.status(405).send('Method Not Allowed');
      }

      const { priceId, email } = req.body || {};
      if (!priceId) return res.status(400).json({ error: 'Missing priceId' });

      const origin =
        req.get('origin') ||
        (req.protocol && req.get('host') ? `${req.protocol}://${req.get('host')}` : '');

      const stripe = require('stripe')(STRIPE_SECRET_KEY.value());

      // Reuse an existing customer if we can find one by email (MVP-friendly)
      let customerId = null;
      if (email) {
        const found = await stripe.customers.list({ email, limit: 1 });
        if (found.data.length) customerId = found.data[0].id;
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        ...(customerId ? { customer: customerId } : email ? { customer_email: email } : {}),
        allow_promotion_codes: true,
        automatic_tax: { enabled: true },
        success_url: `${origin}/settings?billing=success`,
        cancel_url: `${origin}/upgrade?canceled=true`,
      });

      return res.json({ url: session.url });
    } catch (err) {
      console.error('createCheckout error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  });
});

/**
 * POST /createPortal
 * body: { email: string }
 * Returns: { url }
 */
exports.createPortal = onRequest({ secrets: [STRIPE_SECRET_KEY], region: 'us-central1' }, (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.set('Allow', 'POST');
        return res.status(405).send('Method Not Allowed');
      }

      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Missing email' });

      const origin =
        req.get('origin') ||
        (req.protocol && req.get('host') ? `${req.protocol}://${req.get('host')}` : '');

      const stripe = require('stripe')(STRIPE_SECRET_KEY.value());

      // Find the Stripe customer by email (good enough for MVP)
      const { data } = await stripe.customers.list({ email, limit: 1 });
      if (!data.length) return res.status(404).json({ error: 'No customer found for that email' });

      const portal = await stripe.billingPortal.sessions.create({
        customer: data[0].id,
        return_url: `${origin}/settings?billing=portal_return`,
      });

      return res.json({ url: portal.url });
    } catch (err) {
      console.error('createPortal error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  });
});
