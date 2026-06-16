import { CartItem, PaymentStatus } from '../types';

export interface CustomerDisplayItem {
  id: string;
  name: string;
  quantity: number;
  unitType: 'piece' | 'pack';
  unitPrice: number;
  lineTotal: number;
  quantityPerPack?: number;
}

export interface CustomerDisplayState {
  companyName: string;
  currencySymbol: string;
  customerName: string;
  customerPhone?: string;
  staffName: string;
  status: PaymentStatus;
  paymentMethod: string;
  itemCount: number;
  total: number;
  subtotal: number;
  updatedAt: string;
  items: CustomerDisplayItem[];
}

const STORAGE_KEY = 'abr-customer-display';
const CHANNEL_NAME = 'abr-customer-display';

const getBroadcastChannel = () => {
  if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') return null;
  return new window.BroadcastChannel(CHANNEL_NAME);
};

export const readCustomerDisplay = (): CustomerDisplayState | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomerDisplayState) : null;
  } catch {
    return null;
  }
};

export const publishCustomerDisplay = (state: CustomerDisplayState) => {
  if (typeof window === 'undefined') return;

  const serialized = JSON.stringify(state);
  window.localStorage.setItem(STORAGE_KEY, serialized);

  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage(state);
    channel.close();
  }
};

export const subscribeCustomerDisplay = (listener: (state: CustomerDisplayState | null) => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    listener(readCustomerDisplay());
  };

  const channel = getBroadcastChannel();
  const handleChannelMessage = (event: MessageEvent<CustomerDisplayState>) => {
    listener(event.data);
  };

  window.addEventListener('storage', handleStorage);
  if (channel) channel.addEventListener('message', handleChannelMessage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage);
      channel.close();
    }
  };
};

export const buildCustomerDisplayState = ({
  cart,
  companyName,
  currencySymbol,
  customerName,
  customerPhone,
  staffName,
  status,
  paymentMethod,
}: {
  cart: CartItem[];
  companyName: string;
  currencySymbol: string;
  customerName: string;
  customerPhone?: string;
  staffName: string;
  status: PaymentStatus;
  paymentMethod: string;
}): CustomerDisplayState => {
  const getPrice = (item: CartItem) => (item.unitType === 'pack' ? item.pricePerPack || 0 : item.price);
  const items = cart.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.cartQuantity,
    unitType: item.unitType,
    unitPrice: getPrice(item),
    lineTotal: getPrice(item) * item.cartQuantity,
    quantityPerPack: item.quantityPerPack,
  }));
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    companyName,
    currencySymbol,
    customerName,
    customerPhone,
    staffName,
    status,
    paymentMethod,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total,
    subtotal: total,
    updatedAt: new Date().toISOString(),
    items,
  };
};
