
import { Product, Customer, Sale, AppSettings, User, ActivityLog } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PRODUCTS: 'krinas_products',
  CUSTOMERS: 'krinas_customers',
  SALES: 'krinas_sales',
  SETTINGS: 'krinas_settings',
  USERS: 'krinas_users',
  LOGS: 'krinas_activity_logs',
  OFFLINE_QUEUE: 'Krinas_offline_action_queue',
  OFFLINE_SALES_LEGACY: 'krinas_offline_sales_queue' // For migration
};

const OFFLINE_QUEUE_EVENT = 'krinas:offline-queue-changed';

interface OfflineAction {
  id: string;
  table: 'products' | 'customers' | 'sales' | 'settings' | 'users' | 'activity_logs';
  operation: 'UPSERT' | 'INSERT' | 'DELETE';
  payload: any;
  timestamp: number;
}

// Initial Mock Data (Fallback - Only used when NO Database is connected OR DB is empty for Users)
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'iPhone 15 Pro Max', sku: 'APL-IP15PM-256', category: 'Smartphones', price: 1200000.00, vendorPrice: 1050000.00, pricePerPack: 0, quantityPerPack: 1, stock: 25, lowStockThreshold: 5, enableLowStockAlert: true, supplier: 'Apple Inc.', imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Samsung Galaxy S24 Ultra', sku: 'SS-GS24U-512', category: 'Smartphones', price: 1050000.00, vendorPrice: 920000.00, pricePerPack: 0, quantityPerPack: 1, stock: 18, lowStockThreshold: 5, enableLowStockAlert: true, supplier: 'Samsung Electronics', imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'MacBook Pro 16" M3 Max', sku: 'APL-MBP16-M3', category: 'Laptops', price: 2500000.00, vendorPrice: 2200000.00, pricePerPack: 0, quantityPerPack: 1, stock: 10, lowStockThreshold: 3, enableLowStockAlert: true, supplier: 'Apple Inc.', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Sony WH-1000XM5', sku: 'SON-WHXM5-BLK', category: 'Audio', price: 350000.00, vendorPrice: 280000.00, pricePerPack: 0, quantityPerPack: 1, stock: 40, lowStockThreshold: 8, enableLowStockAlert: true, supplier: 'Sony Corp', imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=400' },
  { id: '5', name: 'iPad Air M2', sku: 'APL-IPAIR-M2', category: 'Tablets', price: 650000.00, vendorPrice: 550000.00, pricePerPack: 0, quantityPerPack: 1, stock: 22, lowStockThreshold: 5, enableLowStockAlert: true, supplier: 'Apple Inc.', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400' },
  { id: '6', name: 'Dell XPS 15', sku: 'DELL-XPS15-9530', category: 'Laptops', price: 1800000.00, vendorPrice: 1550000.00, pricePerPack: 0, quantityPerPack: 1, stock: 7, lowStockThreshold: 3, enableLowStockAlert: true, supplier: 'Dell Technologies', imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=400' },
  { id: '7', name: 'AirPods Pro 2nd Gen', sku: 'APL-AIRP-PRO2', category: 'Audio', price: 180000.00, vendorPrice: 145000.00, pricePerPack: 0, quantityPerPack: 1, stock: 55, lowStockThreshold: 10, enableLowStockAlert: false, supplier: 'Apple Inc.', imageUrl: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?auto=format&fit=crop&q=80&w=400' },
  { id: '8', name: 'PlayStation 5 Slim', sku: 'SON-PS5-SLIM', category: 'Gaming', price: 450000.00, vendorPrice: 380000.00, pricePerPack: 0, quantityPerPack: 1, stock: 12, lowStockThreshold: 4, enableLowStockAlert: true, supplier: 'Sony Interactive', imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400' },
  { id: '9', name: 'Canon EOS R50', sku: 'CN-EOSR50-24', category: 'Cameras', price: 750000.00, vendorPrice: 620000.00, pricePerPack: 0, quantityPerPack: 1, stock: 9, lowStockThreshold: 3, enableLowStockAlert: true, supplier: 'Canon Inc.', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400' },
  { id: '10', name: 'Samsung 49\\" Odyssey G9', sku: 'SS-ODG9-49', category: 'Monitors', price: 850000.00, vendorPrice: 700000.00, pricePerPack: 0, quantityPerPack: 1, stock: 6, lowStockThreshold: 3, enableLowStockAlert: true, supplier: 'Samsung Electronics', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400' },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'The Royal Hotel', email: 'procurement@royalhotel.com', phone: '080-1234-5678', totalSpent: 5500000 },
  { id: '2', name: 'Lagos Island Club', email: 'manager@islandclub.ng', phone: '081-9876-5432', totalSpent: 12450000 },
  { id: '3', name: 'Mr. Emmanuel Okonkwo', email: 'emmanuel.o@gmail.com', phone: '070-5555-4444', totalSpent: 850000 },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'System Admin', email: 'admin@krinastech.com', password: 'password', role: 'ADMIN', isActive: true },
  { id: 'u2', name: 'John Sales', email: 'sales@krinastech.com', password: 'password', role: 'SALES_REP', isActive: true },
  { id: 'u3', name: 'Sarah Stock', email: 'stock@@krinastech.com', password: 'password', role: 'INVENTORY_REP', isActive: true },
];

const INITIAL_SALES: Sale[] = [
  {
    id: 's1',
    date: new Date(Date.now() - 172800000).toISOString(),
    customerName: 'The Royal Hotel',
    items: [{ productId: '1', productName: 'Moët & Chandon Imperial', quantity: 12, priceAtSale: 65000.00, unitType: 'piece' }],
    totalAmount: 780000.00,
    amountPaid: 780000.00,
    balance: 0,
    paymentMethod: 'TRANSFER',
    status: 'PAID',
    staffId: 'u1',
    staffName: 'System Admin'
  },
  {
    id: 's2',
    date: new Date(Date.now() - 86400000).toISOString(),
    customerName: 'Lagos Island Club',
    items: [
        { productId: '7', productName: 'Coca-Cola (Crate)', quantity: 20, priceAtSale: 4500.00, unitType: 'piece' },
        { productId: '8', productName: 'Heineken Lager (Case)', quantity: 15, priceAtSale: 12000.00, unitType: 'piece' }
    ],
    totalAmount: 270000.00,
    amountPaid: 270000.00,
    balance: 0,
    paymentMethod: 'CASH',
    status: 'PAID',
    staffId: 'u2',
    staffName: 'John Sales'
  },
   {
    id: 's3',
    date: new Date().toISOString(),
    customerName: 'Mr. Emmanuel Okonkwo',
    items: [
        { productId: '6', productName: 'Dom Pérignon Vintage', quantity: 2, priceAtSale: 250000.00, unitType: 'piece' },
        { productId: '2', productName: 'Hennessy V.S.O.P', quantity: 1, priceAtSale: 85500.00, unitType: 'piece' }
    ],
    totalAmount: 585500.00,
    amountPaid: 585500.00,
    balance: 0,
    paymentMethod: 'TRANSFER',
    status: 'PAID',
    staffId: 'u1',
    staffName: 'System Admin'
  }
];

const INITIAL_SETTINGS: AppSettings = {
  companyName: 'Krinas Tech',
  email: 'admin@krinastech.com',
  phone: '+234 800 123 4567',
  address: '15, Victoria Island, Lagos, Nigeria',
  currencySymbol: '₦',
  taxRate: 7.5,
  logoUrl: '',
  receiptPrefix: 'REC',
  receiptIdDigits: 6
};

// --- API Implementation ---

const getLocalStorage = <T>(key: string, defaultVal: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch (error) {
    console.warn(`Failed to read local storage key "${key}"`, error);
    return defaultVal;
  }
};

const setLocalStorage = <T>(key: string, val: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (error) {
    console.warn(`Failed to write local storage key "${key}"`, error);
  }
};

const normalizeSettingsBranding = (settings: AppSettings): AppSettings => {
  if (settings.companyName === 'KRINAS TECH INVENTORY' || settings.companyName === 'Krinas Tech System') {
    return { ...settings, companyName: 'Krinas Tech' };
  }
  return settings;
};

// Queue Management
const getQueue = () => getLocalStorage<OfflineAction[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
const emitQueueCount = (count: number) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT, { detail: count }));
  }
};
const setQueue = (q: OfflineAction[]) => {
  setLocalStorage(STORAGE_KEYS.OFFLINE_QUEUE, q);
  emitQueueCount(q.length);
};

const getEntityId = (payload: any) => payload?.id;

const queueAction = (table: OfflineAction['table'], operation: OfflineAction['operation'], payload: any) => {
  const queue = getQueue();
  const entityId = getEntityId(payload);

  if (entityId) {
    const lastMatchingIndex = [...queue].reverse().findIndex(existing =>
      existing.table === table && getEntityId(existing.payload) === entityId
    );

    if (lastMatchingIndex !== -1) {
      const actualIndex = queue.length - 1 - lastMatchingIndex;
      const lastMatchingAction = queue[actualIndex];

      if (operation === 'UPSERT' && lastMatchingAction.operation === 'UPSERT') {
        const nextQueue = [...queue];
        nextQueue[actualIndex] = { ...lastMatchingAction, payload, timestamp: Date.now() };
        setQueue(nextQueue);
        return;
      }

      if (operation === 'INSERT' && lastMatchingAction.operation === 'INSERT') {
        const nextQueue = [...queue];
        nextQueue[actualIndex] = { ...lastMatchingAction, payload, timestamp: Date.now() };
        setQueue(nextQueue);
        return;
      }

      if (operation === 'DELETE') {
        const nextQueue = queue.filter(existing =>
          !(existing.table === table && getEntityId(existing.payload) === entityId)
        );

        if (lastMatchingAction.operation === 'INSERT') {
          setQueue(nextQueue);
          return;
        }

        const deleteAction: OfflineAction = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          table,
          operation,
          payload,
          timestamp: Date.now()
        };
        setQueue([...nextQueue, deleteAction]);
        return;
      }
    }
  }

  const action: OfflineAction = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    table,
    operation,
    payload,
    timestamp: Date.now()
  };
  setQueue([...queue, action]);
};

