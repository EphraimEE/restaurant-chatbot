const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Session = require('../models/Session');
const Order = require('../models/Order');

// Helper: generate welcome options
function welcomeText() {
  return `Welcome!\nSelect 1 to Place an order\nSelect 99 to checkout order\nSelect 98 to see order history\nSelect 97 to see current order\nSelect 0 to cancel order`;
}

// create or get session
router.post('/session', async (req, res) => {
  let { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  let s = await Session.findOne({ sessionId });
  if (!s) s = await Session.create({ sessionId });

  return res.json({ sessionId: s.sessionId, message: welcomeText() });
});

// bot message endpoint: sends user's input and server responds
router.post('/message', async (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || typeof text === 'undefined') {
    return res.status(400).json({ error: 'sessionId and text required' });
  }
  const input = ('' + text).trim();

  // main commands
  if (input === '1') {
    const items = await MenuItem.find().sort({ code: 1 });
    const lines = items
      .map((i) => `${i.code}. ${i.name} — NGN ${i.price}`)
      .join('\n');
    return res.json({
      reply: `Menu:\n${lines}\nReply with the item code to add to cart.`,
    });
  }

  if (input === '99') {
    const order = await Order.findOne({ sessionId, status: 'pending' }).sort({
      createdAt: -1,
    });
    if (!order) return res.json({ reply: 'No order to place' });

    return res.json({
      reply: `Ready to checkout. Order total: NGN ${order.total}. Send POST /paystack/init with sessionId and orderId to initialize payment.`,
    });
  }

  if (input === '98') {
    const orders = await Order.find({
      sessionId,
      status: { $in: ['paid', 'cancelled', 'pending', 'scheduled'] },
    }).sort({ createdAt: -1 });

    if (!orders.length) return res.json({ reply: 'No order history' });

    const lines = orders
      .map((o) => `${o._id} — ${o.status} — NGN ${o.total}`)
      .join('\n');
    return res.json({ reply: `Order history:\n${lines}` });
  }

  if (input === '97') {
    const order = await Order.findOne({
      sessionId,
      status: { $in: ['pending', 'scheduled'] },
    }).sort({ createdAt: -1 });

    if (!order) return res.json({ reply: 'No current order' });

    const items = order.items.map((it) => `${it.name} x${it.qty}`).join(', ');
    return res.json({
      reply: `Current order: ${items} — NGN ${order.total}`,
    });
  }

  if (input === '0') {
    const order = await Order.findOne({
      sessionId,
      status: { $in: ['pending', 'scheduled'] },
    }).sort({ createdAt: -1 });

    if (!order) return res.json({ reply: 'No order to cancel' });

    order.status = 'cancelled';
    await order.save();
    return res.json({ reply: 'Order cancelled' });
  }

  // numeric input: try to add menu item to cart
  if (/^\d+$/.test(input)) {
    const code = parseInt(input, 10);
    const item = await MenuItem.findOne({ code });
    if (!item) {
      return res.json({ reply: 'Invalid selection. Please choose again.' });
    }

    // find or create current order
    let order = await Order.findOne({
      sessionId,
      status: 'pending',
    }).sort({ createdAt: -1 });

    if (!order) {
      order = await Order.create({
        sessionId,
        items: [],
        status: 'pending',
        total: 0,
      });
    }

    // update cart
    const existing = order.items.find((it) => it.code === item.code);
    if (existing) {
      existing.qty += 1;
    } else {
      order.items.push({
        code: item.code,
        name: item.name,
        qty: 1,
        price: item.price,
      });
    }

    // recalc total
    order.total = order.items.reduce((sum, it) => sum + it.qty * it.price, 0);
    await order.save();

    return res.json({
      reply: `${item.name} added to cart. Current total: NGN ${order.total}.`,
    });
  }

  // fallback
  return res.json({ reply: 'Invalid input. Please try again.' });
});

module.exports = router;