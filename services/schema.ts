
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
('1', 'iPhone 15 Pro Max', 'APL-IP15PM-256', 'Smartphones', 1200000.00, 25, 5, true, 'Apple Inc.', 'Latest Apple flagship with A17 Pro chip, titanium design', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=400', 1050000.00, 0, 1),
('2', 'Samsung Galaxy S24 Ultra', 'SS-GS24U-512', 'Smartphones', 1050000.00, 18, 5, true, 'Samsung Electronics', 'Premium Android with S Pen, 200MP camera', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400', 920000.00, 0, 1),
('3', 'MacBook Pro 16" M3 Max', 'APL-MBP16-M3', 'Laptops', 2500000.00, 10, 3, true, 'Apple Inc.', 'Ultimate pro laptop with 16-core CPU, 40-core GPU', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400', 2200000.00, 0, 1),
('4', 'Sony WH-1000XM5', 'SON-WHXM5-BLK', 'Audio', 350000.00, 40, 8, true, 'Sony Corp', 'Industry-leading noise cancellation wireless headphones', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=400', 280000.00, 0, 1),
('5', 'iPad Air M2', 'APL-IPAIR-M2', 'Tablets', 650000.00, 22, 5, true, 'Apple Inc.', 'Powerful tablet with M2 chip, 11-inch Liquid Retina display', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400', 550000.00, 0, 1),
('6', 'Dell XPS 15', 'DELL-XPS15-9530', 'Laptops', 1800000.00, 7, 3, true, 'Dell Technologies', 'Premium Windows laptop with OLED display', 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=400', 1550000.00, 0, 1),
('7', 'AirPods Pro 2nd Gen', 'APL-AIRP-PRO2', 'Audio', 180000.00, 55, 10, false, 'Apple Inc.', 'Adaptive audio, USB-C, improved noise cancellation', 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?auto=format&fit=crop&q=80&w=400', 145000.00, 0, 1),
('8', 'PlayStation 5 Slim', 'SON-PS5-SLIM', 'Gaming', 450000.00, 12, 4, true, 'Sony Interactive', 'Next-gen gaming console with 1TB SSD', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400', 380000.00, 0, 1),
('9', 'Canon EOS R50', 'CN-EOSR50-24', 'Cameras', 750000.00, 9, 3, true, 'Canon Inc.', 'Mirrorless camera with 24.2MP APS-C sensor, 4K video', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400', 620000.00, 0, 1),
('10', 'Samsung 49\" Odyssey G9', 'SS-ODG9-49', 'Monitors', 850000.00, 6, 3, true, 'Samsung Electronics', 'Ultra-wide 49-inch curved gaming monitor, 240Hz', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400', 700000.00, 0, 1)
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
(1, 'Krinas Tech', 'admin@abrinventory.ng', '+234 800 123 4567', '15, Victoria Island, Lagos, Nigeria', '₦', 7.5, 'REC', 6)
ON CONFLICT (id) DO NOTHING;
`;