// Sync Logic
export const syncOfflineData = async (): Promise<number> => {
    if (!isSupabaseConfigured() || !navigator.onLine) return 0;
    
    // Migration: Check for legacy sales queue
    const legacySales = getLocalStorage<Sale[]>(STORAGE_KEYS.OFFLINE_SALES_LEGACY, []);
    if (legacySales.length > 0) {
        for (const s of legacySales) {
            queueAction('sales', 'INSERT', s);
        }
        localStorage.removeItem(STORAGE_KEYS.OFFLINE_SALES_LEGACY);
    }

    const queue = getQueue();
    if (queue.length === 0) return 0;

    const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);
    const failedActions: OfflineAction[] = [];
    let syncedCount = 0;

    for (const action of sortedQueue) {
        try {
            if (action.operation === 'UPSERT') {
                const { error } = await supabase.from(action.table).upsert(action.payload);
                if (error) throw error;
            } else if (action.operation === 'INSERT') {
                // Idempotency check for sales to avoid double-insertion on partial failures
                if (action.table === 'sales') {
                     const { data } = await supabase.from('sales').select('id').eq('id', action.payload.id).maybeSingle();
                     if (!data) {
                         const { error } = await supabase.from('sales').insert(action.payload);
                         if (error) throw error;
                     }
                } else {
                     const { error } = await supabase.from(action.table).insert(action.payload);
                     if (error) throw error;
                }
            } else if (action.operation === 'DELETE') {
                const { error } = await supabase.from(action.table).delete().eq('id', action.payload.id);
                if (error) throw error;
            }
            syncedCount++;
        } catch (e) {
            console.error(`Failed to sync action ${action.id}:`, e);
            failedActions.push(action);
        }
    }
    
    setQueue(failedActions);
    return syncedCount;
}

