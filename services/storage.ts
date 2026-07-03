import { Product, Customer, Sale, AppSettings, User, ActivityLog } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const normalizeSettingsBranding = (settings: AppSettings): AppSettings => {
  if (settings.companyName === 'KRINAS TECH INVENTORY' || settings.companyName === 'Krinas Tech System') {
    return { ...settings, companyName: 'Krinas Tech' };
  }
  return settings;
};

// Map Product to DB columns (public.products from schema.ts)
const productToDb = (p: Product) => ({
  id: p.id,
  name: p.name,
  sku: p.sku || p.id,
  category: p.category || '',
  price: p.price || 0,
  stock: p.stock || 0,
  supplier: p.supplier || '',
  description: p.description || '',
  imageUrl: p.imageUrl || '',
  vendorPrice: p.vendorPrice || 0,
  lowStockThreshold: p.lowStockThreshold || 10,
  enableLowStockAlert: p.enableLowStockAlert ?? true,
  created_at: p.stockDate || new Date().toISOString()
});

// Map DB columns back to Product (from public.products)
const dbToProduct = (item: any): Product => ({
  id: item.id,
  name: item.name,
  sku: item.sku || '',
  category: item.category || '',
  price: item.price || 0,
  stock: item.stock || 0,
  lowStockThreshold: item.lowStockThreshold || 10,
  enableLowStockAlert: item.enableLowStockAlert ?? true,
  supplier: item.supplier || '',
  description: item.description || '',
  imageUrl: item.imageUrl || '',
  vendorPrice: item.vendorPrice || 0,
  stockDate: item.created_at || undefined
});

// --- API Implementation ---
export const api = {
  // Check if tables exist
  async checkDatabaseSchema(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
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

  // Database Seeding — never seed test data
  async seedDatabase(): Promise<void> {
    // intentionally no-op: no test data seeding
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data) {
           return (data as any[]).map(dbToProduct);
        }
      } catch (err) {
        console.warn("Failed to fetch products from DB");
      }
      return [];
    }
    return [];
  },

  async upsertProduct(product: Product): Promise<Product> {
    const dbProduct = { ...product };
    const payload = productToDb(dbProduct);

    if (isSupabaseConfigured()) {
      try {
        const { data: existing } = await supabase.from('products').select('id').eq('id', dbProduct.id).maybeSingle();
        if (existing) {
          const { error } = await supabase.from('products').update(payload).eq('id', dbProduct.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('products').insert(payload);
          if (error) throw error;
        }
      } catch (e) {
         console.warn("DB write failed for product", e);
         throw e; // propagate so UI shows the error
      }
    }
    return dbProduct;
  },

  async deleteProduct(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (e) { 
        console.warn("DB delete failed for product", e);
      }
    }
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data) {
           return (data as any[]).map(p => ({
             id: p.id,
             name: p.full_name || p.email || 'Unknown',
             email: p.email || '',
             phone: '',
             totalSpent: 0
           }));
        }
      } catch (e) { console.warn("Failed to fetch customers from DB"); }
      return [];
    }
    return [];
  },

  async upsertCustomer(customer: Customer): Promise<Customer> {
    if (isSupabaseConfigured()) {
       try { 
         const { error } = await supabase.from('profiles').upsert({ 
           id: customer.id, 
           full_name: customer.name, 
           email: customer.email 
         }); 
         if (error) throw error;
       } catch(e) {
         console.warn("DB write failed for customer", e);
       }
    }
    return customer;
  },

  async deleteCustomer(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
      } catch(e) {
        console.warn("DB delete failed for customer", e);
      }
    }
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('sales').select('*');
        if (!error && data) {
            return data as Sale[];
        }
      } catch(e) { console.warn("Failed to fetch sales from DB"); }
      return [];
    }
    return [];
  },

  async createSale(sale: Sale): Promise<Sale> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('sales').insert(sale);
        if (error) throw error;
      } catch (err) {
        console.warn("DB write failed for sale", err);
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
            return data as User[];
        }
      } catch(e) {}
    }
    return [];
  },

  async upsertUser(user: User): Promise<User> {
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('users').upsert(user);
        if (error) throw error;
      } catch(e) {
        console.warn("DB write failed for user", e);
      }
    }
    return user;
  },

  async deleteUser(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
      } catch(e) {
        console.warn("DB delete failed for user", e);
      }
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('settings').select('*').limit(1);
        if (!error && data && data.length > 0) {
            return normalizeSettingsBranding(data[0] as AppSettings);
        }
      } catch(e) {}
    }
    return normalizeSettingsBranding({
      companyName: 'Krinas Tech',
      email: 'admin@krinastech.com',
      phone: '+234 800 123 4567',
      address: '15, Victoria Island, Lagos, Nigeria',
      currencySymbol: '₦',
      taxRate: 7.5,
      logoUrl: '',
      receiptPrefix: 'REC',
      receiptIdDigits: 6
    });
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const normalized = normalizeSettingsBranding(settings);
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('settings').upsert({ id: 1, ...normalized });
        if (error) throw error;
      } catch(e) {
        console.warn("DB write failed for settings", e);
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
            return data as ActivityLog[];
        }
      } catch(e) {}
    }
    return [];
  },

  async createLog(log: ActivityLog): Promise<void> {
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase.from('activity_logs').insert(log);
        if (error) throw error;
      } catch(e) {
        console.warn("DB write failed for log", e);
      }
    }
  }
};

export const DEFAULTS = {
  PRODUCTS: [],
  CUSTOMERS: [],
  SALES: [],
  SETTINGS: {
    companyName: 'Krinas Tech',
    email: 'admin@krinastech.com',
    phone: '+234 800 123 4567',
    address: '15, Victoria Island, Lagos, Nigeria',
    currencySymbol: '₦',
    taxRate: 7.5,
    logoUrl: '',
    receiptPrefix: 'REC',
    receiptIdDigits: 6
  },
  USERS: []
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