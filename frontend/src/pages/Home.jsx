import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Zap, ShieldCheck } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Cross-border payments, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
            simplified.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
          The easiest way for international users to pay in their local currency, while Indian merchants receive INR instantly via UPI.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/pay/international" 
          className="px-8 py-4 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
        >
          <span>Make International Payment</span>
          <ArrowRight size={20} />
        </Link>
        <Link 
          to="/pay/india" 
          className="px-8 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold flex items-center justify-center space-x-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
        >
          <span>View QR Code (India)</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-16">
        <FeatureCard 
          icon={<Globe className="text-blue-500 w-8 h-8" />}
          title="Global Reach"
          description="Pay in USD, EUR, GBP and more. We handle the real-time conversion."
        />
        <FeatureCard 
          icon={<Zap className="text-emerald-500 w-8 h-8" />}
          title="Instant Payouts"
          description="Merchants receive funds instantly via simulated UPI routing."
        />
        <FeatureCard 
          icon={<ShieldCheck className="text-purple-500 w-8 h-8" />}
          title="Secure Tech"
          description="Powered by Stripe for secure card processing and real-time FX APIs."
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl w-fit">
      {icon}
    </div>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400">{description}</p>
  </div>
);

export default Home;
