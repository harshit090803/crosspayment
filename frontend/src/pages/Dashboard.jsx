import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRightLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/transactions');
        if (res.data.success) {
          setTransactions(res.data.transactions);
        }
      } catch (error) {
        console.error('Failed to fetch transactions', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
    // Auto refresh every 5 seconds for demo
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'success':
        return <span className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md text-xs font-medium"><CheckCircle2 size={14} className="mr-1" /> Success</span>;
      case 'failed':
        return <span className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md text-xs font-medium"><XCircle size={14} className="mr-1" /> Failed</span>;
      case 'processing':
        return <span className="flex items-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md text-xs font-medium"><Clock size={14} className="mr-1 animate-pulse" /> Processing</span>;
      default:
        return <span className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md text-xs font-medium"><Clock size={14} className="mr-1" /> Pending</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
          <p className="text-slate-500">Monitor your cross-border transactions</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Original Amount</th>
                <th className="px-6 py-4 font-medium">Exchange Rate</th>
                <th className="px-6 py-4 font-medium">Received Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading transactions...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No transactions yet.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold">{tx.amount.toFixed(2)} {tx.currency}</td>
                    <td className="px-6 py-4 text-slate-500 flex items-center">
                      <ArrowRightLeft size={14} className="mr-1" /> 1 {tx.currency} = {tx.rate.toFixed(4)} {tx.receiverCurrency || 'INR'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {(tx.receiverAmount || tx.convertedINR || 0).toFixed(2)} {tx.receiverCurrency || 'INR'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
