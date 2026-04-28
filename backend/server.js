require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');
const apiRoutes = require('./routes/api');
const { handleWebhook } = require('./controllers/paymentController');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.merchantId = decoded.merchantId;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected for merchant: ${socket.merchantId}`);
  socket.join(socket.merchantId); // Isolate events by merchant ID
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.merchantId}`);
  });
});

app.set('io', io); // Make IO accessible in controllers

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
