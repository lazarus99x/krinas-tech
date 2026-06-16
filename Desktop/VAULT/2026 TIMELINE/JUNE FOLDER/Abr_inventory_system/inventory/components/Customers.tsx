import React, { useState } from 'react';
import { Customer } from '../types';
import { User, Mail, Phone, Plus, Trash2, Search, X } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (c: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer, onDeleteCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Customer>>({ name: '', email: '', phone: '' });

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomer({ ...formData, id: Date.now().toString(), totalSpent: 0 } as Customer);
    setIsModalOpen(false);
    setFormData({ name: '', email: '', phone: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full pl-10 pr-4 py-3 bg-brand-surface border border-gray-700 text-brand-text rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/20 shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gray-900 dark:bg-brand-gold text-white px-5 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-brand-gold-dark transition-colors shadow-lg shadow-gray-900/10 shadow-brand-gold/15">
          <Plus size={18} /> <span>Add Customer</span>
        </button>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-brand-surface p-5 rounded-2xl shadow-sm border border-gray-800 hover:shadow-md transition-all flex flex-col">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-brand-gold/5 bg-brand-gold-dark/20 rounded-full flex items-center justify-center text-brand-gold text-brand-gold font-bold text-lg shrink-0">
                {customer.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-brand-text truncate">{customer.name}</h3>
                <p className="text-xs text-brand-muted">ID: {customer.id.slice(-4)}</p>
              </div>
            </div>
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-center text-brand-text/70 text-sm gap-3">
                <Mail size={16} className="text-gray-400 shrink-0" /> <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center text-brand-text/70 text-sm gap-3">
                <Phone size={16} className="text-gray-400 shrink-0" /> <span>{customer.phone}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
              <div>
                <span className="block text-xs text-gray-400">Total Spent</span>
                <span className="font-bold text-brand-text">₦{customer.totalSpent.toLocaleString()}</span>
              </div>
              <button onClick={() => onDeleteCustomer(customer.id)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10 col-span-full">No customers found.</p>}
      </div>

      {/* Modal - Mobile Bottom Sheet style */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4">
          <div className="bg-brand-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-fade-in-up pb-8 sm:pb-6">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-brand-text">Add New Customer</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text/80 mb-1">Full Name</label>
                <input required type="text" className="w-full px-4 py-3 border border-gray-700 bg-white dark:bg-gray-700 text-brand-text rounded-xl focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/80 mb-1">Email</label>
                <input required type="email" className="w-full px-4 py-3 border border-gray-700 bg-white dark:bg-gray-700 text-brand-text rounded-xl focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/80 mb-1">Phone</label>
                <input required type="tel" className="w-full px-4 py-3 border border-gray-700 bg-white dark:bg-gray-700 text-brand-text rounded-xl focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-brand-text/70 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-white bg-brand-gold hover:bg-brand-gold-dark rounded-xl font-medium shadow-lg shadow-brand-gold/20 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};