import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Mic, ArrowRight, Loader2, Info, CheckCircle2, QrCode, ScanLine, Clock, AlertTriangle } from 'lucide-react';

const PayInternational = () => {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'scan'

  // ==============================
  // GENERATE QR STATE
  // ==============================
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('USD');
  const [receiverName, setReceiverName] = useState('CrossPay Merchant');
  const [upiId, setUpiId] = useState('merchant@ybl');
  const [estimate, setEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [generatedTx, setGeneratedTx] = useState(null); // { txId, expiresAt }
  const [generatingQR, setGeneratingQR] = useState(false);

  // ==============================
  // SCAN QR STATE
  // ==============================
  const [manualTxId, setManualTxId] = useState('');
  const [scannedTxId, setScannedTxId] = useState(null);
  const [scanState, setScanState] = useState('scanning'); // scanning, fetching, confirm, success, error
  const [scannedTxDetails, setScannedTxDetails] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // IP-BASED CURRENCY DETECTION
  useEffect(() => {
    const fetchLocationCurrency = async () => {
      try {
        const res = await axios.get('https://ipapi.co/currency/');
        if (res.data && res.data.length === 3) {
          setCurrency(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch location currency', err);
      }
    };
    fetchLocationCurrency();
  }, []);

  const getReceiverCurrency = (upi) => {
    const id = upi.toLowerCase();
    if (id.includes('@chase') || id.includes('@bofa') || id.includes('@citi') || id.includes('.us')) return 'USD';
    if (id.includes('@barclays') || id.includes('@hsbc') || id.includes('.uk')) return 'GBP';
    if (id.includes('@emirates') || id.includes('@adcb') || id.includes('.ae')) return 'AED';
    if (id.includes('@rbc') || id.includes('@scotia') || id.includes('.ca')) return 'CAD';
    if (id.includes('@eur') || id.includes('@db')) return 'EUR';
    return 'INR'; // default to India
  };

  // DEBOUNCE ESTIMATE LOGIC
  useEffect(() => {
    if (activeTab !== 'generate') return;
    
    const fetchEstimate = async () => {
      if (!amount || isNaN(amount) || amount <= 0) {
        setEstimate(null);
        return;
      }
      setLoadingEstimate(true);
      try {
        const receiverCurrency = getReceiverCurrency(upiId);
        const res = await axios.post('http://localhost:5000/api/fx/convert', {
          amount: parseFloat(amount),
          fromCurrency: currency,
          toCurrency: receiverCurrency
        });
        if (res.data.success) {
          setEstimate({
            receiverAmount: res.data.receiverAmount,
            receiverCurrency: res.data.toCurrency,
            rate: res.data.rate
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEstimate(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 500);
    return () => clearTimeout(timer);
  }, [amount, currency, upiId, activeTab]);

  const handleGenerateQR = async () => {
    if (!amount || !upiId || !receiverName) return;
    setGeneratingQR(true);
    
    try {
      const receiverCurrency = getReceiverCurrency(upiId);
      const res = await axios.post('http://localhost:5000/api/fx/lock-rate', {
        amount: parseFloat(amount),
        fromCurrency: currency,
        toCurrency: receiverCurrency,
        upiId,
        receiverName
      });
      
      if (res.data.success) {
        setGeneratedTx({
          txId: res.data.txId,
          expiresAt: res.data.expiresAt
        });
      }
    } catch (error) {
      console.error('Failed to generate QR', error);
    }
    setGeneratingQR(false);
  };

// ... inside component
  // SCANNER EFFECT
  useEffect(() => {
    let html5QrCode;

    if (activeTab === 'scan' && scanState === 'scanning') {
      const startScanner = async () => {
        try {
          html5QrCode = new Html5Qrcode("reader");
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
              }
              
              try {
                const data = JSON.parse(decodedText);
                if (data.txId) {
                  handleFetchTransaction(data.txId);
                } else {
                  setScanState('error');
                  setScanError("Invalid QR format");
                }
              } catch (e) {
                handleFetchTransaction(decodedText);
              }
            },
            (errorMessage) => {
              // Ignore normal scanning errors
            }
          );
        } catch (err) {
          console.error("Camera access error:", err);
          // If camera fails, they can still use manual paste fallback
        }
      };

      startScanner();
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [activeTab, scanState]);

  const handleFetchTransaction = async (txId) => {
    setScannedTxId(txId);
    setScanState('fetching');
    try {
      const res = await axios.get(`http://localhost:5000/api/transaction/${txId}`);
      if (res.data.success) {
        if (res.data.isExpired) {
          setScanState('error');
          setScanError('QR Code has expired.');
        } else if (res.data.transaction.status === 'success') {
          setScanState('error');
          setScanError('Transaction already paid.');
        } else {
          setScannedTxDetails(res.data.transaction);
          setScanState('confirm');
        }
      }
    } catch (err) {
      setScanState('error');
      setScanError(err.response?.data?.message || 'Transaction not found');
    }
  };

  const handleManualPaste = (e) => {
    e.preventDefault();
    if (manualTxId.trim()) {
      handleFetchTransaction(manualTxId.trim());
    }
  };

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/payment/confirm/${scannedTxId}`);
      if (res.data.success) {
        setScanState('success');
      }
    } catch (err) {
      setScanState('error');
      setScanError(err.response?.data?.message || 'Payment failed');
    }
    setConfirmingPayment(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER TABS */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
        <button 
          onClick={() => { setActiveTab('generate'); setGeneratedTx(null); }}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold flex justify-center items-center space-x-2 transition-all ${activeTab === 'generate' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <QrCode size={18} /> <span>Merchant (Create QR)</span>
        </button>
        <button 
          onClick={() => { setActiveTab('scan'); setScanState('scanning'); }}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold flex justify-center items-center space-x-2 transition-all ${activeTab === 'scan' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <ScanLine size={18} /> <span>User (Scan & Pay)</span>
        </button>
      </div>

      {/* ================================================== */}
      {/* MODE A: GENERATE QR */}
      {/* ================================================== */}
      {activeTab === 'generate' && !generatedTx && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          <div className="glassmorphism p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2">Receiver Details</h3>
            
            <div>
              <label className="text-sm font-medium text-slate-500">Receiver Name</label>
              <input 
                type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Business Name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-500">UPI ID</label>
              <input 
                type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="name@bank"
              />
            </div>
          </div>

          <div className="glassmorphism p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2">Payment Details</h3>
            
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-500">Amount Requesting</label>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input 
                  type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-4xl font-bold bg-transparent border-none outline-none text-slate-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <select 
                value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-4 font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
                <option value="CAD">CAD</option>
                <option value="INR">INR</option>
              </select>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {loadingEstimate ? '...' : estimate ? `${estimate.receiverAmount.toFixed(2)}` : '0.00'}
                </span>
                <span className="text-sm font-medium text-slate-500">{estimate ? estimate.receiverCurrency : getReceiverCurrency(upiId)} Estimate</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerateQR}
            disabled={!estimate || loadingEstimate || generatingQR}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex justify-center items-center"
          >
            {generatingQR ? <Loader2 className="animate-spin" /> : "Generate Locked QR"}
          </button>
        </div>
      )}

      {activeTab === 'generate' && generatedTx && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center">
          <div className="glassmorphism p-8 rounded-3xl inline-block mx-auto border border-slate-200 dark:border-slate-700 shadow-xl w-full">
            <h3 className="font-bold text-xl mb-4 text-blue-600 dark:text-blue-400">Scan to Pay</h3>
            
            <div className="bg-white p-4 rounded-2xl mb-4 flex justify-center">
              <QRCodeSVG 
                value={JSON.stringify({ txId: generatedTx.txId })} 
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="font-bold text-xl mb-1">{receiverName}</p>
            <p className="text-slate-500 text-sm mb-4 font-mono">{upiId}</p>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl flex items-center justify-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock size={16} />
              <span>Expires at {new Date(generatedTx.expiresAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <button 
            onClick={() => setGeneratedTx(null)}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Generate New QR
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* MODE B: SCAN QR */}
      {/* ================================================== */}
      {activeTab === 'scan' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          
          {scanState === 'scanning' && (
            <div className="glassmorphism p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-lg text-center mb-4">Scan Merchant QR</h3>
              
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-emerald-500 bg-black/5 flex items-center justify-center" id="reader" style={{ width: '100%', minHeight: '250px' }}>
                {/* HTML5 QR Scanner hooks here */}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 mb-2 text-center">Camera not working? Paste Transaction ID:</p>
                <form onSubmit={handleManualPaste} className="flex space-x-2">
                  <input 
                    type="text" value={manualTxId} onChange={(e) => setManualTxId(e.target.value)}
                    className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                    placeholder="txId..."
                  />
                  <button type="submit" className="px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold">
                    Go
                  </button>
                </form>
              </div>
            </div>
          )}

          {scanState === 'fetching' && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-emerald-500" size={48} />
              <p className="text-slate-500">Fetching transaction details...</p>
            </div>
          )}

          {scanState === 'error' && (
            <div className="glassmorphism p-8 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-bold text-xl">Scan Failed</h3>
              <p className="text-slate-500">{scanError}</p>
              <button 
                onClick={() => setScanState('scanning')}
                className="mt-4 px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold"
              >
                Try Again
              </button>
            </div>
          )}

          {scanState === 'confirm' && scannedTxDetails && (
            <div className="glassmorphism p-6 rounded-3xl space-y-6">
              <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 mb-1">Paying To</p>
                <h2 className="text-2xl font-bold">{scannedTxDetails.receiverName}</h2>
                <p className="text-slate-500 font-mono text-sm">{scannedTxDetails.upiId}</p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl text-center">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Total Amount Due</p>
                <h1 className="text-5xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {scannedTxDetails.amount} <span className="text-2xl">{scannedTxDetails.currency}</span>
                </h1>
              </div>

              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>Exchange Rate (Locked)</span>
                  <span className="font-mono">1 {scannedTxDetails.currency} = {scannedTxDetails.rate.toFixed(4)} {scannedTxDetails.receiverCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Merchant Receives</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{scannedTxDetails.receiverAmount.toFixed(2)} {scannedTxDetails.receiverCurrency}</span>
                </div>
              </div>

              <button 
                onClick={handleConfirmPayment}
                disabled={confirmingPayment}
                className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex justify-center items-center"
              >
                {confirmingPayment ? <Loader2 className="animate-spin" /> : `Confirm & Pay ${scannedTxDetails.amount} ${scannedTxDetails.currency}`}
              </button>
              
              <button 
                onClick={() => setScanState('scanning')}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}

          {scanState === 'success' && (
            <div className="max-w-md mx-auto text-center space-y-6 animate-in zoom-in duration-500 mt-10">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold">Payment Complete!</h2>
              <p className="text-slate-500">
                You successfully paid {scannedTxDetails?.amount} {scannedTxDetails?.currency} to {scannedTxDetails?.receiverName}.
              </p>
              
              <button 
                onClick={() => setScanState('scanning')}
                className="mt-8 text-emerald-600 hover:underline font-medium"
              >
                Scan another QR
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default PayInternational;
