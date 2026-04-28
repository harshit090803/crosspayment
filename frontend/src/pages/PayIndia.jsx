import { QrCode } from 'lucide-react';

const PayIndia = () => {
  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-500 text-center">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pay via UPI</h1>
        <p className="text-slate-500">For Indian customers paying in INR locally.</p>
      </div>

      <div className="glassmorphism p-8 rounded-3xl inline-block mx-auto border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="bg-white p-4 rounded-2xl mb-6">
          {/* Static placeholder QR for demo */}
          <QrCode size={200} className="text-slate-900" />
        </div>
        
        <p className="font-bold text-xl mb-1">CrossPay Merchant</p>
        <p className="text-slate-500 text-sm mb-6">crosspay@ybl</p>
        
        <div className="flex space-x-2 justify-center text-sm text-slate-500">
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">GPay</span>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">PhonePe</span>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Paytm</span>
        </div>
      </div>
      
      <p className="text-sm text-slate-400 max-w-xs mx-auto">
        Scan this QR code with any UPI app to make a direct INR payment to the merchant.
      </p>
    </div>
  );
};

export default PayIndia;