export const getOfflineQueueCount = (): number => {
    return getQueue().length;
}

export const OFFLINE_QUEUE_CHANGED_EVENT = OFFLINE_QUEUE_EVENT;

// Helpers for Data Loading
const getSafeDefault = <T>(dummyData: T): T => {
    return isSupabaseConfigured() ? ([] as unknown as T) : dummyData;
}

export const api = {
  // Check if tables exist
  async checkDatabaseSchema(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    // Attempt to select from products. If 42P01 error (undefined table), return false.
    try {
        const { error } = await supabase.from('products').select('id').limit(1);
        if (error && error.code === '42P01') {
            return false;
        }
        return true;
    } catch(e) {
        return false;
    }
  },

  // Database Seeding
  async seedDatabase(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    try {
      const { data: pData, error } = await supabase.from('products').select('id').limit(1);
      if (error && error.code === '42P01') return; // Schema missing, app will handle

      if (!pData || pData.length === 0) {
          console.log("Seeding Products...");
          await supabase.from('products').insert(INITIAL_PRODUCTS);
      }

      const { data: cData } = await supabase.from('customers').select('id').limit(1);
      if (!cData || cData.length === 0) {
           console.log("Seeding Customers...");
           await supabase.from('customers').insert(INITIAL_CUSTOMERS);
      }

      const { data: uData } = await supabase.from('users').select('id').limit(1);
      if (!uData || uData.length === 0) {
           console.log("Seeding Users...");
           await supabase.from('users').insert(INITIAL_USERS);
      }
      
      const { data: sData } = await supabase.from('sales').select('id').limit(1);
      if (!sData || sData.length === 0) {
           console.log("Seeding Sales...");
           await supabase.from('sales').insert(INITIAL_SALES);
      }
      
      const { data: settData } = await supabase.from('settings').select('id').limit(1);
      if (!settData || settData.length === 0) {
           console.log("Seeding Settings...");
           await supabase.from('settings').insert(INITIAL_SETTINGS);
      }

    } catch (err) {
      console.error("Seeding failed", err);
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data) {
           setLocalStorage(STORAGE_KEYS.PRODUCTS, data as unknown as Product[]);
           return data as unknown as Product[];
        }
      } catch (err) {
        console.warn("Offline: Fetching products from local cache");
      }
      // Return local cache, defaulting to empty if DB is configured (No dummy data)
      return getLocalStorage(STORAGE_KEYS.PRODUCTS, [] as Product[]);
    }
    // Only use dummy data if NO DB is configured
    return getLocalStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  async upsertProduct(product: Product): Promise<Product> {
    const currentDefaults = isSupabaseConfigured() ? [] : INITIAL_PRODUCTS;
    const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, currentDefaults);
    
    const existingIndex = products.findIndex(p => p.id === product.id);
    const newProducts = [...products];
    if (existingIndex >= 0) newProducts[existingIndex] = product;
    else newProducts.push(product);
    setLocalStorage(STORAGE_KEYS.PRODUCTS, newProducts);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('products').upsert(product);
        if (error) throw error;
      } catch (e) {
         console.warn("Offline: Queuing product update");
         queueAction('products', 'UPSERT', product);
      }
    }
    return product;
  },

  async deleteProduct(id: string): Promise<void> {
    const currentDefaults = isSupabaseConfigured() ? [] : INITIAL_PRODUCTS;
    const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, currentDefaults);
    setLocalStorage(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id));

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (e) { 
        console.warn("Offline: Queuing product deletion");
        queueAction('products', 'DELETE', { id });
      }
    }
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('customers').select('*');
        if (!error && data) {
           setLocalStorage(STORAGE_KEYS.CUSTOMERS, data);
           return data as Customer[];
        }
      } catch (e) { console.warn("Offline: Fetching customers from local cache"); }
      return getLocalStorage(STORAGE_KEYS.CUSTOMERS, [] as Customer[]);
    }
    return getLocalStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  async upsertCustomer(customer: Customer): Promise<Customer> {
    const currentDefaults = isSupabaseConfigured() ? [] : INITIAL_CUSTOMERS;
    const customers = getLocalStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, currentDefaults);
    
    const index = customers.findIndex(c => c.id === customer.id);
    const newCustomers = [...customers];
    if (index >= 0) newCustomers[index] = customer;
    else newCustomers.push(customer);
    setLocalStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);

    if (isSupabaseConfigured()) {
       try { 
         const { error } = await supabase.from('customers').upsert(customer); 
         if (error) throw error;
       } catch(e) {
         queueAction('customers', 'UPSERT', customer);
       }
    }
    return customer;
  },

  async deleteCustomer(id: string): Promise<void> {
    const currentDefaults = isSupabaseConfigured() ? [] : INITIAL_CUSTOMERS;
    const customers = getLocalStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, currentDefaults);
    setLocalStorage(STORAGE_KEYS.CUSTOMERS, customers.filter(c => c.id !== id));

    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
      } catch(e) {
        queueAction('customers', 'DELETE', { id });
      }
    }
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('sales').select('*');
        if (!error && data) {
            setLocalStorage(STORAGE_KEYS.SALES, data);
            return data as Sale[];
        }
      } catch(e) { console.warn("Offline: Fetching sales from local cache"); }
      return getLocalStorage(STORAGE_KEYS.SALES, [] as Sale[]);
    }
    return getLocalStorage(STORAGE_KEYS.SALES, INITIAL_SALES);
  },

  async createSale(sale: Sale): Promise<Sale> {
    const currentDefaults = isSupabaseConfigured() ? [] : INITIAL_SALES;
    const sales = getLocalStorage<Sale[]>(STORAGE_KEYS.SALES, currentDefaults);
    setLocalStorage(STORAGE_KEYS.SALES, [...sales, sale]);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('sales').insert(sale);
        if (error) throw error;
      } catch (err) {
        console.warn("Offline: Queuing sale for sync");
        queueAction('sales', 'INSERT', sale);
      }
    }
    return sale;
  },

  // Users
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data && data.length > 0) {
            setLocalStorage(STORAGE_KEYS.USERS, data);
            return data as User[];
        }
      } catch(e) {}
    }
    
    const localUsers = getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
    if (!localUsers || localUsers.length === 0) {
        return INITIAL_USERS;
    }
    return localUsers;
  },

  async upsertUser(user: User): Promise<User> {
    const currentDefaults = isSupabaseConfigured() ? [] : INITIAL_USERS;
    const users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, currentDefaults);
    const index = users.findIndex(u => u.id === user.id);
    const newUsers = [...users];
    if (index >= 0) newUsers[index] = user;
    else newUsers.push(user);
    setLocalStorage(STORAGE_KEYS.USERS, newUsers);

    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('users').upsert(user);
        if (error) throw error;
      } catch(e) {
        queueAction('users', 'UPSERT', user);
      }
    }
    return user;
  },

  async deleteUser(id: string): Promise<void> {
    const currentDefaults = isSupabaseConfigured() ? [] : INITIAL_USERS;
    const users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, currentDefaults);
    setLocalStorage(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));

    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
      } catch(e) {
        queueAction('users', 'DELETE', { id });
      }
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('settings').select('*').single();
        if (!error && data) {
            const normalized = normalizeSettingsBranding(data as AppSettings);
            setLocalStorage(STORAGE_KEYS.SETTINGS, normalized);
            return normalized;
        }
      } catch(e) {}
    }
    return normalizeSettingsBranding(getLocalStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const normalized = normalizeSettingsBranding(settings);
    setLocalStorage(STORAGE_KEYS.SETTINGS, normalized);
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('settings').upsert({ id: 1, ...normalized });
        if (error) throw error;
      } catch(e) {
        queueAction('settings', 'UPSERT', { id: 1, ...normalized });
      }
    }
    return normalized;
  },

  // Logs
  async getLogs(): Promise<ActivityLog[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(1000);
        if (!error && data) {
            setLocalStorage(STORAGE_KEYS.LOGS, data);
            return data as ActivityLog[];
        }
      } catch(e) {}
    }
    return getLocalStorage(STORAGE_KEYS.LOGS, []);
  },

  async createLog(log: ActivityLog): Promise<void> {
    const logs = getLocalStorage<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
    setLocalStorage(STORAGE_KEYS.LOGS, [log, ...logs].slice(0, 1000));
    
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('activity_logs').insert(log);
        if (error) throw error;
      } catch(e) {
        queueAction('activity_logs', 'INSERT', log);
      }
    }
  }
};

