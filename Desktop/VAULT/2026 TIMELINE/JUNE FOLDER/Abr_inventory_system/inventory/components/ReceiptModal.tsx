import React, { useRef, useState } from 'react';
import { Sale, AppSettings } from '../types';
import { X, Printer, Download, CheckCircle, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReceiptModalProps {
  sale: Sale & { change?: number }; // Extended Sale type to include optional change
  settings: AppSettings;
  onClose: () => void;
  isOpen: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose, isOpen }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const companyName = settings.companyName || 'ABR TECHNOLOGIES LIMITED';
  const currencySymbol = settings.currencySymbol || '₦';

  if (!isOpen) return null;

  const handlePrint = () => {
    // We create a hidden iframe or new window to print just the receipt content cleanly
    const printContent = receiptRef.current?.innerHTML;
    const printWindow = window.open('', '', 'width=400,height=600');
    
    if (printWindow && printContent) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt #${sale.id}</title>
                    <style>
                        @page { size: A4; margin: 14mm; }
                        html, body { margin: 0; }
                        body { font-family: 'Inter', sans-serif; background: #f4f4f5; padding: 24px; color: #111827; }
                        .receipt-paper { width: 100%; max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08); padding: 32px; text-align: center; position: relative; overflow: hidden; }
                        .receipt-accent { height: 6px; background: linear-gradient(90deg, #1d4ed8, #0f172a); border-radius: 999px; margin-bottom: 18px; }
                        .header { margin-bottom: 22px; }
                        .logo { max-height: 72px; margin: 0 auto 12px; display: block; }
                        h1 { font-size: 24px; margin: 0; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                        p { font-size: 14px; margin: 4px 0; color: #4b5563; }
                        .tagline { display: inline-block; margin-top: 8px; padding: 4px 10px; background: #eff6ff; color: #1d4ed8; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
                        .divider { border-top: 1px dashed #cbd5e1; margin: 20px 0; }
                        .details { text-align: left; font-size: 14px; margin-bottom: 18px; }
                        .details-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
                        .details-row span:last-child { text-align: right; font-weight: 600; color: #111827; }
                        .items-table { width: 100%; font-size: 14px; text-align: left; margin-bottom: 18px; border-collapse: collapse; }
                        .items-table th { border-bottom: 1px solid #d1d5db; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
                        .items-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
                        .item-meta { display: block; font-size: 11px; color: #6b7280; margin-top: 4px; text-transform: uppercase; }
                        .totals { text-align: right; font-size: 15px; }
                        .total-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
                        .payment-pill { display: inline-block; margin-top: 10px; padding: 5px 10px; border-radius: 999px; background: #f3f4f6; color: #111827; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
                        .footer { margin-top: 22px; font-size: 12px; color: #6b7280; }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        
        // Show success dialog after initiating print
        setTimeout(() => setShowSuccess(true), 1000);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Receipt roll size approximation
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 10;
    const leftMargin = 5;
    const rightMargin = 5;
    const contentWidth = pageWidth - leftMargin - rightMargin;

    // Helper for centering text
    const centerText = (text: string, y: number, size = 10, bold = false) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // Header
    centerText(companyName, yPos, 12, true);
    yPos += 5;
    centerText(settings.address || '', yPos, 8);
    yPos += 5;
    centerText(settings.phone || '', yPos, 8);
    yPos += 5;
    centerText(settings.email || '', yPos, 8);
    yPos += 8;

    doc.setLineWidth(0.1);
    doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 5;

    // Meta Details
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const addRow = (label: string, value: string, boldValue = false) => {
        doc.text(label, leftMargin, yPos);
        if (boldValue) doc.setFont('helvetica', 'bold');
        doc.text(value, pageWidth - rightMargin - doc.getTextWidth(value), yPos);
        if (boldValue) doc.setFont('helvetica', 'normal');
        yPos += 4;
    };

    addRow('Receipt No:', `#${sale.id}`, true);
    addRow('Date:', new Date(sale.date).toLocaleDateString());
    addRow('Time:', new Date(sale.date).toLocaleTimeString());
    addRow('Customer:', sale.customerName || 'Walk-in Customer');
    if (sale.customerPhone) addRow('Phone:', sale.customerPhone);
    addRow('Staff:', sale.staffName || 'Admin');
    yPos += 2;

    doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 5;

    // Items
    doc.setFont('helvetica', 'bold');
    doc.text("Item", leftMargin, yPos);
    doc.text("Qty", leftMargin + 35, yPos);
    doc.text("Total", pageWidth - rightMargin - 10, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');

    sale.items.forEach(item => {
        const itemName = item.productName.length > 18 ? item.productName.substring(0, 18) + '..' : item.productName;
        doc.text(itemName, leftMargin, yPos);
        
        const unitLabel = item.unitType === 'pack' ? 'pk' : 'pc';
        doc.text(`${item.quantity}${unitLabel}`, leftMargin + 35, yPos);
        
        const lineTotal = `${currencySymbol}${(item.priceAtSale * item.quantity).toLocaleString()}`;
        doc.text(lineTotal, pageWidth - rightMargin - doc.getTextWidth(lineTotal), yPos);
        yPos += 4;
    });

    yPos += 2;
    doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 5;

    // Totals
    addRow('Total Amount:', `${currencySymbol}${sale.totalAmount.toLocaleString()}`, true);
    if (sale.status !== 'FAILED') {
        addRow('Amount Paid:', `${currencySymbol}${sale.amountPaid.toLocaleString()}`);
        if (sale.balance > 0) addRow('Balance Due:', `${currencySymbol}${sale.balance.toLocaleString()}`);
        if (sale.change && sale.change > 0) addRow('Change:', `${currencySymbol}${sale.change.toLocaleString()}`);
        addRow('Payment Method:', sale.paymentMethod);
    }
    
    yPos += 5;
    centerText(`Status: ${sale.status}`, yPos, 10, true);
    yPos += 8;
    
    if (sale.notes) {
        doc.setFontSize(7);
        const splitNotes = doc.splitTextToSize(`Note: ${sale.notes}`, contentWidth);
        doc.text(splitNotes, leftMargin, yPos);
        yPos += (splitNotes.length * 3) + 5;
    }

    centerText('Thank you for choosing ABR Technologies Limited.', yPos, 8, true);

    doc.save(`Receipt-${sale.id}.pdf`);
    setShowSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      
      {/* Success Dialog Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-md animate-fade-in">
           <div className="bg-brand-surface rounded-2xl p-6 shadow-2xl flex flex-col items-center animate-scale-in max-w-xs text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-text mb-2">Action Successful</h3>
              <p className="text-brand-muted text-sm mb-6">The receipt has been processed successfully.</p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full py-2.5 bg-brand-gold text-white rounded-xl font-medium hover:bg-brand-gold-dark transition-colors"
              >
                Dismiss
              </button>
           </div>
        </div>
      )}

      <div 
        className={`bg-brand-surface rounded-2xl shadow-2xl w-full transition-all duration-300 flex flex-col overflow-hidden my-auto ${isExpanded ? 'max-w-2xl h-[90vh]' : 'max-w-sm'}`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
           <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
             Receipt
             <span className="text-xs font-normal text-gray-500 bg-white dark:bg-gray-600 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-500">#{sale.id}</span>
           </h3>
           <div className="flex items-center gap-2">
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-gray-400 hover:text-brand-gold hover:text-brand-gold transition-colors rounded-lg hover:bg-brand-gold/5 hover:bg-brand-gold-dark/20 hidden sm:block" title={isExpanded ? "Collapse" : "Expand"}>
                 {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                 <X size={20} />
              </button>
           </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-100 bg-brand-bg/50 flex justify-center">
           
           {/* Actual Receipt Paper Visual */}
           <div ref={receiptRef} className="bg-white text-black p-8 shadow-lg w-full max-w-[760px] self-start text-center relative receipt-paper" style={{ fontFamily: 'Courier New, monospace' }}>
              
              {/* Receipt Content - Simplified HTML structure for printing */}
              <div className="header mb-4">
                 {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="logo h-12 mx-auto mb-2 object-contain" />}
                 <div className="receipt-accent"></div>
                 <h1 className="text-2xl font-bold uppercase">{companyName}</h1>
                 <p className="text-sm text-gray-600">{settings.address}</p>
                 <p className="text-sm text-gray-600">{settings.phone}</p>
                 {settings.email && <p className="text-sm text-gray-600">{settings.email}</p>}
                 <div className="tagline">Official Sales Receipt</div>
              </div>

              <div className="divider border-t border-dashed border-gray-400 my-3"></div>

              <div className="details text-left text-sm space-y-2 mb-4">
                 <div className="details-row flex justify-between"><span>Receipt No:</span> <span>{sale.id}</span></div>
                 <div className="details-row flex justify-between"><span>Date:</span> <span>{new Date(sale.date).toLocaleString()}</span></div>
                 <div className="details-row flex justify-between"><span>Customer:</span> <span>{sale.customerName || 'Walk-in Customer'}</span></div>
                 {sale.customerPhone && <div className="details-row flex justify-between"><span>Phone:</span> <span>{sale.customerPhone}</span></div>}
                 <div className="details-row flex justify-between"><span>Staff:</span> <span>{sale.staffName}</span></div>
                 <div className="details-row flex justify-between"><span>Status:</span> <span className="font-bold uppercase">{sale.status}</span></div>
              </div>

              <div className="divider border-t border-dashed border-gray-400 my-3"></div>

              <table className="items-table w-full text-sm text-left mb-4">
                 <thead>
                    <tr className="border-b border-gray-300">
                        <th className="pb-1">Item</th>
                        <th className="pb-1 text-center">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                    </tr>
                 </thead>
                 <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i}>
                            <td className="py-1 pr-1">
                                {item.productName}
                                <div className="item-meta text-xs text-gray-500">{item.unitType}</div>
                            </td>
                            <td className="py-1 text-center">{item.quantity}</td>
                            <td className="py-1 text-right">{currencySymbol}{(item.priceAtSale * item.quantity).toLocaleString()}</td>
                        </tr>
                    ))}
                 </tbody>
              </table>

              <div className="divider border-t border-dashed border-gray-400 my-3"></div>

              <div className="totals text-right text-sm space-y-2">
                 <div className="total-row flex justify-between font-bold text-lg">
                    <span>TOTAL</span>
                    <span>{currencySymbol}{sale.totalAmount.toLocaleString()}</span>
                 </div>
                 {sale.status !== 'FAILED' && (
                     <>
                        <div className="total-row flex justify-between text-gray-600">
                            <span>Paid</span>
                            <span>{currencySymbol}{sale.amountPaid.toLocaleString()}</span>
                        </div>
                        {sale.balance > 0 && (
                            <div className="total-row flex justify-between text-red-600 font-bold">
                                <span>Balance</span>
                                <span>{currencySymbol}{sale.balance.toLocaleString()}</span>
                            </div>
                        )}
                        {sale.change && sale.change > 0 ? (
                            <div className="total-row flex justify-between text-gray-600">
                                <span>Change</span>
                                <span>{currencySymbol}{sale.change.toLocaleString()}</span>
                            </div>
                        ) : null}
                     </>
                 )}
              </div>

              <div className="divider border-t border-dashed border-gray-400 my-3"></div>

              {sale.status !== 'FAILED' && (
                <div className="payment-pill">{sale.paymentMethod}</div>
              )}

              <div className="footer text-sm text-gray-500 mt-6">
                 <p>Thank you for choosing ABR Technologies Limited.</p>
                 <p className="mt-1">Goods sold in good condition.</p>
                 {sale.notes && <p className="mt-3 italic border-t pt-3 text-xs">{sale.notes}</p>}
              </div>
              
              {/* Watermark for status */}
              {sale.status !== 'PAID' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 transform -rotate-45">
                      <span className="text-4xl font-black uppercase border-4 border-black p-4">{sale.status}</span>
                  </div>
              )}
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-brand-surface border-t border-gray-800 flex flex-col sm:flex-row gap-3">
           <button 
             onClick={handlePrint}
             className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
           >
             <Printer size={18} /> Print Receipt
           </button>
           <button 
             onClick={handleExportPDF}
             className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-gold/5 bg-brand-gold-dark/20 text-brand-gold text-brand-gold border border-blue-100 dark:border-blue-800 rounded-xl font-bold hover:bg-brand-gold/10 dark:hover:bg-blue-900/30 transition-all active:scale-[0.98]"
           >
             <Download size={18} /> Export PDF
           </button>
        </div>
      </div>
    </div>
  );
};
