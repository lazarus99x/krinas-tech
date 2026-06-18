
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { Plus, Search, Edit2, Trash2, X, Upload, AlertTriangle, ScanLine, Loader2, Check, Sparkles, Barcode, Image as ImageIcon, Bell, QrCode, Download, Printer, Tag, Package as BoxIcon, DollarSign, Lock } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';

interface InventoryProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
}

interface ScannedItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
  supplier: string;
  description?: string;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Scan Receipt State
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanStep, setScanStep] = useState<'upload' | 'review'>('upload');

  // Barcode Scanner State
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'sku'>('search');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // QR Code Generator State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', category: '', price: 0, stock: 0, lowStockThreshold: 10, enableLowStockAlert: true, supplier: '', description: '',
    vendorPrice: 0
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Robust Barcode Scanner Handling
  useEffect(() => {
    let isMounted = true;

    // Internal helper to safely clear the scanner instance
    const cleanupScanner = () => {
      const scanner = scannerRef.current;
      if (!scanner) return Promise.resolve();

      // We immediately decouple the ref to prevent re-entry
      scannerRef.current = null;

      // Attempt to stop and clear
      return scanner.stop()
        .catch(err => {
           // It's normal to fail stop() if it wasn't running. Ignore.
           // console.warn('Scanner stop warning:', err);
        })
        .finally(() => {
           // Always try to clear the UI element
           return scanner.clear().catch(err => {
             // console.warn('Scanner clear warning:', err);
           });
        });
    };

    if (isBarcodeScannerOpen) {
      const startScanner = async () => {
        // Delay to allow Modal DOM to paint
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!isMounted) return;

        const element = document.getElementById("reader");
        // If element doesn't exist (modal closed too fast), abort
        if (!element) return;

        // Cleanup any stale instance (just in case)
        if (scannerRef.current) {
            await cleanupScanner();
        }

        try {
          if (!isMounted) return;
          
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (isMounted) {
                if (scannerTarget === 'search') setSearchTerm(decodedText);
                else if (scannerTarget === 'sku') setFormData(prev => ({ ...prev, sku: decodedText }));
                
                // Auto-close on successful scan
                setIsBarcodeScannerOpen(false);
              }
            },
            () => {} // Ignore frame read errors
          );
        } catch (err) {
          console.error("Failed to start scanner:", err);
          if (isMounted) {
             // Optional: display error to user
          }
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      // Cleanup when unmounting or when isBarcodeScannerOpen changes to false
      cleanupScanner();
    };
  }, [isBarcodeScannerOpen, scannerTarget]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        enableLowStockAlert: product.enableLowStockAlert ?? true,
        vendorPrice: product.vendorPrice || 0
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', sku: '', category: '', price: 0, stock: 0, lowStockThreshold: 10, enableLowStockAlert: true, supplier: '', description: '',
        imageUrl: `https://picsum.photos/200/200?random=${Math.floor(Math.random()*100)}`,
        vendorPrice: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) onUpdateProduct({ ...editingProduct, ...formData } as Product);
    else onAddProduct({ ...formData, id: Date.now().toString() } as Product);
    handleCloseModal();
  };

  const openBarcodeScanner = (target: 'search' | 'sku') => {
    setScannerTarget(target);
    setIsBarcodeScannerOpen(true);
  };

  const handleScanImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScanImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB Limit
        alert("File size too large. Please upload an image under 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeReceipt = async () => {
    if (!scanImage) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = scanImage.split(',')[1];
      const mimeType = scanImage.substring(scanImage.indexOf(':') + 1, scanImage.indexOf(';'));

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Analyze this receipt or invoice image. Extract all listed items as a JSON array named 'items'. For each item, extract the name, quantity (default to 1 if not specified), unit price, category (infer from name), supplier (if visible on receipt header), and a brief description." }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    price: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    supplier: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        if (result.items && Array.isArray(result.items)) {
          setScannedItems(result.items);
          setScanStep('review');
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImportScannedItems = () => {
    scannedItems.forEach(item => {
      const existingProduct = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (existingProduct) {
        onUpdateProduct({
          ...existingProduct,
          stock: existingProduct.stock + item.quantity,
          price: item.price > 0 ? item.price : existingProduct.price
        });
      } else {
        onAddProduct({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: item.name,
          sku: `SKU-${Math.floor(Math.random() * 10000)}`,
          category: item.category || 'Uncategorized',
          price: item.price,
          stock: item.quantity,
          lowStockThreshold: 10,
          enableLowStockAlert: true,
          supplier: item.supplier || 'Unknown Supplier',
          description: item.description,
          imageUrl: `https://picsum.photos/200/200?random=${Math.floor(Math.random()*100)}`
        });
      }
    });
    setIsScanModalOpen(false);
    setScanImage(null);
    setScannedItems([]);
    setScanStep('upload');
  };

  const handleGenerateQR = async (product: Product) => {
    try {
      const url = await QRCode.toDataURL(product.sku, { width: 400, margin: 2, errorCorrectionLevel: 'H' });
      setQrCodeUrl(url);
      setQrProduct(product);
      setQrModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR code', err);
      alert('Failed to generate QR code.');
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl || !qrProduct) return;
    const link = document.createElement('a');
    link.download = `QR-${qrProduct.sku}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    if (printWindow) {
       printWindow.document.write(`
           <html>
               <head>
                   <title>Print Label - ${qrProduct?.name}</title>
                   <style>
                       body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                       .label { text-align: center; border: 2px solid #000; padding: 20px; border-radius: 10px; max-width: 300px; }
                       h2 { margin: 0 0 10px; font-size: 18px; line-height: 1.2; }
                       p { margin: 5px 0; font-size: 14px; }
                       img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
                       .sku { font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 1px; }
                   </style>
               </head>
               <body>
                   <div class="label">
                       <h2>${qrProduct?.name}</h2>
                       <img src="${qrCodeUrl}" />
                       <p class="sku">${qrProduct?.sku}</p>
                       <p>${qrProduct?.category}</p>
                       <p style="font-size: 20px; font-weight: bold;">₦${qrProduct?.price.toLocaleString()}</p>
                   </div>
                   <script>
                       window.onload = function() { window.print(); window.close(); }
                   </script>
               </body>
           </html>
       `);
       printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Mobile-Friendly Header */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search or scan SKU..." 
              className="w-full pl-10 pr-4 py-3 bg-brand-surface border border-gray-700 text-brand-text rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => openBarcodeScanner('search')}
            className="p-3 bg-brand-surface border border-gray-700 rounded-xl text-brand-text/70 hover:bg-white/5 transition-colors shadow-sm flex items-center justify-center sm:w-auto"
            title="Scan Barcode/QR to Search"
          >
            <Barcode size={20} />
            <span className="sm:hidden ml-2 font-medium">Scan Barcode</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:w-auto gap-3">
          <button 
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-gold/5 to-brand-gold-dark/5 from-brand-gold-dark/20 to-brand-gold-dark/20 text-brand-gold-dark text-brand-gold border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-xl hover:shadow-md transition-all shadow-sm"
          >
            <Sparkles size={18} className="text-brand-gold text-brand-gold" />
            <span className="font-bold whitespace-nowrap">AI Receipt Scan</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center space-x-2 bg-gray-900 dark:bg-brand-gold text-white px-4 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-brand-gold-dark transition-colors shadow-lg shadow-gray-900/10 shadow-brand-gold/15"
          >
            <Plus size={18} />
            <span className="font-medium whitespace-nowrap">Add Product</span>
          </button>
        </div>
      </div>

      {/* Floating Action Button for Mobile AI Scan */}
      <button 
        onClick={() => setIsScanModalOpen(true)}
        className="fixed bottom-24 right-6 lg:hidden w-14 h-14 bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white rounded-full shadow-xl shadow-brand-gold/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        title="AI Receipt Scan"
      >
        <Sparkles size={24} />
      </button>

      {/* Product Grid - Responsive Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredProducts.map((product) => {
          const isLowStock = product.enableLowStockAlert && product.stock <= (product.lowStockThreshold || 10);
          return (
            <div key={product.id} className={`group bg-brand-surface rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all duration-300 flex flex-col ${isLowStock ? 'border-red-200 dark:border-red-900/30' : 'border-gray-800'}`}>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700 mb-4">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute top-2 right-2 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 ${isLowStock ? 'bg-red-500 text-white' : 'bg-white/90 bg-brand-surface/90 text-brand-text/80'}`}>
                  {isLowStock && <AlertTriangle size={10} />}
                  Qty: {product.stock}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-brand-text line-clamp-1 text-sm sm:text-base" title={product.name}>{product.name}</h3>
                    <p className="text-xs text-brand-muted uppercase tracking-wide mt-1">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-brand-text text-sm sm:text-base">₦{product.price.toLocaleString()}</span>
                  </div>
                </div>
                {product.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{product.description}</p>}
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                  {isLowStock && <span className="text-[10px] text-red-500 font-medium">Low Stock</span>}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleGenerateQR(product)} className="p-2 text-brand-muted hover:text-brand-gold hover:text-brand-gold hover:bg-brand-gold/10 dark:hover:bg-purple-900/20 rounded-lg transition-colors" title="Generate QR Code"><QrCode size={16} /></button>
                <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(product)} className="p-2 text-brand-muted hover:text-brand-gold hover:text-brand-gold hover:bg-brand-gold/5 hover:bg-brand-gold-dark/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-brand-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Modals */}
      {(isModalOpen || isScanModalOpen || isBarcodeScannerOpen || qrModalOpen) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          
          {/* Add/Edit Product Modal */}
          {isModalOpen && (
            <div className="bg-brand-surface w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl shadow-2xl animate-fade-in-up flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50 sticky top-0 z-10 backdrop-blur-md flex-none">
                <h3 className="text-lg font-bold text-brand-text">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                  
                  {/* Image Upload Section */}
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-700 flex items-center justify-center overflow-hidden relative shrink-0 group">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-gray-300 dark:text-gray-500" size={32} />
                      )}
                      {formData.imageUrl && (
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          >
                            <X size={20} />
                          </button>
                      )}
                    </div>
                    <div className="flex-1 h-24">
                      <label className="flex flex-col items-center justify-center w-full h-full border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700/30 hover:bg-brand-gold/5 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-2 pb-3 text-gray-400 group-hover:text-blue-500 transition-colors">
                          <Upload className="w-6 h-6 mb-1" />
                          <p className="text-xs text-center"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-[10px] opacity-70 mt-1">PNG, JPG up to 500KB</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleProductImageUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-brand-text/80 mb-1">Product Name</label>
                      <input required type="text" className="w-full px-3 py-3 border border-gray-700 bg-brand-surface text-brand-text rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-brand-text/80 mb-1">Category</label>
                      <input required type="text" className="w-full px-3 py-3 border border-gray-700 bg-brand-surface text-brand-text rounded-xl outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-800 space-y-4">
                     <div className="flex items-center gap-2 mb-2 text-sm font-bold text-brand-text">
                        <DollarSign size={16} className="text-blue-500" />
                        Pricing
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1 relative">
                           <label className="flex items-center gap-1 text-sm font-medium text-brand-text/80 mb-1">
                              Vendor Price (Cost)
                              <Lock size={12} className="text-gray-400" />
                           </label>
                           <input type="number" className="w-full px-3 py-3 border border-gray-700 bg-brand-surface text-brand-text rounded-xl outline-none" value={formData.vendorPrice} onChange={e => setFormData({...formData, vendorPrice: parseFloat(e.target.value)})} placeholder="0.00" />
                           <p className="text-[10px] text-gray-400 mt-1">Not visible on receipts</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="flex items-center gap-1 text-sm font-medium text-brand-text/80 mb-1">
                             Selling Price
                             <Tag size={12} className="text-gray-400" />
                          </label>
                          <input required type="number" className="w-full px-3 py-3 border border-gray-700 bg-brand-surface text-brand-text rounded-xl outline-none" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} placeholder="0.00" />
                        </div>
                     </div>
                  </div>

                  {/* Inventory & Stock */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-1">
                      <label className="block text-sm font-medium text-brand-text/80 mb-1">Current Stock (Units)</label>
                      <input required type="number" className="w-full px-3 py-3 border border-gray-700 bg-brand-surface text-brand-text rounded-xl outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                    </div>
                     <div className="col-span-2 flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-brand-text/80 mb-1">Low Stock Threshold</label>
                        <input required type="number" className="w-full px-3 py-3 border border-gray-700 bg-brand-surface text-brand-text rounded-xl outline-none" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})} />
                      </div>
                      <div className="flex-1 flex flex-col justify-end pb-2">
                         <button type="button" onClick={() => setFormData(prev => ({...prev, enableLowStockAlert: !prev.enableLowStockAlert}))} className="flex items-center gap-3 p-1 cursor-pointer">
                            <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.enableLowStockAlert ? 'bg-brand-gold/50' : 'bg-gray-300 dark:bg-gray-600'}`}>
                              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.enableLowStockAlert ? 'left-7' : 'left-1'}`}></div>
                            </div>
                            <span className="text-sm font-medium text-brand-text/80">Alert me</span>
                         </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                      <label className="block text-sm font-medium text-brand-text/80 mb-1">Supplier</label>
                      <input type="text" className="w-full px-3 py-3 border border-gray-700 bg-brand-surface text-brand-text rounded-xl outline-none" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
                    </div>
                     <div className="col-span-2">
                      <label className="block text-sm font-medium text-brand-text/80 mb-1">Description</label>
                      <textarea rows={3} className="w-full px-3 py-3 border border-gray-700 bg-brand-surface text-brand-text rounded-xl outline-none resize-none" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional details..." />
                    </div>
                  </div>
                </div>
                
                {/* Sticky Footer for Buttons */}
                <div className="flex-none pt-4 flex justify-end space-x-3 p-6 border-t border-gray-800 bg-brand-surface rounded-b-2xl z-10">
                  <button type="button" onClick={handleCloseModal} className="flex-1 sm:flex-none px-6 py-3 text-brand-text/70 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-xl font-medium">Cancel</button>
                  <button type="submit" className="flex-1 sm:flex-none px-6 py-3 text-white bg-brand-gold hover:bg-brand-gold-dark rounded-xl font-medium shadow-lg shadow-brand-gold/20">Save</button>
                </div>
              </form>
            </div>
          )}

          {/* QR Code Modal */}
          {qrModalOpen && qrProduct && (
             <div className="bg-brand-surface w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-scale-in flex flex-col items-center">
                 <div className="w-full flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-brand-text">QR Code</h3>
                     <button onClick={() => setQrModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 mb-4 w-full flex justify-center">
                     <img src={qrCodeUrl} alt="QR Code" className="max-w-full h-auto" />
                 </div>
                 <div className="text-center mb-6">
                     <h4 className="font-bold text-brand-text">{qrProduct.name}</h4>
                     <p className="font-mono text-sm text-brand-muted mt-1">{qrProduct.sku}</p>
                 </div>
                 <div className="flex w-full gap-3">
                     <button onClick={handleDownloadQR} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-gold text-white rounded-xl font-medium hover:bg-brand-gold-dark transition-all"><Download size={18} /> Download</button>
                     <button onClick={handlePrintQR} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-700 text-brand-text rounded-xl font-medium hover:bg-white/5 transition-all"><Printer size={18} /> Print</button>
                 </div>
             </div>
          )}

          {/* Scan Modals... */}
        </div>
      )}
    </div>
  );
};
