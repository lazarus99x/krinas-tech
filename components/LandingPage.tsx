import React, { useState, useEffect, useRef } from 'react';
import { 
  Hexagon, ArrowRight, Package, 
  BarChart3, Users, Lock, X, Mail, LockKeyhole, 
  Loader2, Moon, Sun, ChevronRight, LayoutDashboard, 
  ShoppingCart, Bell, Search, TrendingUp, DollarSign, 
  MoreHorizontal 
} from 'lucide-react';
import { 
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip as RechartsTooltip, Cell 
} from 'recharts';
import { api, logActivity } from '../services/storage';
import { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Live Chart Data State
  const [chartData, setChartData] = useState(() => 
    [...Array(15)].map((_, i) => ({
      name: i,
      value: 3000 + Math.random() * 4000,
      sales: 10 + Math.random() * 20
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        return [...prev.slice(1), { 
          name: (prev[prev.length - 1].name || 0) + 1, 
          value: 3000 + Math.random() * 4000,
          sales: 10 + Math.random() * 20
        }];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const users = await api.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user && user.password === password) {
        if (!user.isActive) {
           setError('Account suspended. Contact administrator.');
           setIsLoading(false);
           return;
        }
        
        // Log successful login
        logActivity(user, 'LOGIN', 'User logged in successfully');
        
        onLogin(user);
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg transition-colors duration-500 font-sans selection:bg-brand-gold/30 text-brand-text overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-bg/90 backdrop-blur-md border-b border-gray-800 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-gold rounded-xl text-white shadow-lg shadow-brand-gold/20">
              <Hexagon size={24} fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight">Krinas Tech</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/5 transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="font-medium text-brand-text/70 hover:text-brand-gold hover:text-brand-gold transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => window.location.href='mailto:sales@abrinventory.ng'}
              className="bg-white/10 text-brand-text px-5 py-2.5 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 hidden sm:block"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-gold/50/20 rounded-full blur-[120px] -z-10 pointer-events-none dark:bg-brand-gold/50/10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] -z-10 pointer-events-none bg-brand-gold/10" />

        <div className="max-w-6xl mx-auto text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/5 bg-brand-gold-dark/20 text-brand-gold text-brand-gold text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold/50"></span>
            </span>
            v3.0 Multi-User System
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            Inventory management, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-purple-600 dark:from-blue-400 dark:to-purple-400">reimagined.</span>
          </h1>
          
          <p className="text-xl text-brand-muted max-w-2xl mx-auto leading-relaxed">
            Secure role-based access control, automated tracking, and robust analytics for modern teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-full font-semibold text-lg shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Sign In <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => window.location.href='mailto:sales@abrinventory.ng'}
              className="w-full sm:w-auto px-8 py-4 bg-brand-surface text-brand-text border border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full font-semibold text-lg transition-all"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-brand-surface/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Package, title: 'Smart Inventory', desc: 'Real-time stock tracking with low-stock alerts and automated reordering suggestions.' },
              { icon: ShoppingCart, title: 'Modern POS', desc: 'Fast, reliable point of sale interface designed for high-volume retail environments.' },
              { icon: BarChart3, title: 'Deep Analytics', desc: 'Actionable insights into sales trends, best performers, and revenue growth.' }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-gray-50 bg-brand-surface border border-gray-800 hover:shadow-xl transition-all duration-300 group">
                <div className="w-12 h-12 bg-brand-gold/10 bg-brand-gold-dark/20 text-brand-gold text-brand-gold rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-brand-text">{feature.title}</h3>
                <p className="text-brand-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Analytics Demo Section */}
      <section className="py-24 px-6 relative">
         <div className="max-w-7xl mx-auto">
           <div className="flex flex-col lg:flex-row items-center gap-12">
             <div className="lg:w-1/2 space-y-6">
               <h2 className="text-4xl font-bold tracking-tight text-brand-text">Live insights, <br/> right at your fingertips.</h2>
               <p className="text-lg text-brand-muted">
                 Monitor your business health in real-time. From sales velocity to inventory turnover, get the data you need to make decisions instantly.
               </p>
               <div className="flex gap-4 pt-4">
                 <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
                   <TrendingUp size={16} /> +24% Growth
                 </div>
                 <div className="flex items-center gap-2 text-sm font-medium text-brand-gold bg-brand-gold/5 bg-brand-gold-dark/20 px-4 py-2 rounded-full">
                   <Users size={16} /> Active Staff
                 </div>
               </div>
             </div>
             
             <div className="lg:w-1/2 w-full">
               <div className="bg-brand-surface rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-800 p-6 relative overflow-hidden">
                 <div className="flex justify-between items-center mb-6">
                   <div>
                     <p className="text-sm text-brand-muted">Total Revenue</p>
                     <h3 className="text-2xl font-bold text-brand-text">₦4,250,000</h3>
                   </div>
                   <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                     <BarChart3 size={20} className="text-blue-500" />
                   </div>
                 </div>
                 <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData}>
                       <defs>
                         <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                       <RechartsTooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: isDarkMode ? '#1f2937' : '#fff', color: isDarkMode ? '#fff' : '#000' }}
                         cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                       />
                       <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </div>
             </div>
           </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white bg-brand-bg border-t border-gray-200 dark:border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-gold rounded-xl text-white">
              <Hexagon size={20} fill="currentColor" />
            </div>
            <span className="font-bold text-lg tracking-tight text-brand-text">Krinas Tech</span>
           </div>
           
           <div className="flex gap-8 text-sm text-brand-muted">
             <a href="#" className="hover:text-brand-gold transition-colors">Privacy</a>
             <a href="#" className="hover:text-brand-gold transition-colors">Terms</a>
             <a href="#" className="hover:text-brand-gold transition-colors">Support</a>
           </div>
           
           <p className="text-sm text-gray-400">© 2025 Krinas Tech. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-brand-bg w-full max-w-md rounded-3xl shadow-2xl border border-gray-800 overflow-hidden relative animate-scale-in">
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-brand-surface text-brand-muted hover:text-brand-text transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex p-3 bg-brand-gold/5 bg-brand-gold-dark/20 text-brand-gold text-brand-gold rounded-2xl mb-4">
                  <LockKeyhole size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-brand-text">Welcome back</h3>
                <p className="text-brand-muted text-sm">
                  Enter your credentials to access your dashboard.
                </p>
                <div className="mt-2 text-xs text-brand-muted">
                   <p>Default Accounts:</p>
                   <p>admin@krinastech.com / password</p>
                   <p>sales@krinastech.com / password</p>
                   <p>stock@krinastech.com / password</p>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-xl text-center">
                    {error}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-brand-muted ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" 
                      className="w-full pl-11 pr-4 py-3 bg-brand-surface border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all text-brand-text placeholder-brand-muted"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-brand-muted ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-11 pr-4 py-3 bg-brand-surface border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all text-brand-text placeholder-brand-muted"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold rounded-xl shadow-lg shadow-brand-gold/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
