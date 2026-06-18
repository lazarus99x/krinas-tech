import React from 'react';
import { Product, Sale } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, Package, AlertCircle, DollarSign, Coins } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  isDarkMode?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ products, sales, isDarkMode }) => {
  const totalProducts = products.reduce((acc, p) => acc + p.stock, 0);
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const totalCostValue = products.reduce((acc, p) => acc + ((p.vendorPrice || 0) * p.stock), 0);
  
  // Calculate low stock items based on enabled alerts AND individual thresholds
  const lowStockItems = products.filter(p => p.enableLowStockAlert && p.stock <= (p.lowStockThreshold || 10)).length;
  
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const recentSalesCount = sales.length;

  // 1. Revenue Trend Data
  const chartData = sales.slice(-10).map((s, idx) => ({
    name: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    amount: s.totalAmount,
    fullDate: new Date(s.date).toLocaleString()
  }));

  // 2. Sales by Category Data
  const salesByCategory = sales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productId) || { category: 'Other' } as Product;
      const category = product.category || 'Other';
      acc[category] = (acc[category] || 0) + (item.quantity * item.priceAtSale);
    });
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(salesByCategory).map(key => ({
    name: key,
    value: salesByCategory[key]
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

  // 3. Stock Level Data - Prioritize items below their threshold, then lowest stock
  // Filter for only enabled alerts first to focus watchlist
  const stockData = [...products]
    .filter(p => p.enableLowStockAlert)
    .sort((a, b) => {
      // Calculate "stock pressure" relative to threshold. Lower ratio = higher priority.
      const aThreshold = a.lowStockThreshold || 10;
      const bThreshold = b.lowStockThreshold || 10;
      const aRatio = a.stock / aThreshold;
      const bRatio = b.stock / bThreshold;
      return aRatio - bRatio;
    })
    .slice(0, 5)
    .map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      stock: p.stock,
      fullname: p.name,
      threshold: p.lowStockThreshold || 10
    }));

  const formatCurrency = (amount: number) => {
    return '₦' + amount.toLocaleString();
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
    <div className="bg-brand-surface p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800 flex items-start justify-between gap-3 transition-all hover:scale-[1.02] duration-300">
      <div className="min-w-0 flex-1">
        <p className="text-brand-muted text-sm font-medium mb-1 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-brand-text break-all">{value}</h3>
        {subtext && <p className="text-xs text-brand-muted mt-2 truncate">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl shrink-0 ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-8">
      
      {/* Welcome Section Mobile */}
      <div className="md:hidden">
        <h2 className="text-2xl font-bold text-brand-text">Overview</h2>
        <p className="text-brand-muted text-sm">Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <StatCard 
          title="Total Inventory" 
          value={totalProducts} 
          icon={Package} 
          colorClass="text-brand-gold bg-brand-gold/5" 
          subtext="Gadgets & Electronics"
        />
        <StatCard 
          title="Stock Value" 
          value={formatCurrency(totalStockValue)} 
          icon={Coins} 
          colorClass="text-emerald-500 bg-emerald-500/10" 
          subtext="Total inventory worth"
        />
        <StatCard 
          title="Stock Cost" 
          value={formatCurrency(totalCostValue)} 
          icon={Package} 
          colorClass="text-blue-500 bg-blue-500/10" 
          subtext="From vendors"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStockItems} 
          icon={AlertCircle} 
          colorClass="text-red-600 bg-red-50" 
          subtext="Items needing restock"
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={DollarSign} 
          colorClass="text-green-600 bg-green-50" 
          subtext="Gross sales"
        />
        <StatCard 
          title="Transactions" 
          value={recentSalesCount} 
          icon={TrendingUp} 
          colorClass="text-purple-600 bg-purple-50" 
          subtext="Total orders processed"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-brand-surface p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-800 transition-colors">
          <h3 className="text-lg font-semibold text-brand-text/90 dark:text-white mb-6">Revenue Trend</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f0f0f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                    color: isDarkMode ? '#fff' : '#000'
                  }} 
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category (Pie) */}
        <div className="bg-brand-surface p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-800 transition-colors">
          <h3 className="text-lg font-semibold text-brand-text/90 dark:text-white mb-4">Sales by Category</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke={isDarkMode ? '#1f2937' : '#fff'}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                    color: isDarkMode ? '#fff' : '#000'
                  }} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Watchlist */}
        <div className="bg-brand-surface p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-800 transition-colors">
          <h3 className="text-lg font-semibold text-brand-text/90 dark:text-white mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" /> Low Stock Watchlist
          </h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#374151' : '#f0f0f0'} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11, fill: '#6b7280'}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none',
                    backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                    color: isDarkMode ? '#fff' : '#000'
                  }} 
                />
                <Bar dataKey="stock" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-brand-surface p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-800 transition-colors">
          <h3 className="text-lg font-semibold text-brand-text/90 dark:text-white mb-4">Recent Transactions</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {sales.slice().reverse().slice(0, 10).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 bg-brand-gold-dark/20 flex items-center justify-center text-indigo-600 text-brand-gold font-bold text-xs shrink-0">
                    {sale.customerName ? sale.customerName.substring(0,2).toUpperCase() : 'GU'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">{sale.customerName || 'Guest'}</p>
                    <p className="text-xs text-brand-muted">{new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                   <span className="block text-sm font-semibold text-brand-text">{formatCurrency(sale.totalAmount)}</span>
                   <span className="text-xs text-gray-400">{sale.items.length} items</span>
                </div>
              </div>
            ))}
            {sales.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No sales recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};