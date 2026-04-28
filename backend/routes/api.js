const express = require('express');
const jwt = require('jsonwebtoken');
const { getRates, convert, lockRate } = require('../controllers/fxController');
const { getTransactionById, confirmPayment, getTransactions, createPaymentIntent, simulateMockPayment } = require('../controllers/paymentController');
const rateLimit = require('express-rate-limit');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Auth Routes
router.post('/auth/demo-login', (req, res) => {
  const { merchantId } = req.body;
  const id = merchantId || 'merchant_demo';
  const token = jwt.sign({ merchantId: id }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, token, merchantId: id });
});

// FX Routes
router.get('/fx/rates', getRates);
router.post('/fx/convert', convert);
router.post('/fx/lock-rate', authMiddleware, apiLimiter, lockRate);

// Payment/Transaction Routes
router.get('/transaction/:txId', getTransactionById);
router.post('/payment/confirm/:txId', apiLimiter, confirmPayment);
router.get('/transactions', authMiddleware, getTransactions);

// Legacy
router.post('/stripe/create-payment-intent', apiLimiter, createPaymentIntent);
router.post('/stripe/simulate-mock', apiLimiter, simulateMockPayment);

module.exports = router;
