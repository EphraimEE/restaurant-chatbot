require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ Mongo error:', err.message));

// Routes
const botRoutes = require('./controllers/bot');
const paystackRoutes = require('./controllers/paystack');

app.use('/', botRoutes);            // session + message endpoints
app.use('/paystack', paystackRoutes); // payment routes

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: send index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));