1|import { Product, Customer, Sale, AppSettings, User, ActivityLog } from '../types';
2|import { supabase, isSupabaseConfigured } from './supabase';
3|
4|const normalizeSettingsBranding = (settings: AppSettings): AppSettings => {
5|  if (settings.companyName === 'KRINAS TECH INVENTORY' || settings.companyName === 'Krinas Tech System') {
6|    return { ...settings, companyName: 'Krinas Tech' };
7|  }
8|  return settings;
9|};
10|
11|// Map Product to DB columns (items table)
12|const productToDb = (p: Product) => ({
13|  id: p.id,
14|  name: p.name,
15|  sku: p.sku || p.id,
16|  description: p.description || '',
17|  category: p.category || '',
18|  quantity: p.stock,
19|  price: p.price || 0,
20|  cost: p.vendorPrice || 0,
21|  supplier: p.supplier || '',
22|  image_url: p.imageUrl || '',
23|  reorder_point: p.lowStockThreshold || 10,
24|  created_at: p.stockDate || new Date().toISOString()
25|});
26|
27|// Map DB columns back to Product (from items table)
28|const dbToProduct = (item: any): Product => ({
29|  id: item.id,
30|  name: item.name,
31|  sku: item.sku || '',
32|  category: item.category || '',
33|  price: item.price || 0,
34|  stock: item.quantity || 0,
35|  lowStockThreshold: item.reorder_point || 10,
36|  enableLowStockAlert: true,
37|  supplier: item.supplier || '',
38|  description: item.description || '',
39|  imageUrl: item.image_url || '',
40|  vendorPrice: item.cost || 0,
41|  stockDate: item.created_at || undefined
42|});
43|
44|// --- API Implementation ---
45|export const api = {
46|  // Check if tables exist
47|  async checkDatabaseSchema(): Promise<boolean> {
48|    if (!isSupabaseConfigured()) return false;
49|    try {
50|        const { error } = await supabase.from('items').select('id').limit(1);
51|        if (error && error.code === '42P01') {
52|            return false;
53|        }
54|        return true;
55|    } catch(e) {
56|        return false;
57|    }
58|  },
59|
// Database Seeding — seed default users only
  async seedDatabase(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: uData } = await supabase.from('users').select('id').limit(1);
      if (!uData || uData.length === 0) {
        console.log("Seeding default users...");
        await supabase.from('users').insert([
          { id: 'u1', name: 'System Admin', email: 'admin@krinastech.com', password: 'password', role: 'ADMIN', isActive: true },
          { id: 'u2', name: 'John Sales', email: 'sales@krinastech.com', password: 'password', role: 'SALES_REP', isActive: true },
          { id: 'u3', name: 'Sarah Stock', email: 'stock@krinastech.com', password: 'password', role: 'INVENTORY_REP', isActive: true }
        ]);
      }
    } catch (err) {
      console.warn("User seeding skipped or failed", err);
    }
  },
