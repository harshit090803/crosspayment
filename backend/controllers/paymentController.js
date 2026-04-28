const Stripe = require('stripe');
const Transaction = require('../models/Transaction');
const Joi = require('joi');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'mock_secret_key');
const MOCK_MODE = process.env.STRIPE_SECRET_KEY ? false : true;

const getTransactionById = async (req, res) => {
  try {
    const txId = req.qrData.txId;
    const transaction = await Transaction.findById(txId);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const isExpired = Date.now() > new Date(transaction.expiresAt).getTime();
    
    res.json({
      success: true,
      transaction,
      isExpired
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { txId, jti } = req.qrData;
    
    // Legacy support for non-QR confirmation if needed, but we removed it.
    // Ensure we have a jti
    if (!jti) {
      return res.status(400).json({ success: false, message: 'Invalid QR token structure' });
    }

    const transaction = await Transaction.findById(txId);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.usedTokens && transaction.usedTokens.includes(jti)) {
      return res.json({ success: true, message: 'Payment already processed (idempotent response)', transaction });
    }

    if (Date.now() > new Date(transaction.expiresAt).getTime()) {
      transaction.status = 'failed';
      await transaction.save();
      const io = req.app.get('io');
      if (io) io.to(transaction.merchantId).emit('transaction_updated', transaction);
      return res.status(400).json({ success: false, message: 'QR Code Expired' });
    }
    
    if (transaction.status === 'success' || transaction.status === 'failed') {
      return res.status(400).json({ success: false, message: 'Payment already processed' });
    }

    // Burn the JTI
    transaction.usedTokens.push(jti);
    transaction.status = 'processing';
    await transaction.save();

    const io = req.app.get('io');
    if (io) io.to(transaction.merchantId).emit('transaction_updated', transaction);
    
    // Simulate processing delay to hold the HTTP connection (Emotional UX Realism)
    setTimeout(async () => {
      transaction.status = 'success';
      await transaction.save();
      if (io) io.to(transaction.merchantId).emit('transaction_updated', transaction);
      res.json({ success: true, message: 'Payment simulated successfully' });
    }, 2500);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const merchantId = req.user ? req.user.merchantId : 'merchant_demo';
    const transactions = await Transaction.find({ merchantId }).sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Kept for backward compatibility with older flow if needed
const createPaymentIntent = async (req, res) => {
  res.status(400).json({ success: false, message: 'Deprecated' });
};
const simulateMockPayment = async (req, res) => {
  res.status(400).json({ success: false, message: 'Deprecated' });
};
const handleWebhook = async (req, res) => { res.send(); };

module.exports = {
  getTransactionById,
  confirmPayment,
  getTransactions,
  createPaymentIntent,
  simulateMockPayment,
  handleWebhook
};
