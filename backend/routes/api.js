const express = require('express');
const { getRates, convert, lockRate } = require('../controllers/fxController');
const { getTransactionById, confirmPayment, getTransactions, createPaymentIntent, simulateMockPayment } = require('../controllers/paymentController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// FX Routes
router.get('/fx/rates', getRates);
router.post('/fx/convert', convert);
router.post('/fx/lock-rate', apiLimiter, lockRate);

// Payment/Transaction Routes
router.get('/transaction/:txId', getTransactionById);
router.post('/payment/confirm/:txId', apiLimiter, confirmPayment);
router.get('/transactions', getTransactions);

// Legacy
router.post('/stripe/create-payment-intent', apiLimiter, createPaymentIntent);
router.post('/stripe/simulate-mock', apiLimiter, simulateMockPayment);

module.exports = router;
