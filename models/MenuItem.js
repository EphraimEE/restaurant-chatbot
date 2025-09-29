const mongoose = require('mongoose');
const MenuItemSchema = new mongoose.Schema({
code: { type: Number, required: true, unique: true },
name: String,
price: Number,
options: [String]
});
module.exports = mongoose.model('MenuItem', MenuItemSchema);