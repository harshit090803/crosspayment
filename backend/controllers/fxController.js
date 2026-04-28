const axios = require('axios');
const Transaction = require('../models/Transaction');

// Cache object
let cache = {
  timestamp: 0,
  rates: {}
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MARGIN = 0.005; // 0.5% margin

const getRatesInternal = async () => {
  const now = Date.now();
  if (now - cache.timestamp < CACHE_DURATION && Object.keys(cache.rates).length > 0) {
    return { rates: cache.rates, cached: true };
  }

  try {
    const allRatesResponse = await axios.get('https://api.frankfurter.app/latest');
    const baseRates = allRatesResponse.data.rates;
    baseRates['EUR'] = 1;
    
    cache = {
      timestamp: now,
      rates: baseRates
    };

    return { rates: baseRates, cached: false };
  } catch (error) {
    console.error('FX Error:', error.message);
    const fallbackRates = { USD: 1.08, EUR: 1, GBP: 0.85, AED: 3.97, CAD: 1.46, INR: 89.5 };
    return { rates: fallbackRates, cached: false, fallback: true };
  }
};

const getRates = async (req, res) => {
  const data = await getRatesInternal();
  res.json({ success: true, ...data });
};

const convert = async (req, res) => {
  const { amount, fromCurrency, toCurrency } = req.body;
  if (!amount || !fromCurrency || !toCurrency) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }
  
  try {
    const data = await getRatesInternal();
    const rates = data.rates;
    rates['EUR'] = 1;
    
    const rateFrom = rates[fromCurrency] || 1;
    const rateTo = rates[toCurrency] || 1;
    
    let rawRate = rateTo / rateFrom;
    let rate = rawRate * (1 - MARGIN); // Apply 0.5% margin fee
    
    if (fromCurrency === toCurrency) rate = 1; // No margin on same currency

    const receiverAmount = amount * rate;
    
    res.json({
      success: true,
      amount,
      fromCurrency,
      toCurrency,
      rate,
      receiverAmount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const lockRate = async (req, res) => {
  const { amount, fromCurrency, toCurrency, upiId, receiverName } = req.body;
  
  if (!amount || !fromCurrency || !toCurrency || !upiId || !receiverName) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  try {
    const data = await getRatesInternal();
    const rates = data.rates;
    rates['EUR'] = 1;

    const rateFrom = rates[fromCurrency] || 1;
    const rateTo = rates[toCurrency] || 1;
    
    let rawRate = rateTo / rateFrom;
    let rate = rawRate * (1 - MARGIN);
    
    if (fromCurrency === toCurrency) rate = 1;

    const receiverAmount = amount * rate;

    // Create a pending transaction
    const transaction = new Transaction({
      amount: parseFloat(amount),
      currency: fromCurrency,
      receiverAmount,
      receiverCurrency: toCurrency,
      rate,
      status: 'pending',
      upiId,
      receiverName,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    });

    await transaction.save();

    res.json({
      success: true,
      txId: transaction._id,
      expiresAt: transaction.expiresAt
    });
  } catch (error) {
    console.error('Lock Rate Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRates, convert, lockRate };
