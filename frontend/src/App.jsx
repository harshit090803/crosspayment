import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import PayInternational from './pages/PayInternational';
import PayIndia from './pages/PayIndia';
import Dashboard from './pages/Dashboard';
import { CreditCard, QrCode, LayoutDashboard } from 'lucide-react';

function App() {
  return (
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
  );
}

export default App;
