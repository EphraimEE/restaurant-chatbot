const mongoose = require('mongoose');
const SessionSchema = new mongoose.Schema({
sessionId: { type: String, required: true, unique: true },
createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Session', SessionSchema);