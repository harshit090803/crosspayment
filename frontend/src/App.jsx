import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import PayInternational from './pages/PayInternational';
import PayIndia from './pages/PayIndia';
import Dashboard from './pages/Dashboard';
import { CreditCard, QrCode, LayoutDashboard, UserCircle, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

const NavAuthBadge = () => {
  const { merchantId, switchMerchant, loading } = useAuth();
  
  if (loading) return null;

  return (
    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
      <UserCircle size={16} className="text-slate-500" />
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        Demo: {merchantId}
      </span>
      <button 
        onClick={() => switchMerchant(merchantId === 'merchant_demo' ? 'merchant_beta' : 'merchant_demo')}
        className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 p-1 rounded-full transition-colors group"
        title="Switch Merchant to test Isolation"
      >
        <LogOut size={14} className="text-slate-400 group-hover:text-blue-500" />
      </button>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">
                  CrossPay
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <NavAuthBadge />
                <Link to="/pay/international" className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                  <CreditCard size={18} /> <span className="hidden sm:inline">Pay (Int'l)</span>
                </Link>
                <Link to="/pay/india" className="flex items-center space-x-1 hover:text-emerald-500 transition-colors">
                  <QrCode size={18} /> <span className="hidden sm:inline">Pay (India)</span>
                </Link>
                <Link to="/dashboard" className="flex items-center space-x-1 hover:text-purple-500 transition-colors">
                  <LayoutDashboard size={18} /> <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pay/international" element={<PayInternational />} />
            <Route path="/pay/india" element={<PayIndia />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
