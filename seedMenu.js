const mongoose = require('mongoose');
require('dotenv').config();
const MenuItem = require('./models/MenuItem');

const items = [
  { code: 1, name: 'Jollof Rice', price: 1500 },
  { code: 2, name: 'Fried Rice', price: 1600 },
  { code: 3, name: 'Chicken', price: 2000 },
  { code: 4, name: 'Beef Suya', price: 1800 },
  { code: 5, name: 'Soft Drink', price: 500 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await MenuItem.deleteMany({});
  await MenuItem.insertMany(items);
  console.log('✅ Menu seeded');
  mongoose.disconnect();
}
seed();