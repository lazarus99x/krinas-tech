import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Product, Customer, Sale, CartItem, AppSettings, PaymentStatus, User, ActivityLog } from './types';
import { api, DEFAULTS, logActivity, syncOfflineData, getOfflineQueueCount, OFFLINE_QUEUE_CHANGED_EVENT } from './services/storage';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { PointOfSale } from './components/PointOfSale';
import { Customers } from './components/Customers';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { Staff } from './components/Staff';
import { CustomerDisplayScreen } from './components/CustomerDisplayScreen';
import { LayoutDashboard, Package, ShoppingCart, Users, Menu, Hexagon, FileText, Moon, Sun, Settings as SettingsIcon, X, LogOut, User as UserIcon, Shield, Bell, AlertCircle, WifiOff, Loader2, CloudOff, RefreshCw, Database, Copy, Check } from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from './services/schema';

const App = () => {
  const isCustomerDisplayRoute = typeof window !== 'undefined' && window.location.pathname === '/customer-display';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS.SETTINGS);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  // App State
  const [isLoading, setIsLoading] = useState(true);
  const [dbSetupRequired, setDbSetupRequired] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [networkError, setNetworkError] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Theme Management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Load Data Async
  const loadData = async () => {
    try {
      setNetworkError(false);

      if (isSupabaseConfigured() && navigator.onLine) {
          // Check if Schema exists
          const schemaExists = await api.checkDatabaseSchema();
          if (!schemaExists) {
              setDbSetupRequired(true);
              setIsLoading(false);
              return;
          }

          // If schema exists, attempt to seed if empty
          if (navigator.onLine) {
             await api.seedDatabase(); 
          }
      }

      const [prod, cust, sale, sett, usr, lg] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getSales(),
        api.getSettings(),
        api.getUsers(),
        api.getLogs()
      ]);
      
      setProducts(prod);
      setCustomers(cust);
      setSales(sale);
      setSettings(sett);
      setUsers(usr);
      setLogs(lg);
      
      // Check for unsynced items
      setOfflineQueueCount(getOfflineQueueCount());
    } catch (err) {
      console.error("Failed to load data", err);
      setNetworkError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRetryConnection = () => {
      setDbSetupRequired(false);
      setIsLoading(true);
      loadData();
  };

  // Auth Persistence
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    loadData();

    // Online/Offline Listeners
      const handleOnline = async () => {
       setNetworkError(false);
       if (isSupabaseConfigured()) {
         setIsSyncing(true);
         const synced = await syncOfflineData();
         await loadData();
         setIsSyncing(false);
         if (synced > 0) {
             alert(`Successfully synced ${synced} offline records.`);
         }
       } else {
         await loadData();
       }
    };
    const handleOffline = () => setNetworkError(true);
    const handleQueueChanged = (event: Event) => {
      const queueEvent = event as CustomEvent<number>;
      setOfflineQueueCount(queueEvent.detail ?? getOfflineQueueCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, handleQueueChanged as EventListener);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, handleQueueChanged as EventListener);
    };
  }, []);

  // Real-time Subscriptions (Supabase)
  useEffect(() => {
    if (!isSupabaseConfigured() || dbSetupRequired) return;

    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if(payload.eventType === 'INSERT') setProducts(prev => [...prev, payload.new as Product]);
        if(payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
        if(payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
        if(payload.eventType === 'INSERT') setSales(prev => [...prev, payload.new as Sale]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        if(payload.eventType === 'INSERT') setCustomers(prev => [...prev, payload.new as Customer]);
        if(payload.eventType === 'UPDATE') setCustomers(prev => prev.map(c => c.id === payload.new.id ? payload.new as Customer : c));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
        if(payload.eventType === 'UPDATE') setSettings(payload.new as AppSettings);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbSetupRequired]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.role === 'SALES_REP') setView(ViewState.SALES);
    else if (user.role === 'INVENTORY_REP') setView(ViewState.INVENTORY);
    else setView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    if (currentUser) {
      logActivity(currentUser, 'LOGOUT', 'User logged out');
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setIsProfileMenuOpen(false);
    setView(ViewState.DASHBOARD);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Handle Resize for Mobile Detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // CRUD Operations with Optimistic Updates & API calls
  const handleAddProduct = async (p: Product) => {
    if (currentUser) logActivity(currentUser, 'ADD_PRODUCT', `Added ${p.name}`);
    // Optimistic Update
    setProducts(prev => [...prev, p]);
    try {
      await api.upsertProduct(p);
    } catch {
      // Revert if failed (though now storage.ts handles fallback, this is mostly for critical errors)
      // For improved offline support we assume storage.ts handles persistence
    }
  };
  
  const handleUpdateProduct = async (p: Product) => {
    if (currentUser) logActivity(currentUser, 'UPDATE_PRODUCT', `Updated ${p.name}`);
    setProducts(prev => prev.map(prod => prod.id === p.id ? p : prod));
    await api.upsertProduct(p);
  };
  
  const handleDeleteProduct = async (id: string) => {
    const p = products.find(prod => prod.id === id);
    if (currentUser && p) logActivity(currentUser, 'DELETE_PRODUCT', `Deleted ${p.name}`);
    setProducts(prev => prev.filter(p => p.id !== id));
    await api.deleteProduct(id);
  };
  
  const handleAddCustomer = async (c: Customer) => {
    setCustomers(prev => [...prev, c]);
    await api.upsertCustomer(c);
  };
  
  const handleDeleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    await api.deleteCustomer(id);
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    if (currentUser) logActivity(currentUser, 'UPDATE_SETTINGS', 'Updated system settings');
    setSettings(newSettings);
    await api.saveSettings(newSettings);
  };

  // User Management
  const handleAddUser = async (u: User) => {
    if (currentUser) logActivity(currentUser, 'ADD_USER', `Created user ${u.name} (${u.role})`);
    setUsers(prev => [...prev, u]);
    await api.upsertUser(u);
  };

  const handleUpdateUser = async (u: User) => {
    if (currentUser) logActivity(currentUser, 'UPDATE_USER', `Updated user ${u.name}`);
    setUsers(prev => prev.map(user => user.id === u.id ? u : user));
    await api.upsertUser(u);
  };

  const handleDeleteUser = async (id: string) => {
    const u = users.find(user => user.id === id);
    if (currentUser && u) logActivity(currentUser, 'DELETE_USER', `Deleted user ${u.name}`);
    setUsers(prev => prev.filter(u => u.id !== id));
    await api.deleteUser(id);
  };

  const handleRecordSale = async (items: CartItem[], saleMeta: any) => {
    if (!currentUser) return;

    const getSaleItemPrice = (item: CartItem) => (
      item.unitType === 'pack' ? (item.pricePerPack || 0) : item.price
    );

    const getConsumedStock = (item: CartItem) => (
      item.unitType === 'pack' ? (item.quantityPerPack || 1) * item.cartQuantity : item.cartQuantity
    );

    const newSale: Sale = {
      id: saleMeta.receiptId || Date.now().toString(),
      date: new Date().toISOString(),
      customerId: saleMeta.customerId,
      customerName: saleMeta.customerId ? customers.find(c => c.id === saleMeta.customerId)?.name : 'Walk-in',
      customerPhone: saleMeta.customerId ? customers.find(c => c.id === saleMeta.customerId)?.phone : undefined,
      items: items.map(i => ({
        productId: i.id,
        productName: i.name,
        quantity: i.cartQuantity,
        priceAtSale: getSaleItemPrice(i),
        unitType: i.unitType
      })),
      totalAmount: saleMeta.total,
      amountPaid: saleMeta.amountPaid,
      balance: saleMeta.balance,
      paymentMethod: saleMeta.paymentMethod,
      status: saleMeta.status,
      dueDate: saleMeta.dueDate,
      notes: saleMeta.notes,
      staffId: currentUser.id,
      staffName: currentUser.name
    };
    
    logActivity(currentUser, 'SALE', `Recorded sale #${newSale.id} (${saleMeta.status}) - ₦${saleMeta.total.toLocaleString()}`);
    
    // Update local state first (Optimistic)
    setSales(prev => [...prev, newSale]);

    if (saleMeta.status !== 'FAILED') {
      const updatedProducts = products.map(p => {
        const soldItem = items.find(i => i.id === p.id);
        return soldItem ? { ...p, stock: p.stock - getConsumedStock(soldItem) } : p;
      });
      setProducts(updatedProducts);
      
      // Sync Stock updates to DB
      for (const p of updatedProducts) {
         if (items.some(i => i.id === p.id)) {
            api.upsertProduct(p);
         }
      }
    }

    if (saleMeta.customerId && saleMeta.status !== 'FAILED') {
      const targetCus = customers.find(c => c.id === saleMeta.customerId);
      if (targetCus) {
        const updatedCustomer = { ...targetCus, totalSpent: targetCus.totalSpent + saleMeta.total };
        setCustomers(prev => prev.map(c => c.id === saleMeta.customerId ? updatedCustomer : c));
        api.upsertCustomer(updatedCustomer);
      }
    }

    // Sync Sale to DB
    await api.createSale(newSale);
  };

  const handleExportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      settings,
      products,
      customers,
      sales,
      users,
      logs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `abr_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const NavItem = ({ viewTarget, icon: Icon, label, allowedRoles }: { viewTarget: ViewState, icon: any, label: string, allowedRoles: string[] }) => {
    if (currentUser && !allowedRoles.includes(currentUser.role)) return null;

    return (
      <button
        onClick={() => {
          setView(viewTarget);
          if (isMobile) setIsSidebarOpen(false);
        }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          view === viewTarget 
          ? 'bg-brand-gold text-white shadow-lg shadow-brand-gold/20' 
          : 'text-brand-muted hover:bg-white/5 hover:text-brand-text'
        }`}
      >
        <Icon size={20} className={view === viewTarget ? 'text-white' : 'text-brand-muted group-hover:text-brand-text'} />
        <span className={`font-medium ${!isSidebarOpen && !isMobile ? 'hidden' : 'block'}`}>{label}</span>
      </button>
    );
  };

  // Calculate notifications
  const lowStockProducts = products.filter(p => p.enableLowStockAlert && p.stock <= (p.lowStockThreshold || 10));

  // --- RENDER DB SETUP SCREEN IF TABLES MISSING ---
  if (dbSetupRequired) {
     return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 transition-colors font-sans">
            <div className="max-w-2xl w-full bg-brand-surface rounded-3xl shadow-2xl p-8 border border-gray-800">
               <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-16 h-16 bg-brand-gold/20 text-brand-gold rounded-full flex items-center justify-center mb-4">
                     <Database size={32} />
                  </div>
                  <h1 className="text-2xl font-bold text-brand-text">Database Setup Required</h1>
                  <p className="text-brand-muted mt-2 max-w-md">
                     The application cannot find the necessary tables in your Supabase project. 
                     Please run the SQL script below in your Supabase SQL Editor.
                  </p>
               </div>
               
               <div className="relative mb-6">
                  <div className="absolute top-3 right-3 z-10">
                     <button 
                                          onClick={handleCopyScript}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-brand-gold text-brand-bg text-xs font-bold rounded-lg hover:bg-brand-gold-light transition-colors"
                                       >
                                          {copied ? <Check size={14} /> : <Copy size={14} />}
                                          {copied ? 'Copied' : 'Copy SQL'}
                                       </button>
                                    </div>
                                    <pre className="w-full h-64 overflow-auto bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs font-mono text-brand-muted custom-scrollbar">
                     {SUPABASE_SCHEMA_SQL}
                  </pre>
               </div>
               
               <button 
                  onClick={handleRetryConnection}
                  className="w-full py-4 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold rounded-xl shadow-lg shadow-brand-gold/20 transition-all flex items-center justify-center gap-2"
               >
                  <RefreshCw size={20} /> Retry Connection
               </button>
            </div>
        </div>
     );
  }

  // --- RENDER LANDING PAGE IF NOT AUTHENTICATED ---
  if (isCustomerDisplayRoute) {
    return <CustomerDisplayScreen settings={settings} />;
  }

  if (!currentUser) {
    return <LandingPage onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />;
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden transition-colors duration-300 font-sans">
      
      {/* Mobile Sidebar Backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isSidebarOpen ? 'w-64 translate-x-0' : isMobile ? 'w-64 -translate-x-full' : 'w-20 translate-x-0'}
          bg-brand-surface h-full border-r border-gray-700 
          transition-all duration-300 ease-in-out flex flex-col no-print shadow-2xl lg:shadow-none
        `}
      >
        <div className="h-20 flex items-center px-6 border-b border-gray-800 justify-between">
          <div className={`flex items-center gap-2 text-brand-text overflow-hidden ${!isSidebarOpen && !isMobile ? 'justify-center w-full' : ''}`}>
            <div className="p-2 bg-brand-gold rounded-lg text-white shadow-lg shadow-brand-gold/20 shrink-0">
              <Hexagon size={24} fill="currentColor" />
            </div>
            {(isSidebarOpen || isMobile) && <span className="font-bold text-lg tracking-tight whitespace-nowrap">ABR TECHNOLOGIES LIMITED</span>}
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-brand-muted">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem viewTarget={ViewState.DASHBOARD} icon={LayoutDashboard} label="Overview" allowedRoles={['ADMIN']} />
          <NavItem viewTarget={ViewState.INVENTORY} icon={Package} label="Inventory" allowedRoles={['ADMIN', 'INVENTORY_REP']} />
          <NavItem viewTarget={ViewState.SALES} icon={ShoppingCart} label="Sales / POS" allowedRoles={['ADMIN', 'SALES_REP', 'INVENTORY_REP']} />
          <NavItem viewTarget={ViewState.CUSTOMERS} icon={Users} label="Customers" allowedRoles={['ADMIN', 'SALES_REP']} />
          <NavItem viewTarget={ViewState.REPORTS} icon={FileText} label="Reports" allowedRoles={['ADMIN']} />
          <NavItem viewTarget={ViewState.STAFF} icon={Shield} label="Staff" allowedRoles={['ADMIN']} />
          <NavItem viewTarget={ViewState.SETTINGS} icon={SettingsIcon} label="Settings" allowedRoles={['ADMIN']} />
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center ${isSidebarOpen || isMobile ? 'justify-start px-4' : 'justify-center'} py-2 rounded-xl text-brand-muted hover:bg-white/5 transition-colors`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {(isSidebarOpen || isMobile) && <span className="ml-3 font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white/80 bg-brand-surface/80 backdrop-blur-md border-b border-gray-700 flex items-center justify-between px-4 sm:px-8 z-10 no-print transition-colors duration-300 sticky top-0">
          <div className="flex items-center gap-3 lg:gap-4">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
               className="p-2 -ml-2 text-gray-700 dark:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
             >
               <Menu size={24} />
             </button>
            <h1 className="text-xl lg:text-2xl font-bold text-brand-text capitalize transition-colors truncate">
              {view === ViewState.DASHBOARD && 'Dashboard'}
              {view === ViewState.INVENTORY && 'Inventory'}
              {view === ViewState.SALES && 'Point of Sale'}
              {view === ViewState.CUSTOMERS && 'Customers'}
              {view === ViewState.REPORTS && 'Analytics'}
              {view === ViewState.SETTINGS && 'Settings'}
              {view === ViewState.STAFF && 'Staff Management'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isSyncing && (
                <div className="flex items-center space-x-2 bg-brand-gold/5 bg-brand-gold-dark/20 text-brand-gold text-brand-gold px-3 py-1.5 rounded-full text-xs font-medium">
                    <RefreshCw size={14} className="animate-spin" /> <span className="hidden sm:inline">Syncing...</span>
                </div>
            )}
            
            {offlineQueueCount > 0 && !isSyncing && (
                <div className="flex items-center space-x-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full text-xs font-medium" title={`${offlineQueueCount} unsynced items`}>
                    <CloudOff size={14} /> <span className="hidden sm:inline">{offlineQueueCount} Saved Offline</span>
                </div>
            )}
            
            {networkError && (
              <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full text-xs font-medium animate-pulse">
                <WifiOff size={14} /> <span className="hidden sm:inline">Offline Mode</span>
              </div>
            )}
            
            <div className={`hidden sm:flex items-center space-x-2 ${networkError ? 'opacity-50' : 'bg-white dark:bg-gray-700'} border border-gray-700 rounded-full px-3 py-1.5 shadow-sm`}>
              <div className={`w-2 h-2 rounded-full ${networkError ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}></div>
              <span className="text-xs font-medium text-brand-text/70">{networkError ? 'Connection Lost' : 'System Online'}</span>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-brand-text/70 hover:bg-white/5 rounded-lg transition-colors relative"
              >
                <Bell size={20} />
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-brand-surface rounded-xl shadow-xl border border-gray-800 overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                    <h3 className="font-semibold text-sm text-brand-text">Notifications</h3>
                    <span className="text-xs text-brand-muted">{lowStockProducts.length} Alerts</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map(p => (
                        <div key={p.id} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-3">
                           <div className="mt-1 text-red-500 shrink-0"><AlertCircle size={16} /></div>
                           <div>
                             <p className="text-sm font-medium text-brand-text/90 dark:text-gray-200">Low Stock Alert</p>
                             <p className="text-xs text-brand-muted mt-0.5">{p.name} is below threshold ({p.stock} remaining).</p>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-brand-muted">
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-gold/10 bg-brand-gold-dark text-brand-gold text-brand-gold flex items-center justify-center font-bold border-2 border-white dark:border-gray-600 shadow-sm">
                   {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-brand-text leading-none">{currentUser.name}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{currentUser.role.replace('_', ' ')}</p>
                </div>
              </button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-brand-surface rounded-xl shadow-xl border border-gray-800 overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-sm font-semibold text-brand-text">{currentUser.name}</p>
                    <p className="text-xs text-brand-muted truncate">{currentUser.email}</p>
                  </div>
                  <div className="p-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                       <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth pb-24 lg:pb-8 relative">
          
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/50 bg-brand-bg/50 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-brand-surface p-6 rounded-2xl shadow-xl flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-brand-gold animate-spin mb-2" />
                <p className="text-sm font-medium text-brand-text/70">Syncing data...</p>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto w-full">
            {view === ViewState.DASHBOARD && currentUser.role === 'ADMIN' && <Dashboard products={products} sales={sales} isDarkMode={isDarkMode} />}
            
            {view === ViewState.INVENTORY && (currentUser.role === 'ADMIN' || currentUser.role === 'INVENTORY_REP') && 
              <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
            
            {view === ViewState.SALES && 
              <PointOfSale products={products} customers={customers} onRecordSale={handleRecordSale} onAddCustomer={handleAddCustomer} settings={settings} currentUser={currentUser} sales={sales} />}
            
            {view === ViewState.CUSTOMERS && (currentUser.role === 'ADMIN' || currentUser.role === 'SALES_REP') && 
              <Customers customers={customers} onAddCustomer={handleAddCustomer} onDeleteCustomer={handleDeleteCustomer} />}
            
            {view === ViewState.REPORTS && currentUser.role === 'ADMIN' && <Reports sales={sales} isDarkMode={isDarkMode} settings={settings} />}
            
            {view === ViewState.STAFF && currentUser.role === 'ADMIN' && 
              <Staff users={users} logs={logs} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />}
            
            {view === ViewState.SETTINGS && currentUser.role === 'ADMIN' && (
              <Settings 
                settings={settings} 
                onSaveSettings={handleUpdateSettings} 
                isDarkMode={isDarkMode} 
                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                onExportData={handleExportData}
                onResetData={handleResetData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
