const Stripe = require('stripe');
const Transaction = require('../models/Transaction');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'mock_secret_key');
const MOCK_MODE = process.env.STRIPE_SECRET_KEY ? false : true;

const getTransactionById = async (req, res) => {
  try {
    const { txId } = req.params;
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
    const { txId } = req.params;
    const transaction = await Transaction.findById(txId);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (Date.now() > new Date(transaction.expiresAt).getTime()) {
      transaction.status = 'failed';
      await transaction.save();
      return res.status(400).json({ success: false, message: 'QR Code Expired' });
    }
    
    if (transaction.status === 'success') {
      return res.status(400).json({ success: false, message: 'Payment already processed' });
    }

    transaction.status = 'processing';
    await transaction.save();
    
    // Simulate processing delay to hold the HTTP connection (Emotional UX Realism)
    setTimeout(async () => {
      transaction.status = 'success';
      await transaction.save();
      res.json({ success: true, message: 'Payment simulated successfully' });
    }, 2500);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
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
