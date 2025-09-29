// checks for scheduled orders every minute and marks them ready (notifies via io)
const cron = require('node-cron');
const Order = require('../models/Order');


function startScheduler(io) {
cron.schedule('* * * * *', async () => {
const now = new Date();
const due = await Order.find({ status: 'scheduled', scheduledFor: { $lte: now } });
for (const ord of due) {
ord.status = 'pending';
await ord.save();
// notify session via socket
io.to(ord.sessionId).emit('botMessage', `Your scheduled order (ID: ${ord._id}) is ready to checkout. Select 99 to pay.`);
}
});
}
module.exports = { startScheduler };