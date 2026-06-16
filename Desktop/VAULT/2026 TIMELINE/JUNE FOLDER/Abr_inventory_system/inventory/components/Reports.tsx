import React, { useState, useMemo } from 'react';
import { AppSettings, Sale } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { FileText, Download, Printer, Calendar, Filter, TrendingUp, DollarSign, ShoppingBag, Eye, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

interface ReportsProps {
  sales: Sale[];
  isDarkMode?: boolean;
  settings?: AppSettings;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';

export const Reports: React.FC<ReportsProps> = ({ sales, isDarkMode, settings }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    return sales.filter(sale => {
      const saleDate = new Date(sale.date).getTime();
      if (timeRange === 'daily') return saleDate >= startOfDay;
      if (timeRange === 'weekly') return saleDate >= startOfWeek;
      if (timeRange === 'monthly') return saleDate >= startOfMonth;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, timeRange]);

  // Aggregates (Only count non-failed transactions for revenue)
  const validSales = filteredSales.filter(s => s.status !== 'FAILED');
  const totalRevenue = validSales.reduce((acc, s) => acc + s.totalAmount, 0); // Gross revenue
  const totalCollected = validSales.reduce((acc, s) => acc + (s.amountPaid || s.totalAmount), 0); // Actual cash flow
  const totalOrders = filteredSales.length;
  const averageOrderValue = validSales.length > 0 ? totalRevenue / validSales.length : 0;

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    validSales.forEach(sale => {
      const dateKey = new Date(sale.date).toLocaleDateString(undefined, { 
        weekday: timeRange === 'daily' ? undefined : 'short', 
        day: 'numeric',
        month: timeRange === 'monthly' ? undefined : 'short'
      });
      data[dateKey] = (data[dateKey] || 0) + sale.totalAmount;
    });
    return Object.keys(data).map(key => ({ name: key, revenue: data[key] })).reverse();
  }, [validSales, timeRange]);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const exportToCSV = () => {
    const headers = ['Sale ID', 'Date', 'Customer', 'Staff', 'Status', 'Paid', 'Balance', 'Total'];
    const rows = filteredSales.map(s => [
      s.id,
      new Date(s.date).toLocaleString().replace(',', ''),
      `"${s.customerName || 'Walk-in'}"`,
      `"${s.staffName || 'Unknown'}"`,
      s.status || 'PAID',
      s.amountPaid || s.totalAmount,
      s.balance || 0,
      s.totalAmount
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `krinas_inventory_sales_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'PAID': return <CheckCircle size={14} />;
          case 'FAILED': return <XCircle size={14} />;
          case 'PARTIAL': return <AlertCircle size={14} />;
          default: return <AlertCircle size={14} />;
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Print Only Header */}
      <div className="hidden print:flex items-center justify-between mb-8 border-b pb-4">
        <div className="flex items-center gap-4">
           {settings?.logoUrl && (
             <img src={settings.logoUrl} alt="Company Logo" className="h-12 w-auto object-contain" />
           )}
           <div>
             <h1 className="text-xl font-bold text-gray-900">{settings?.companyName || 'Krinas Tech'}</h1>
             <p className="text-sm text-gray-500">{settings?.address}</p>
           </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold uppercase tracking-wider text-gray-700">Sales Report</h2>
          <p className="text-xs text-gray-500">Period: {timeRange.toUpperCase()}</p>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-brand-surface p-4 rounded-2xl shadow-sm border border-gray-800 no-print transition-colors">
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 min-w-[80px] px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
                timeRange === range 
                ? 'bg-white dark:bg-gray-600 text-brand-text shadow-sm' 
                : 'text-brand-muted hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm">
            <Download size={18} /> <span className="inline md:hidden lg:inline">Export</span>
          </button>
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-brand-gold text-white rounded-xl hover:bg-gray-800 dark:hover:bg-brand-gold-dark transition-colors font-medium shadow-lg shadow-gray-900/20 shadow-brand-gold/15 text-sm">
            <Printer size={18} /> <span className="inline md:hidden lg:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-brand-surface p-5 rounded-2xl shadow-sm border border-gray-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-brand-muted text-sm font-medium">Total Sales Value</p>
              <h3 className="text-2xl font-bold text-brand-text mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl"><DollarSign size={24} /></div>
          </div>
        </div>
        <div className="bg-brand-surface p-5 rounded-2xl shadow-sm border border-gray-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-brand-muted text-sm font-medium">Total Transactions</p>
              <h3 className="text-2xl font-bold text-brand-text mt-1">{totalOrders}</h3>
            </div>
            <div className="p-3 bg-brand-gold/5 bg-brand-gold-dark/20 text-brand-gold text-brand-gold rounded-xl"><ShoppingBag size={24} /></div>
          </div>
        </div>
        <div className="bg-brand-surface p-5 rounded-2xl shadow-sm border border-gray-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-brand-muted text-sm font-medium">Cash Collected</p>
              <h3 className="text-2xl font-bold text-brand-text mt-1">{formatCurrency(totalCollected)}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl"><TrendingUp size={24} /></div>
          </div>
        </div>
      </div>

      {/* Charts Section - Hidden in Print if needed, or styled for print */}
      <div className="bg-brand-surface p-6 rounded-2xl shadow-sm border border-gray-800 print:break-inside-avoid transition-colors">
        <h3 className="text-lg font-bold text-brand-text/90 dark:text-white mb-6 capitalize">{timeRange} Revenue Overview</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} tickFormatter={(val) => `₦${val/1000}k`} />
              <Tooltip 
                cursor={{fill: isDarkMode ? '#1f2937' : '#f9fafb'}}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                  color: isDarkMode ? '#fff' : '#000'
                }}
                formatter={(val: number) => [formatCurrency(val), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Transaction Table */}
      <div className="bg-brand-surface rounded-2xl shadow-sm border border-gray-800 overflow-hidden print:shadow-none print:border-none transition-colors">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-50/50 dark:bg-gray-700/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-brand-text/90 dark:text-white">Transaction History</h3>
          <span className="text-xs text-brand-muted bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-700">
             {filteredSales.length} Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-brand-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Receipt ID</th>
                <th className="px-6 py-3 font-medium">Date & Time</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-brand-text/70 font-mono text-xs">
                    #{sale.id}
                  </td>
                  <td className="px-6 py-4 text-brand-text/70">
                    <div className="font-medium text-brand-text">{new Date(sale.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-brand-text">{sale.customerName || 'Walk-in'}</div>
                    <div className="text-xs text-gray-400">{sale.items.length} items</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      sale.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' :
                      sale.status === 'CREDIT' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900' :
                      sale.status === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900' :
                      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                    }`}>
                      {getStatusIcon(sale.status)}
                      {sale.status || 'PAID'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-brand-text">{formatCurrency(sale.totalAmount)}</div>
                    {sale.status !== 'PAID' && <div className="text-xs text-gray-500">Paid: {formatCurrency(sale.amountPaid || 0)}</div>}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <button 
                       onClick={() => setSelectedSale(sale)}
                       className="p-2 text-gray-500 hover:text-brand-gold hover:bg-brand-gold/5 hover:bg-brand-gold-dark/20 rounded-lg transition-colors"
                       title="View Receipt"
                     >
                        <Eye size={18} />
                     </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-brand-muted">
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-gray-400 mt-8">
        Generated by {settings?.companyName || 'Krinas Tech'} on {new Date().toLocaleString()}
      </div>

      {/* View Receipt Modal */}
      {selectedSale && (
          <ReceiptModal 
             sale={selectedSale}
             settings={settings || {} as AppSettings}
             onClose={() => setSelectedSale(null)}
             isOpen={!!selectedSale}
          />
      )}
    </div>
  );
};
