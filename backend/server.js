require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');
const { handleWebhook } = require('./controllers/paymentController');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas (or fallback if empty for testing without throwing sync errors)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGODB_URI not provided. Please set it in .env to connect to DB.');
}

// Security: Use CORS and Morgan for logging
app.use(cors());
app.use(morgan('dev'));

// Stripe Webhook MUST use express.raw before express.json
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleWebhook);

// Body parsing middleware
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CrossPay API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
