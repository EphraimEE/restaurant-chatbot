const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');

// initialize payment
router.post('/init', async (req, res) => {
  const { sessionId, orderId } = req.body;
  if (!sessionId || !orderId) {
    return res.status(400).json({ error: 'sessionId and orderId required' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const secret = process.env.PAYSTACK_SECRET;
  const url = `${process.env.PAYSTACK_BASE}/transaction/initialize`;

  const payload = {
    email: `${sessionId}@example.com`, // synthetic email since we don’t collect real emails
    amount: Math.round(order.total) * 100, // convert to kobo
    metadata: { orderId: order._id.toString(), sessionId }
  };

  try {
    const resp = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const data = resp.data;

    if (!data.status) {
      return res.status(500).json({ error: 'Paystack init failed' });
    }

    order.paystack = {
      reference: data.data.reference,
      authorization_url: data.data.authorization_url
    };
    await order.save();

    return res.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// verify payment
router.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  const secret = process.env.PAYSTACK_SECRET;

  try {
    const resp = await axios.get(
      `${process.env.PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );

    const data = resp.data;

    if (data.status && data.data.status === 'success') {
      const orderId = data.data.metadata.orderId;
      const order = await Order.findById(orderId);

      if (order) {
        order.status = 'paid';
        await order.save();
      }

      return res.json({ status: 'success', message: 'Payment verified' });
    } else {
      return res
        .status(400)
        .json({ status: 'failed', message: 'Payment not successful' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;