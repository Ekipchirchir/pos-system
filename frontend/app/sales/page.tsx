'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import { getSalesHistory, SaleDetailResponse } from '@/services/api';
import { HiDocumentText, HiCurrencyDollar, HiDevicePhoneMobile, HiMagnifyingGlass, HiUser } from 'react-icons/hi2';
import { DateRange } from 'react-day-picker';
import DateRangePicker from '@/components/date-range-picker';

export default function SalesHistoryPage() {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'mpesa'>('all');
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const { data: sales = [], isLoading } = useQuery<SaleDetailResponse[]>({
    queryKey: ['salesHistory'],
    queryFn: getSalesHistory,
  });

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.created_at);
    
    const matchesSearch = 
      sale.id.toString().includes(search) || 
      (sale.fiscal_invoice_number && sale.fiscal_invoice_number.toLowerCase().includes(search.toLowerCase())) ||
      (sale.user?.username && sale.user.username.toLowerCase().includes(search.toLowerCase()));
    
    const matchesPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter;

    // Date range filtering logic
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      matchesDate = saleDate >= dateRange.from && saleDate <= new Date(dateRange.to.setHours(23, 59, 59, 999));
    } else if (dateRange?.from) {
      matchesDate = saleDate >= dateRange.from;
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total_amount, 0);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col ml-0 lg:ml-64 h-full p-2.5 sm:p-4 lg:p-8 pb-20 lg:pb-8 overflow-y-auto lg:overflow-hidden">
        
        <div className="shrink-0 mb-3 lg:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sales Transaction Log</h1>
              <p className="text-[9px] sm:text-sm lg:text-sm text-slate-400">Complete audit trail of items sold, staff performance, and payments.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 sm:py-2 rounded-xl shadow-sm w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[9px] sm:text-[10px] text-slate-100 uppercase tracking-wider font-semibold">Filtered Revenue</span>
              <span className="text-sm sm:text-sm lg:text-lg font-bold text-green-400">Ksh {totalRevenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <HiMagnifyingGlass className="text-sm sm:text-base" />
              </span>
              <input
                type="text"
                placeholder="Search ID, KRA Invoice, Cashier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            {/* Date Range Picker Integration */}
            <div className="shrink-0">
              <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>

            <div className="grid grid-cols-3 sm:flex gap-1.5 shrink-0">
              {(['all', 'cash', 'mpesa'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentFilter(method)}
                  className={`px-3 py-2 rounded-xl text-[11px] sm:text-sm font-semibold capitalize transition-colors text-center ${
                    paymentFilter === method
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-y-auto shadow-sm flex flex-col">
          <div className="grid grid-cols-1 divide-y divide-slate-800">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Loading transaction history...
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <HiDocumentText className="text-3xl mx-auto mb-2 opacity-30" />
                No sales transactions found.
              </div>
            ) : (
              filteredSales.map((sale) => (
                <div key={sale.id} className="p-3 sm:p-4 flex flex-col gap-2.5 hover:bg-slate-800/40 transition-colors">
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-sm">#{sale.id}</span>
                        {sale.fiscal_invoice_number && (
                          <span className="text-[9px] sm:text-[10px] bg-slate-950 px-1.5 py-0.5 font-medium rounded text-slate-100 border border-slate-800 truncate max-w-37.5 sm:max-w-none">
                            KRA: {sale.fiscal_invoice_number}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-100">
                        <span className="text-white font-medium">
                          {new Date(sale.created_at).toLocaleString('en-KE', { 
                            timeZone: 'Africa/Nairobi',
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300 truncate max-w-35">
                          <HiUser className="text-slate-100 font-medium text-[10px]" />
                          {sale.user?.username || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 text-right">
                      <div className="font-bold text-sm sm:text-base text-green-400">
                        Ksh {sale.total_amount.toLocaleString()}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase mt-0.5 ${
                        sale.payment_method === 'cash' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {sale.payment_method === 'cash' ? <HiCurrencyDollar className="text-[10px]" /> : <HiDevicePhoneMobile className="text-[10px]" />}
                        {sale.payment_method}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/60">
                    {sale.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/80">
                        <span className="text-white font-medium">{item.product?.name || `Product #${item.product_id}`}</span>
                        <span className="text-blue-400 font-semibold">{item.quantity}x</span>
                        <span className="text-slate-100 font-medium">(@{item.unit_price})</span>
                      </span>
                    ))}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}