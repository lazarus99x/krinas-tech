
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number; // This represents Price per Piece
  stock: number; // Stock is tracked in base units (pieces)
  lowStockThreshold?: number;
  enableLowStockAlert?: boolean;
  supplier: string;
  description?: string;
  imageUrl?: string;
  
  // New Fields
  vendorPrice?: number; // Cost Price (Confidential)
  pricePerPack?: number; // Selling price per pack
  quantityPerPack?: number; // How many pieces are in a pack
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  totalSpent: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
  unitType?: 'piece' | 'pack'; // Track what unit was sold
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'CREDIT' | 'FAILED';

export interface Sale {
  id: string;
  date: string; // ISO string
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  status: PaymentStatus;
  dueDate?: string;
  notes?: string;
  staffId: string;
  staffName: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
  unitType: 'piece' | 'pack';
}

export interface AppSettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  currencySymbol: string;
  taxRate: number;
  logoUrl?: string;
  receiptPrefix?: string;
  receiptIdDigits?: number;
}

export type UserRole = 'ADMIN' | 'SALES_REP' | 'INVENTORY_REP';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, this would be hashed
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  CUSTOMERS = 'CUSTOMERS',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
  STAFF = 'STAFF'
}
