const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
sessionId: String,
items: [{ code: Number, name: String, price: Number, qty: { type: Number, default: 1 } }],
total: { type: Number, default: 0 },
status: { type: String, default: 'pending' }, // pending, paid, cancelled, scheduled
scheduledFor: Date,
createdAt: { type: Date, default: Date.now },
paystack: { reference: String, authorization_url: String }
});
module.exports = mongoose.model('Order', OrderSchema);