
export const SUPABASE_SCHEMA_SQL = `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT,
    price NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    "lowStockThreshold" INTEGER DEFAULT 10,
    "enableLowStockAlert" BOOLEAN DEFAULT true,
    supplier TEXT,
    description TEXT,
    "imageUrl" TEXT,
    "vendorPrice" NUMERIC DEFAULT 0,
    "pricePerPack" NUMERIC DEFAULT 0,
    "quantityPerPack" INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    "totalSpent" NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "customerId" TEXT,
    "customerName" TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    "totalAmount" NUMERIC DEFAULT 0,
    "amountPaid" NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    "paymentMethod" TEXT,
    status TEXT,
    "dueDate" TEXT,
    notes TEXT,
    "staffId" TEXT,
    "staffName" TEXT
);

-- 4. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    "companyName" TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    "currencySymbol" TEXT DEFAULT '₦',
    "taxRate" NUMERIC DEFAULT 7.5,
    "logoUrl" TEXT,
    "receiptPrefix" TEXT DEFAULT 'REC',
    "receiptIdDigits" INTEGER DEFAULT 6
);

-- 6. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" TEXT,
    "userName" TEXT,
    action TEXT,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- PERMISSIVE POLICIES FOR DEMO (Allow public/anon access)
CREATE POLICY "Public Access Products" ON public.products FOR ALL USING (true);
CREATE POLICY "Public Access Customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Public Access Sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Public Access Users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Access Settings" ON public.settings FOR ALL USING (true);
CREATE POLICY "Public Access Logs" ON public.activity_logs FOR ALL USING (true);

-- SEED DATA

-- Users
INSERT INTO public.users (id, name, email, password, role, "isActive")
VALUES 
('u1', 'System Admin', 'admin@abrinventory.ng', 'password', 'ADMIN', true),
('u2', 'John Sales', 'sales@abrinventory.ng', 'password', 'SALES_REP', true),
('u3', 'Sarah Stock', 'stock@abrinventory.ng', 'password', 'INVENTORY_REP', true)
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO public.products (id, name, sku, category, price, stock, "lowStockThreshold", "enableLowStockAlert", supplier, "imageUrl", "vendorPrice", "pricePerPack", "quantityPerPack")
VALUES
('1', 'Moët & Chandon Imperial', 'WIN-MOET-75', 'Champagne', 65000.00, 24, 10, true, 'LVMH', 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&q=80&w=400', 55000.00, 380000.00, 6),
('2', 'Hennessy V.S.O.P', 'COG-HEN-70', 'Cognac', 85500.00, 15, 5, true, 'Moët Hennessy', 'https://images.unsplash.com/photo-1613253597341-2856247c4c9e?auto=format&fit=crop&q=80&w=400', 70000.00, 500000.00, 6),
('3', 'Cabernet Sauvignon 2019', 'RED-CAB-75', 'Red Wine', 28000.00, 45, 12, true, 'Napa Cellars', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80&w=400', 20000.00, 160000.00, 6),
('4', 'Chardonnay Reserve', 'WHT-CHAR-75', 'White Wine', 24500.00, 32, 10, true, 'Sonoma Vineyards', 'https://images.unsplash.com/photo-1572569661446-52c676c3e76a?auto=format&fit=crop&q=80&w=400', 18000.00, 140000.00, 6),
('5', 'Glenfiddich 12 Year', 'WHI-GLEN-70', 'Whiskey', 55000.00, 8, 10, true, 'William Grant', 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&q=80&w=400', 45000.00, 320000.00, 6),
('6', 'Dom Pérignon Vintage', 'CHA-DOM-75', 'Champagne', 250000.00, 5, 3, true, 'LVMH', 'https://images.unsplash.com/photo-1605218457257-23b6b66d6d8d?auto=format&fit=crop&q=80&w=400', 210000.00, 1450000.00, 6),
('7', 'Coca-Cola (Crate)', 'SFT-COKE-CR', 'Soft Drinks', 4500.00, 150, 20, false, 'Coca-Cola Bottling', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400', 3800.00, 0, 1),
('8', 'Heineken Lager (Case)', 'BER-HEIN-CS', 'Beer', 12000.00, 60, 15, true, 'Heineken NV', 'https://images.unsplash.com/photo-1618886361567-27a3c3114995?auto=format&fit=crop&q=80&w=400', 10500.00, 0, 1)
ON CONFLICT (id) DO NOTHING;

-- Customers
INSERT INTO public.customers (id, name, email, phone, "totalSpent")
VALUES
('1', 'The Royal Hotel', 'procurement@royalhotel.com', '080-1234-5678', 5500000),
('2', 'Lagos Island Club', 'manager@islandclub.ng', '081-9876-5432', 12450000),
('3', 'Mr. Emmanuel Okonkwo', 'emmanuel.o@gmail.com', '070-5555-4444', 850000)
ON CONFLICT (id) DO NOTHING;

-- Settings
INSERT INTO public.settings (id, "companyName", email, phone, address, "currencySymbol", "taxRate", "receiptPrefix", "receiptIdDigits")
VALUES
(1, 'ABR TECHNOLOGIES LIMITED', 'admin@abrinventory.ng', '+234 800 123 4567', '15, Victoria Island, Lagos, Nigeria', '₦', 7.5, 'REC', 6)
ON CONFLICT (id) DO NOTHING;
`;
