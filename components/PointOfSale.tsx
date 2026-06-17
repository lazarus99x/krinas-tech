import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AppSettings, CartItem, Customer, PaymentStatus, Product, Sale, User } from '../types';
import {
  Banknote,
  Calendar,
  Camera,
  CreditCard,
  ExternalLink,
  Landmark,
  Lock,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { buildCustomerDisplayState, publishCustomerDisplay } from '../services/customerDisplay';

interface SaleMeta {
  customerId?: string;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  status: PaymentStatus;
  dueDate?: string;
  notes?: string;
  receiptId?: string;
}

interface PointOfSaleProps {
  products: Product[];
  customers: Customer[];
  onRecordSale: (items: CartItem[], saleMeta: SaleMeta) => void;
  onAddCustomer: (customer: Customer) => void;
  settings?: AppSettings;
  currentUser: User;
  sales?: Sale[];
}

type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'SPLIT';

interface PaymentDetails {
  method: PaymentMethod;
  cashReceived: number;
  transferAmount: number;
  cardAmount: number;
}

export const PointOfSale: React.FC<PointOfSaleProps> = ({
  products,
  customers,
  onRecordSale,
  onAddCustomer,
  settings,
  currentUser,
  sales,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'CASH',
    cashReceived: 0,
    transferAmount: 0,
    cardAmount: 0,
  });
  const [transactionStatus, setTransactionStatus] = useState<PaymentStatus>('PAID');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [newCustomerData, setNewCustomerData] = useState({ name: '', email: '', phone: '', address: '' });
  const [lastSaleDetails, setLastSaleDetails] = useState<(Sale & { change: number }) | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const currencySymbol = settings?.currencySymbol || 'NGN ';
  const companyName = settings?.companyName || 'Krinas Tech';
  const canCompleteSale = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_REP';

  const formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`;
  const getPrice = (item: CartItem) => (item.unitType === 'pack' ? item.pricePerPack || 0 : item.price);
  const getUnitsConsumed = (item: CartItem, quantity = item.cartQuantity) =>
    (item.unitType === 'pack' ? item.quantityPerPack || 1 : 1) * quantity;

  const filteredProducts = useMemo(() => {
    const term = searchProduct.trim().toLowerCase();
    return products.filter((product) => {
      if (product.stock <= 0) return false;
      if (!term) return true;
      return product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term);
    });
  }, [products, searchProduct]);

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].some((value) => value?.toLowerCase().includes(term))
    );
  }, [customerSearch, customers]);

  const selectedCustomerDetails = customers.find((customer) => customer.id === selectedCustomer);
  const cartTotal = cart.reduce((sum, item) => sum + getPrice(item) * item.cartQuantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);
  const lowProfileProducts = filteredProducts.slice(0, 12);

  useEffect(() => {
    publishCustomerDisplay(
      buildCustomerDisplayState({
        cart,
        companyName,
        currencySymbol,
        customerName: selectedCustomerDetails?.name || 'Walk-in customer',
        customerPhone: selectedCustomerDetails?.phone,
        staffName: currentUser.name,
        status: transactionStatus,
        paymentMethod: getPaymentMethodLabel(),
      })
    );
  }, [cart, companyName, currencySymbol, currentUser.name, selectedCustomerDetails, transactionStatus, paymentDetails]);

  useEffect(() => {
    let isMounted = true;

    const cleanupScanner = async () => {
      const scanner = scannerRef.current;
      if (!scanner) return;

      scannerRef.current = null;
      try {
        await scanner.stop();
      } catch {}
      try {
        await scanner.clear();
      } catch {}
    };

    if (showScannerModal) {
      const startScanner = async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (!isMounted || !document.getElementById('pos-barcode-reader')) return;

        await cleanupScanner();
        const scanner = new Html5Qrcode('pos-barcode-reader');
        scannerRef.current = scanner;

        try {
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1.0 },
            (decodedText) => {
              if (!isMounted) return;

              const scanValue = decodedText.trim().toLowerCase();
              const matchedProduct = products.find((product) => {
                const sku = product.sku.trim().toLowerCase();
                const name = product.name.trim().toLowerCase();
                return sku === scanValue || name === scanValue || sku.includes(scanValue);
              });

              setSearchProduct(decodedText);
              setShowScannerModal(false);

              if (!matchedProduct || matchedProduct.stock <= 0) {
                setScanMessage({ type: 'error', text: 'Product not in stock or not found in this system.' });
                return;
              }

              addToCart(matchedProduct);
              setScanMessage({ type: 'success', text: `${matchedProduct.name} added to the sale.` });
            },
            () => undefined
          );
        } catch {
          if (isMounted) {
            setScanMessage({ type: 'error', text: 'Camera scanner could not start on this device.' });
          }
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      cleanupScanner();
    };
  }, [showScannerModal, products]);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id && item.unitType === 'piece');

    if (existing) {
      if (existing.cartQuantity >= product.stock) {
        alert(`Cannot add more. Only ${product.stock} units available in stock.`);
        return;
      }

      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id && item.unitType === 'piece'
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        )
      );
      return;
    }

    if (product.stock <= 0) {
      alert('This item is out of stock.');
      return;
    }

    setCart((prev) => [...prev, { ...product, cartQuantity: 1, unitType: 'piece' }]);
  };

  const updateQuantity = (id: string, unitType: 'piece' | 'pack', delta: number) => {
    const item = cart.find((entry) => entry.id === id && entry.unitType === unitType);
    if (!item) return;

    const newQty = item.cartQuantity + delta;
    if (newQty <= 0) return;

    const otherEntriesUsed = cart
      .filter((entry) => entry.id === id && entry.unitType !== unitType)
      .reduce((sum, entry) => sum + getUnitsConsumed(entry), 0);

    const nextUsage = getUnitsConsumed(item, newQty);
    if (delta > 0 && otherEntriesUsed + nextUsage > item.stock) {
      alert(`Insufficient stock. Only ${item.stock} total units available.`);
      return;
    }

    setCart((prev) =>
      prev.map((entry) =>
        entry.id === id && entry.unitType === unitType ? { ...entry, cartQuantity: newQty } : entry
      )
    );
  };

  const toggleUnitType = (id: string, currentUnit: 'piece' | 'pack') => {
    const item = cart.find((entry) => entry.id === id && entry.unitType === currentUnit);
    if (!item) return;

    const newUnit = currentUnit === 'piece' ? 'pack' : 'piece';
    if (newUnit === 'pack' && (!item.pricePerPack || item.pricePerPack <= 0)) {
      alert('No pack price defined for this item.');
      return;
    }

    if (cart.find((entry) => entry.id === id && entry.unitType === newUnit)) {
      alert(`You already have ${newUnit}s of this item in cart. Please adjust quantity there.`);
      return;
    }

    const unitsNeeded = newUnit === 'pack' ? (item.quantityPerPack || 1) * item.cartQuantity : item.cartQuantity;
    const otherEntriesUsed = cart
      .filter((entry) => entry.id === id && entry.unitType !== currentUnit)
      .reduce((sum, entry) => sum + getUnitsConsumed(entry), 0);

    if (otherEntriesUsed + unitsNeeded > item.stock) {
      alert(`Insufficient stock. Only ${item.stock} total units available.`);
      return;
    }

    setCart((prev) =>
      prev.map((entry) =>
        entry.id === id && entry.unitType === currentUnit ? { ...entry, unitType: newUnit } : entry
      )
    );
  };

  const removeFromCart = (id: string, unitType: 'piece' | 'pack') => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.unitType === unitType)));
  };

  const handleInitiatePayment = () => {
    if (cart.length === 0 || !canCompleteSale) return;

    setPaymentDetails({
      method: 'CASH',
      cashReceived: cartTotal,
      transferAmount: 0,
      cardAmount: 0,
    });
    setTransactionStatus('PAID');
    setDueDate('');
    setNotes('');
    setShowPaymentModal(true);
  };

  const calculateTotalEntered = () => {
    if (transactionStatus === 'FAILED' || transactionStatus === 'CREDIT') return 0;
    if (paymentDetails.method === 'CASH') return paymentDetails.cashReceived;
    if (paymentDetails.method === 'TRANSFER') return paymentDetails.transferAmount;
    if (paymentDetails.method === 'CARD') return paymentDetails.cardAmount;
    return (paymentDetails.cashReceived || 0) + (paymentDetails.transferAmount || 0) + (paymentDetails.cardAmount || 0);
  };

  const validatePayment = () => {
    const entered = calculateTotalEntered();
    if (transactionStatus === 'PAID') return entered >= cartTotal;
    if (transactionStatus === 'PARTIAL') return entered > 0 && entered < cartTotal;
    if (transactionStatus === 'CREDIT') return true;
    if (transactionStatus === 'FAILED') return notes.trim().length > 0;
    return false;
  };

  const getPaymentMethodLabel = () => {
    if (transactionStatus === 'FAILED') return 'None';
    if (transactionStatus === 'CREDIT') return 'Credit';
    if (paymentDetails.method === 'SPLIT') {
      const parts = [];
      if (paymentDetails.cashReceived > 0) parts.push('Cash');
      if (paymentDetails.transferAmount > 0) parts.push('Transfer');
      if (paymentDetails.cardAmount > 0) parts.push('Card');
      return parts.join(' + ');
    }
    return paymentDetails.method;
  };

  const handleConfirmPayment = () => {
    if (!validatePayment()) return;

    const totalEntered = calculateTotalEntered();
    const balance = transactionStatus === 'PAID' ? 0 : Math.max(0, cartTotal - totalEntered);
    const amountPaidActual = transactionStatus === 'PAID' ? cartTotal : totalEntered;
    const change = transactionStatus === 'PAID' && totalEntered > cartTotal ? totalEntered - cartTotal : 0;
    const nextIdNum = (sales?.length || 0) + 1;
    const prefix = settings?.receiptPrefix || 'REC';
    const digits = settings?.receiptIdDigits || 6;
    const receiptId = `${prefix}-${nextIdNum.toString().padStart(digits, '0')}`;

    const saleMeta: SaleMeta = {
      customerId: selectedCustomer || undefined,
      total: cartTotal,
      amountPaid: amountPaidActual,
      balance,
      paymentMethod: getPaymentMethodLabel(),
      status: transactionStatus,
      dueDate: transactionStatus === 'PARTIAL' || transactionStatus === 'CREDIT' ? dueDate : undefined,
      notes,
      receiptId,
    };

    onRecordSale(cart, saleMeta);

    setLastSaleDetails({
      id: receiptId,
      date: new Date().toLocaleString(),
      customerName: selectedCustomerDetails?.name || 'Walk-in Customer',
      customerPhone: selectedCustomerDetails?.phone,
      items: cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.cartQuantity,
        priceAtSale: getPrice(item),
        unitType: item.unitType,
      })),
      totalAmount: cartTotal,
      amountPaid: amountPaidActual,
      balance,
      paymentMethod: getPaymentMethodLabel(),
      status: transactionStatus,
      dueDate: saleMeta.dueDate,
      notes: saleMeta.notes,
      change,
      staffId: currentUser.id,
      staffName: currentUser.name,
    });

    setCart([]);
    setSelectedCustomer('');
    setCustomerSearch('');
    setShowPaymentModal(false);
    setShowReceipt(true);
    setScanMessage(null);
  };

  const handleStatusChange = (status: PaymentStatus) => {
    setTransactionStatus(status);

    if (status === 'PAID') {
      setPaymentDetails((current) => ({
        ...current,
        cashReceived: current.method === 'CASH' ? cartTotal : 0,
        transferAmount: current.method === 'TRANSFER' ? cartTotal : 0,
        cardAmount: current.method === 'CARD' ? cartTotal : 0,
      }));
    } else if (status === 'CREDIT' || status === 'FAILED') {
      setPaymentDetails((current) => ({ ...current, cashReceived: 0, transferAmount: 0, cardAmount: 0 }));
    }
  };

  const handleSaveNewCustomer = (event: React.FormEvent) => {
    event.preventDefault();
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: newCustomerData.name,
      email: newCustomerData.email,
      phone: newCustomerData.phone,
      totalSpent: 0,
      notes: newCustomerData.address,
    };

    onAddCustomer(newCustomer);
    setSelectedCustomer(newCustomer.id);
    setCustomerSearch(newCustomer.name);
    setShowAddCustomerModal(false);
    setNewCustomerData({ name: '', email: '', phone: '', address: '' });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.9fr]">
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Sales desk</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Scan or search products</h2>
            </div>
            <div className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by product name or SKU"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  value={searchProduct}
                  onChange={(event) => setSearchProduct(event.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Camera size={16} />
                Scan
              </button>
              <button
                type="button"
                onClick={() => window.open('/customer-display', '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950"
              >
                <ExternalLink size={16} />
                Customer screen
              </button>
            </div>
          </div>
          {scanMessage ? (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                scanMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              }`}
            >
              {scanMessage.text}
            </div>
          ) : null}
        </div>

        <div className="p-5">
          {lowProfileProducts.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
              No matching products are available right now.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lowProfileProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">{product.sku}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                      {product.stock}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{formatCurrency(product.price)}</p>
                      {product.pricePerPack ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Pack {formatCurrency(product.pricePerPack)}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Tap to add</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Order</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{cartItemCount} item(s)</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(cartTotal)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search customer"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <UserPlus size={18} />
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-[20px] border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer('');
                  setCustomerSearch('');
                }}
                className={`w-full border-b border-slate-200 px-4 py-3 text-left text-sm transition dark:border-slate-700 ${
                  !selectedCustomer
                    ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                Walk-in customer
              </button>
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(customer.id);
                    setCustomerSearch(customer.name);
                  }}
                  className={`w-full border-b border-slate-200 px-4 py-3 text-left text-sm last:border-b-0 dark:border-slate-700 ${
                    selectedCustomer === customer.id
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-medium">{customer.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{customer.phone}</p>
                </button>
              ))}
            </div>

            <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Customer on display</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{selectedCustomerDetails?.name || 'Walk-in customer'}</p>
              {selectedCustomerDetails?.phone ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedCustomerDetails.phone}</p> : null}
            </div>

            <div className="max-h-[22rem] space-y-3 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  <ShoppingCart className="mx-auto mb-3" size={28} />
                  Start scanning or selecting products.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item.id}-${item.unitType}`} className="rounded-[20px] border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {item.pricePerPack && item.pricePerPack > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleUnitType(item.id, item.unitType)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:border-slate-600 dark:text-slate-300"
                            >
                              {item.unitType === 'pack' ? <Package size={11} /> : <Tag size={11} />}
                              {item.unitType}
                            </button>
                          ) : (
                            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:border-slate-600 dark:text-slate-300">
                              piece
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(getPrice(item))} each</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.unitType)}
                        className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-2xl border border-slate-200 p-1 dark:border-slate-700">
                        <button type="button" onClick={() => updateQuantity(item.id, item.unitType, -1)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-slate-900 dark:text-white">{item.cartQuantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.unitType, 1)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(getPrice(item) * item.cartQuantity)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {canCompleteSale ? (
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleInitiatePayment}
                className="w-full rounded-2xl bg-slate-950 px-4 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
              >
                Confirm and collect payment
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-4 text-sm font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <Lock size={18} />
                Purchase restricted for this user
              </div>
            )}
          </div>
        </section>
      </aside>

      {showScannerModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Scan product barcode</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Point your camera at the barcode to search and add the item.</p>
              </div>
              <button type="button" onClick={() => setShowScannerModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div id="pos-barcode-reader" className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900" />
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-700/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm payment</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 transition hover:text-slate-700 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto p-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total payable amount</p>
                <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(cartTotal)}</h2>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Transaction status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PAID', 'PARTIAL', 'CREDIT', 'FAILED'] as PaymentStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                        transactionStatus === status
                          ? status === 'FAILED'
                            ? 'border-red-200 bg-red-100 text-red-700'
                            : 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {status === 'PAID' ? 'Paid in full' : status === 'PARTIAL' ? 'Partial payment' : status}
                    </button>
                  ))}
                </div>
              </div>

              {transactionStatus !== 'FAILED' && transactionStatus !== 'CREDIT' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Payment mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['CASH', 'TRANSFER', 'CARD', 'SPLIT'] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          if (method === 'SPLIT') {
                            setPaymentDetails({ ...paymentDetails, method, cashReceived: 0, transferAmount: 0, cardAmount: 0 });
                            return;
                          }

                          const amountToSet = transactionStatus === 'PAID' ? cartTotal : 0;
                          setPaymentDetails({
                            method,
                            cashReceived: method === 'CASH' ? amountToSet : 0,
                            transferAmount: method === 'TRANSFER' ? amountToSet : 0,
                            cardAmount: method === 'CARD' ? amountToSet : 0,
                          });
                        }}
                        className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                          paymentDetails.method === method
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {method === 'CASH' && <Banknote size={16} />}
                        {method === 'TRANSFER' && <Landmark size={16} />}
                        {method === 'CARD' && <CreditCard size={16} />}
                        {method === 'SPLIT' && <Wallet size={16} />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {transactionStatus !== 'FAILED' && transactionStatus !== 'CREDIT' && (
                <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  {(paymentDetails.method === 'CASH' || paymentDetails.method === 'SPLIT') && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cash amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">{currencySymbol}</span>
                        <input
                          type="number"
                          className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-8 pr-4 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          value={paymentDetails.cashReceived || ''}
                          onChange={(event) => setPaymentDetails({ ...paymentDetails, cashReceived: parseFloat(event.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                  {(paymentDetails.method === 'TRANSFER' || paymentDetails.method === 'SPLIT') && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Transfer amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">{currencySymbol}</span>
                        <input
                          type="number"
                          className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-8 pr-4 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          value={paymentDetails.transferAmount || ''}
                          onChange={(event) => setPaymentDetails({ ...paymentDetails, transferAmount: parseFloat(event.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                  {(paymentDetails.method === 'CARD' || paymentDetails.method === 'SPLIT') && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Card amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">{currencySymbol}</span>
                        <input
                          type="number"
                          className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-8 pr-4 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          value={paymentDetails.cardAmount || ''}
                          onChange={(event) => setPaymentDetails({ ...paymentDetails, cardAmount: parseFloat(event.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(transactionStatus === 'PARTIAL' || transactionStatus === 'CREDIT') && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Due date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="date"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    <span>Balance due</span>
                    <span>{formatCurrency(Math.max(0, cartTotal - calculateTotalEntered()))}</span>
                  </div>
                </div>
              )}

              {transactionStatus === 'FAILED' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Reason for failure / notes</label>
                  <textarea
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    rows={3}
                    placeholder="e.g. Card declined, insufficient funds..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              )}

              {transactionStatus !== 'FAILED' && transactionStatus !== 'CREDIT' && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-medium dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Total entered</span>
                  <span className="text-slate-900 dark:text-white">{formatCurrency(calculateTotalEntered())}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={!validatePayment()}
                className={`w-full rounded-2xl py-3.5 font-bold text-white transition ${
                  transactionStatus === 'FAILED'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400'
                }`}
              >
                {transactionStatus === 'FAILED'
                  ? 'Log failed transaction'
                  : transactionStatus === 'CREDIT'
                    ? 'Record credit sale'
                    : transactionStatus === 'PARTIAL'
                      ? 'Record partial payment'
                      : 'Complete payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCustomerModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">New customer</h3>
              <button type="button" onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 transition hover:text-slate-700 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveNewCustomer} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Customer name</label>
                <input required type="text" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={newCustomerData.name} onChange={(event) => setNewCustomerData({ ...newCustomerData, name: event.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input required type="email" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={newCustomerData.email} onChange={(event) => setNewCustomerData({ ...newCustomerData, email: event.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                <input required type="tel" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={newCustomerData.phone} onChange={(event) => setNewCustomerData({ ...newCustomerData, phone: event.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Address (optional)</label>
                <input type="text" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" value={newCustomerData.address} onChange={(event) => setNewCustomerData({ ...newCustomerData, address: event.target.value })} />
              </div>
              <button type="submit" className="w-full rounded-2xl bg-slate-950 py-3 font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white">
                Save customer
              </button>
            </form>
          </div>
        </div>
      )}

      {showReceipt && lastSaleDetails && (
        <ReceiptModal sale={lastSaleDetails} settings={(settings || {}) as AppSettings} onClose={() => setShowReceipt(false)} isOpen={showReceipt} />
      )}
    </div>
  );
};
