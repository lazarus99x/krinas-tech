import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { CustomerDisplayState, readCustomerDisplay, subscribeCustomerDisplay } from '../services/customerDisplay';

interface CustomerDisplayScreenProps {
  settings?: AppSettings;
}

const statusLabel: Record<string, string> = {
  PAID: 'Paid in full',
  PARTIAL: 'Part payment',
  CREDIT: 'Credit sale',
  FAILED: 'Payment issue',
};

export const CustomerDisplayScreen: React.FC<CustomerDisplayScreenProps> = ({ settings }) => {
  const [display, setDisplay] = useState<CustomerDisplayState | null>(() => readCustomerDisplay());

  useEffect(() => subscribeCustomerDisplay(setDisplay), []);

  const companyName = display?.companyName || settings?.companyName || 'ABR Technologies Limited';
  const currencySymbol = display?.currencySymbol || settings?.currencySymbol || 'NGN ';
  const formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Customer Display</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{companyName}</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            {display ? statusLabel[display.status] || display.status : 'Waiting for sale'}
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Customer</p>
                <h2 className="mt-1 text-2xl font-semibold">{display?.customerName || 'Walk-in customer'}</h2>
                {display?.customerPhone ? <p className="mt-1 text-sm text-slate-400">{display.customerPhone}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Sales rep</p>
                <p className="mt-1 text-lg font-medium">{display?.staffName || 'Waiting...'}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white text-slate-900">
              <div className="grid grid-cols-[1.5fr_0.5fr_0.8fr_0.9fr] gap-4 border-b border-slate-200 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Price</span>
                <span className="text-right">Total</span>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {display?.items?.length ? (
                  display.items.map((item) => (
                    <div
                      key={`${item.id}-${item.unitType}`}
                      className="grid grid-cols-[1.5fr_0.5fr_0.8fr_0.9fr] gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {item.unitType}
                          {item.unitType === 'pack' && item.quantityPerPack ? ` • ${item.quantityPerPack} pcs/pack` : ''}
                        </p>
                      </div>
                      <p className="text-center font-medium">{item.quantity}</p>
                      <p className="text-right font-medium">{formatCurrency(item.unitPrice)}</p>
                      <p className="text-right text-lg font-semibold">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-8 py-20 text-center text-slate-500">Items selected by the sales rep will appear here instantly.</div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-emerald-200">Amount to pay</p>
              <p className="mt-4 text-6xl font-semibold tracking-tight">{formatCurrency(display?.total || 0)}</p>
              <p className="mt-3 text-sm text-slate-300">This screen updates live as products are scanned or selected.</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between py-3 text-sm text-slate-300">
                <span>Items</span>
                <span>{display?.itemCount || 0}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 py-3 text-sm text-slate-300">
                <span>Payment mode</span>
                <span>{display?.paymentMethod || 'Pending'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 py-3 text-sm text-slate-300">
                <span>Updated</span>
                <span>{display ? new Date(display.updatedAt).toLocaleTimeString() : '--'}</span>
              </div>
              <div className="mt-4 rounded-2xl bg-white px-5 py-5 text-slate-900">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total payable</p>
                <p className="mt-2 text-4xl font-semibold">{formatCurrency(display?.total || 0)}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
