import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { 
  Save, Building2, Globe, Shield, Database, Download, Trash2, 
  Moon, Sun, Bell, CreditCard, RotateCcw, AlertTriangle, Image as ImageIcon, Upload, FileText 
} from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onExportData: () => void;
  onResetData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onSaveSettings, 
  isDarkMode, 
  onToggleTheme, 
  onExportData, 
  onResetData 
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSaveStatus('idle');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit
        alert("File size too large. Please upload an image under 500KB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleChange('logoUrl', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    // Simulate API delay
    setTimeout(() => {
      onSaveSettings(formData);
      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-brand-text">Settings</h2>
           <p className="text-brand-muted text-sm">Manage organization details and system preferences.</p>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg text-sm font-medium animate-pulse w-full md:w-auto justify-center">
            <AlertTriangle size={16} /> Unsaved changes
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Profile */}
        <div className="bg-brand-surface rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-50/50 dark:bg-gray-700/50 flex items-center gap-2">
            <Building2 size={20} className="text-brand-muted" />
            <h3 className="font-semibold text-brand-text">Organization Profile</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Logo Upload Section */}
            <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-6 items-start sm:items-center p-4 border border-dashed border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-700/20">
              <div className="w-24 h-24 rounded-xl bg-white dark:bg-gray-700 border border-gray-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm mx-auto sm:mx-0">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Company Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="text-gray-300 dark:text-gray-500" size={32} />
                )}
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                <h4 className="font-medium text-brand-text mb-1">Company Logo</h4>
                <p className="text-sm text-brand-muted mb-3">Upload your company logo to appear on receipts and reports. Max 500KB.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                  <label className="cursor-pointer px-4 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors flex items-center justify-center gap-2">
                    <Upload size={16} /> Upload Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                  {formData.logoUrl && (
                    <button 
                      type="button" 
                      onClick={() => handleChange('logoUrl', '')}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-brand-text/80 mb-2">Company Name</label>
              <input 
                type="text" 
                required
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none text-brand-text transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text/80 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none text-brand-text transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text/80 mb-2">Phone Number</label>
              <input 
                type="text" 
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none text-brand-text transition-colors"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-brand-text/80 mb-2">Business Address</label>
              <textarea 
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none text-brand-text transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Regional & Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Finance Settings */}
          <div className="bg-brand-surface rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-50/50 dark:bg-gray-700/50 flex items-center gap-2">
              <Globe size={20} className="text-brand-muted" />
              <h3 className="font-semibold text-brand-text">Regional & Finance</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text/80 mb-2">Currency Symbol</label>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                   {['₦', '$', '€', '£'].map(symbol => (
                     <button
                        key={symbol}
                        type="button"
                        onClick={() => handleChange('currencySymbol', symbol)}
                        className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border font-bold text-lg transition-all ${
                          formData.currencySymbol === symbol 
                          ? 'bg-brand-gold text-white border-blue-600 shadow-lg shadow-brand-gold/20' 
                          : 'bg-white dark:bg-gray-700 text-brand-text/80 border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                     >
                       {symbol}
                     </button>
                   ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/80 mb-2">Default Tax Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  value={formData.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none text-brand-text transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Receipt Configuration */}
          <div className="bg-brand-surface rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-50/50 dark:bg-gray-700/50 flex items-center gap-2">
              <FileText size={20} className="text-brand-muted" />
              <h3 className="font-semibold text-brand-text">Receipt Configuration</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text/80 mb-2">Receipt Prefix</label>
                <input 
                  type="text" 
                  placeholder="e.g. REC-"
                  value={formData.receiptPrefix || ''}
                  onChange={(e) => handleChange('receiptPrefix', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none text-brand-text transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/80 mb-2">Sequence Digits</label>
                <input 
                  type="number" 
                  min="3"
                  max="10"
                  value={formData.receiptIdDigits || 6}
                  onChange={(e) => handleChange('receiptIdDigits', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none text-brand-text transition-colors"
                />
                <p className="text-xs text-brand-muted mt-2">Example ID: {formData.receiptPrefix || 'REC'}-{String(1).padStart(formData.receiptIdDigits || 6, '0')}</p>
              </div>
            </div>
          </div>

          {/* System Appearance */}
          <div className="bg-brand-surface rounded-2xl shadow-sm border border-gray-800 overflow-hidden lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-50/50 dark:bg-gray-700/50 flex items-center gap-2">
              <Shield size={20} className="text-brand-muted" />
              <h3 className="font-semibold text-brand-text">System Preferences</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-brand-text">Dark Mode</p>
                  <p className="text-sm text-brand-muted">Switch between light and dark themes</p>
                </div>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isDarkMode ? 'bg-brand-gold' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between opacity-60 pointer-events-none">
                <div>
                  <p className="font-medium text-brand-text">Email Notifications</p>
                  <p className="text-sm text-brand-muted">Receive daily summary reports</p>
                </div>
                 <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end pt-4">
           <button 
             type="submit" 
             disabled={!isDirty || saveStatus === 'saving'}
             className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium shadow-lg transition-all ${
               isDirty 
               ? 'bg-brand-gold hover:bg-brand-gold-dark text-white shadow-brand-gold/20' 
               : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'
             }`}
           >
             {saveStatus === 'saving' ? (
               <RotateCcw className="animate-spin" size={18} />
             ) : (
               <Save size={18} />
             )}
             {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Changes Saved' : 'Save Changes'}
           </button>
        </div>
      </form>

      {/* Danger Zone / Data Management */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-brand-text mb-4">Data Management</h3>
        <div className="bg-brand-surface rounded-2xl shadow-sm border border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-start gap-4">
               <div className="p-3 bg-brand-gold/5 bg-brand-gold-dark/20 text-brand-gold text-brand-gold rounded-xl">
                 <Download size={24} />
               </div>
               <div>
                 <h4 className="font-semibold text-brand-text">Export Database</h4>
                 <p className="text-sm text-brand-muted">Download a full JSON backup of products, sales, and customers.</p>
               </div>
             </div>
             <button 
               onClick={onExportData}
               className="w-full md:w-auto px-4 py-3 bg-white dark:bg-gray-700 border border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium rounded-xl transition-colors whitespace-nowrap"
             >
               Backup Data
             </button>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-red-50/50 dark:bg-red-900/5">
             <div className="flex items-start gap-4">
               <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                 <Trash2 size={24} />
               </div>
               <div>
                 <h4 className="font-semibold text-brand-text">Factory Reset</h4>
                 <p className="text-sm text-brand-muted">Permanently delete all data and reset system to default state.</p>
               </div>
             </div>
             
             {!showResetConfirm ? (
               <button 
                 onClick={() => setShowResetConfirm(true)}
                 className="w-full md:w-auto px-4 py-3 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-xl transition-colors whitespace-nowrap"
               >
                 Reset Data
               </button>
             ) : (
               <div className="flex flex-col sm:flex-row items-center gap-2 animate-fade-in w-full md:w-auto">
                  <span className="text-sm text-red-600 font-medium mb-2 sm:mb-0">Are you sure?</span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={onResetData} 
                      className="flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-red-500/30 transition-colors"
                    >
                      Yes, Delete
                    </button>
                    <button 
                      onClick={() => setShowResetConfirm(false)} 
                      className="flex-1 sm:flex-none px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
               </div>
             )}
          </div>

        </div>
      </div>
      
      <div className="text-center pt-8 text-xs text-gray-400">
         <p>Krinas Tech v1.0.2</p>
      </div>

    </div>
  );
};
