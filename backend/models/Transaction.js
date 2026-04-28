const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true }, // Sender Amount
  currency: { type: String, required: true }, // Sender Currency
  receiverAmount: { type: Number, required: true },
  receiverCurrency: { type: String, required: true },
  rate: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'success', 'failed'],
    default: 'pending' 
  },
  userId: { type: String, required: true, default: 'anonymous' },
  merchantId: { type: String, required: true, default: 'demo_merchant' },
  stripePaymentIntentId: { type: String },
  stripeClientSecret: { type: String },
  upiId: { type: String, required: true },
  receiverName: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  merchantId: { type: String, required: true, default: 'merchant_demo' },
  idempotencyKey: { type: String, unique: true, sparse: true },
  usedTokens: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