export const DEFAULTS = {
  PRODUCTS: isSupabaseConfigured() ? [] : INITIAL_PRODUCTS,
  CUSTOMERS: isSupabaseConfigured() ? [] : INITIAL_CUSTOMERS,
  SALES: isSupabaseConfigured() ? [] : INITIAL_SALES,
  SETTINGS: INITIAL_SETTINGS,
  USERS: isSupabaseConfigured() ? [] : INITIAL_USERS
};

export const logActivity = async (user: User, action: string, details: string) => {
  const newLog: ActivityLog = {
    id: Date.now().toString(),
    userId: user.id,
    userName: user.name,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  await api.createLog(newLog);
};

export const loadProducts = () => getLocalStorage(STORAGE_KEYS.PRODUCTS, isSupabaseConfigured() ? [] : INITIAL_PRODUCTS);
export const loadCustomers = () => getLocalStorage(STORAGE_KEYS.CUSTOMERS, isSupabaseConfigured() ? [] : INITIAL_CUSTOMERS);
export const loadSales = () => getLocalStorage(STORAGE_KEYS.SALES, isSupabaseConfigured() ? [] : INITIAL_SALES);
export const loadSettings = () => getLocalStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
export const loadUsers = () => getLocalStorage(STORAGE_KEYS.USERS, isSupabaseConfigured() ? [] : INITIAL_USERS);
export const loadLogs = () => getLocalStorage(STORAGE_KEYS.LOGS, []);
