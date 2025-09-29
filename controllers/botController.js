const MenuItem = require('../models/MenuItem');
const Session = require('../models/Session');
const Order = require('../models/Order');

function welcomeText() {
  return `Welcome!\nSelect 1 to Place an order\nSelect 99 to checkout order\nSelect 98 to see order history\nSelect 97 to see current order\nSelect 0 to cancel order`;
}

exports.createOrGetSession = async (req, res) => {
  let { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  let s = await Session.findOne({ sessionId });
  if (!s) s = await Session.create({ sessionId });
  return res.json({ sessionId: s.sessionId, message: welcomeText() });
};

exports.handleMessage = async (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || typeof text === 'undefined')
    return res.status(400).json({ error: 'sessionId and text required' });

  const input = ('' + text).trim();

  // Option 1: Show menu
  if (input === '1') {
    const items = await MenuItem.find().sort({ code: 1 });
    const lines = items.map(i => `${i.code}. ${i.name} — NGN ${i.price}`).join('\n');
    return res.json({ reply: `Menu:\n${lines}\nReply with the item code to add to cart.` });
  }

  // Option 99: Checkout
  if (input === '99') {
    const order = await Order.findOne({ sessionId, status: 'pending' }).sort({ createdAt: -1 });
    if (!order) return res.json({ reply: 'No order to place' });
  
    return res.json({
      reply: `Ready to checkout. Order total: NGN ${order.total}`,
      orderId: order._id.toString()
    });
  }

  // Option 98: Order history
  if (input === '98') {
    const orders = await Order.find({ sessionId }).sort({ createdAt: -1 });
    if (!orders.length) return res.json({ reply: 'No order history' });
    const lines = orders.map(o => `${o._id} — ${o.status} — NGN ${o.total}`).join('\n');
    return res.json({ reply: `Order history:\n${lines}` });
  }

  // Option 97: Current order
  if (input === '97') {
    const order = await Order.findOne({ sessionId, status: { $in: ['pending', 'scheduled'] } }).sort({ createdAt: -1 });
    if (!order) return res.json({ reply: 'No current order' });
    const items = order.items.map(it => `${it.name} x${it.qty}`).join(', ');
    return res.json({ reply: `Current order: ${items} — NGN ${order.total}` });
  }

  // Option 0: Cancel order
  if (input === '0') {
    const order = await Order.findOne({ sessionId, status: { $in: ['pending', 'scheduled'] } }).sort({ createdAt: -1 });
    if (!order) return res.json({ reply: 'No order to cancel' });
    order.status = 'cancelled';
    await order.save();
    return res.json({ reply: 'Order cancelled' });
  }

  // Else: numeric = add item to cart
  // numeric selection -> try add menu item
if (!isNaN(input)) {
  const code = parseInt(input, 10);
  const item = await MenuItem.findOne({ code });
  if (!item) {
    return res.json({ reply: 'Invalid selection. Please choose from the menu.' });
  }

  // find or create a pending order
  let order = await Order.findOne({ sessionId, status: 'pending' }).sort({ createdAt: -1 });
  if (!order) {
    order = await Order.create({
      sessionId,
      items: [],
      total: 0,
      status: 'pending'
    });
  }

  // check if item already in order
  const existing = order.items.find(it => it.code === code);
  if (existing) {
    existing.qty += 1;
  } else {
    order.items.push({ code: item.code, name: item.name, price: item.price, qty: 1 });
  }

  // recalc total
  order.total = order.items.reduce((sum, it) => sum + it.price * it.qty, 0);
  await order.save();

  const items = order.items.map(it => `${it.name} x${it.qty}`).join(', ');
  return res.json({ reply: `Added ${item.name}. Current order: ${items} — NGN ${order.total}` });
}

  return res.json({ reply: welcomeText() });
};