64|
65|  // Products
66|  async getProducts(): Promise<Product[]> {
67|    if (isSupabaseConfigured()) {
68|      try {
69|        const { data, error } = await supabase.from('items').select('*');
70|        if (!error && data) {
71|           return (data as any[]).map(dbToProduct);
72|        }
73|      } catch (err) {
74|        console.warn("Failed to fetch products from DB");
75|      }
76|      return [];
77|    }
78|    return [];
79|  },
80|
81|  async upsertProduct(product: Product): Promise<Product> {
82|    const dbProduct = { ...product };
83|    const payload = productToDb(dbProduct);
84|
85|    if (isSupabaseConfigured()) {
86|      try {
87|        const { data: existing } = await supabase.from('items').select('id').eq('id', dbProduct.id).maybeSingle();
88|        if (existing) {
89|          const { error } = await supabase.from('items').update(payload).eq('id', dbProduct.id);
90|          if (error) throw error;
91|        } else {
92|          const { error } = await supabase.from('items').insert(payload);
93|          if (error) throw error;
94|        }
95|      } catch (e) {
96|         console.warn("DB write failed for product", e);
97|         throw e; // propagate so UI shows the error
98|      }
99|    }
100|    return dbProduct;
101|  },
102|
103|  async deleteProduct(id: string): Promise<void> {
104|    if (isSupabaseConfigured()) {
105|      try {
106|        const { error } = await supabase.from('items').delete().eq('id', id);
107|        if (error) throw error;
108|      } catch (e) { 
109|        console.warn("DB delete failed for product", e);
110|      }
111|    }
112|  },
113|
114|  // Customers
115|  async getCustomers(): Promise<Customer[]> {
116|    if (isSupabaseConfigured()) {
117|      try {
118|        const { data, error } = await supabase.from('profiles').select('*');
119|        if (!error && data) {
120|           return (data as any[]).map(p => ({
121|             id: p.id,
122|             name: p.full_name || p.email || 'Unknown',
123|             email: p.email || '',
124|             phone: '',
125|             totalSpent: 0
126|           }));
127|        }
128|      } catch (e) { console.warn("Failed to fetch customers from DB"); }
129|      return [];
130|    }
131|    return [];
132|  },
133|
134|  async upsertCustomer(customer: Customer): Promise<Customer> {
135|    if (isSupabaseConfigured()) {
136|       try { 
137|         const { error } = await supabase.from('profiles').upsert({ 
138|           id: customer.id, 
139|           full_name: customer.name, 
140|           email: customer.email 
141|         }); 
142|         if (error) throw error;
143|       } catch(e) {
144|         console.warn("DB write failed for customer", e);
145|       }
146|    }
147|    return customer;
148|  },
149|
150|  async deleteCustomer(id: string): Promise<void> {
151|    if (isSupabaseConfigured()) {
152|      try { 
153|        const { error } = await supabase.from('profiles').delete().eq('id', id);
154|        if (error) throw error;
155|      } catch(e) {
156|        console.warn("DB delete failed for customer", e);
157|      }
158|    }
159|  },
160|
161|  // Sales
162|  async getSales(): Promise<Sale[]> {
163|    if (isSupabaseConfigured()) {
164|      try {
165|        const { data, error } = await supabase.from('sales').select('*');
166|        if (!error && data) {
167|            return data as Sale[];
168|        }
169|      } catch(e) { console.warn("Failed to fetch sales from DB"); }
170|      return [];
171|    }
172|    return [];
173|  },
174|
175|  async createSale(sale: Sale): Promise<Sale> {
176|    if (isSupabaseConfigured()) {
177|      try {
178|        const { error } = await supabase.from('sales').insert(sale);
179|        if (error) throw error;
180|      } catch (err) {
181|        console.warn("DB write failed for sale", err);
182|      }
183|    }
184|    return sale;
185|  },
186|
187|  // Users
188|  async getUsers(): Promise<User[]> {
189|    if (isSupabaseConfigured()) {
190|      try {
191|        const { data, error } = await supabase.from('users').select('*');
192|        if (!error && data && data.length > 0) {
193|            return data as User[];
194|        }
195|      } catch(e) {}
196|    }
197|    return [];
198|  },
199|
200|  async upsertUser(user: User): Promise<User> {
201|    if (isSupabaseConfigured()) {
202|      try { 
203|        const { error } = await supabase.from('users').upsert(user);
204|        if (error) throw error;
205|      } catch(e) {
206|        console.warn("DB write failed for user", e);
207|      }
208|    }
209|    return user;
210|  },
211|
212|  async deleteUser(id: string): Promise<void> {
213|    if (isSupabaseConfigured()) {
214|      try { 
215|        const { error } = await supabase.from('users').delete().eq('id', id);
216|        if (error) throw error;
217|      } catch(e) {
218|        console.warn("DB delete failed for user", e);
219|      }
220|    }
221|  },
222|
223|  // Settings
224|  async getSettings(): Promise<AppSettings> {
225|    if (isSupabaseConfigured()) {
226|      try {
227|        const { data, error } = await supabase.from('settings').select('*').limit(1);
228|        if (!error && data && data.length > 0) {
229|            return normalizeSettingsBranding(data[0] as AppSettings);
230|        }
231|      } catch(e) {}
232|    }
233|    return normalizeSettingsBranding({
234|      companyName: 'Krinas Tech',
235|      email: 'admin@krinastech.com',
236|      phone: '+234 800 123 4567',
237|      address: '15, Victoria Island, Lagos, Nigeria',
238|      currencySymbol: '₦',
239|      taxRate: 7.5,
240|      logoUrl: '',
241|      receiptPrefix: 'REC',
242|      receiptIdDigits: 6
243|    });
244|  },
245|
246|  async saveSettings(settings: AppSettings): Promise<AppSettings> {
247|    const normalized = normalizeSettingsBranding(settings);
248|    if (isSupabaseConfigured()) {
249|      try { 
250|        const { error } = await supabase.from('settings').upsert({ id: 1, ...normalized });
251|        if (error) throw error;
252|      } catch(e) {
253|        console.warn("DB write failed for settings", e);
254|      }
255|    }
256|    return normalized;
257|  },
258|
259|  // Logs
260|  async getLogs(): Promise<ActivityLog[]> {
261|    if (isSupabaseConfigured()) {
262|      try {
263|        const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(1000);
264|        if (!error && data) {
265|            return data as ActivityLog[];
266|        }
267|      } catch(e) {}
268|    }
269|    return [];
270|  },
271|
272|  async createLog(log: ActivityLog): Promise<void> {
273|    if (isSupabaseConfigured()) {
274|      try { 
275|        const { error } = await supabase.from('activity_logs').insert(log);
276|        if (error) throw error;
277|      } catch(e) {
278|        console.warn("DB write failed for log", e);
279|      }
280|    }
281|  }
282|};
283|
284|export const DEFAULTS = {
285|  PRODUCTS: [],
286|  CUSTOMERS: [],
287|  SALES: [],
288|  SETTINGS: {
289|    companyName: 'Krinas Tech',
290|    email: 'admin@krinastech.com',
291|    phone: '+234 800 123 4567',
292|    address: '15, Victoria Island, Lagos, Nigeria',
293|    currencySymbol: '₦',
294|    taxRate: 7.5,
295|    logoUrl: '',
296|    receiptPrefix: 'REC',
297|    receiptIdDigits: 6
298|  },
299|  USERS: []
300|};
301|
302|export const logActivity = async (user: User, action: string, details: string) => {
303|  const newLog: ActivityLog = {
304|    id: Date.now().toString(),
305|    userId: user.id,
306|    userName: user.name,
307|    action,
308|    details,
309|    timestamp: new Date().toISOString()
310|  };
311|  await api.createLog(newLog);
312|};