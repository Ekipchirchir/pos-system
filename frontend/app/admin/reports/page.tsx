'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { getShiftReport } from '@/services/api';
import { ShiftReport } from '@/types';
import { HiCurrencyDollar, HiShoppingBag, HiCube, HiArrowDownTray } from 'react-icons/hi2';

export default function ReportsPage() {
  const [report, setReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReportData() {
      try {
        const data = await getShiftReport();
        if (isMounted) {
          setReport(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load shift report metrics');
          setLoading(false);
        }
      }
    }

    fetchReportData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalRevenueAllItems = report?.items_sold.reduce((acc, item) => acc + item.total_revenue, 0) || 0;
  const lowStockCount = report?.current_inventory.filter((item) => item.remaining_stock <= 5).length || 0;

  const stats = [
    {
      title: "Today's Cash Revenue",
      value: report ? `Ksh ${report.total_cash_collected.toLocaleString()}` : 'Ksh 0',
      icon: HiCurrencyDollar,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      title: 'Total Transactions',
      value: report ? report.total_transactions.toString() : '0',
      icon: HiShoppingBag,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'Total Revenue Generated',
      value: `Ksh ${totalRevenueAllItems.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: HiCube,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockCount.toString(),
      icon: HiArrowDownTray,
      color: 'text-red-500 bg-red-500/10',
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col ml-0 lg:ml-64 h-full p-3.5 lg:p-8 pb-20 lg:pb-8 overflow-y-auto lg:overflow-hidden">
        <div className="shrink-0 mb-3 lg:mb-6">
          <header className="mb-3 lg:mb-6 flex justify-between items-center gap-2">
            <div>
              <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-white">Shift Reports & Analytics</h2>
              <p className="text-[11px] lg:text-sm text-slate-400">Live operational shift metrics, sales breakdowns, and current stock reconciliation.</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-colors shadow-sm shrink-0"
            >
              <HiArrowDownTray className="text-sm lg:text-base text-slate-400" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="bg-slate-900 border border-slate-800 p-3 lg:p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-1.5 lg:mb-4">
                    <span className="text-[10px] lg:text-sm font-medium text-slate-400 line-clamp-1">{stat.title}</span>
                    <div className={`p-1.5 lg:p-3 rounded-lg ${stat.color}`}>
                      <Icon className="text-xs lg:text-xl" />
                    </div>
                  </div>
                  <div className="text-sm lg:text-2xl font-bold text-white truncate">
                    {loading ? '...' : stat.value}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-3.5 lg:mt-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs lg:text-sm">
              Error loading reports: {error}
            </div>
          )}
        </div>

        <div className="flex-1 lg:overflow-y-auto space-y-3.5 lg:space-y-6 pr-0 lg:pr-2 pb-6 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-3.5 lg:p-6 border-b border-slate-800 flex justify-between items-center gap-2">
              <h3 className="text-xs lg:text-lg font-semibold text-white truncate">Items Sold Summary</h3>
              <span className="text-[9px] lg:text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 lg:px-3 lg:py-1 rounded-full shrink-0">Shift Performance</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs lg:text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] lg:text-xs border-b border-slate-800">
                  <tr>
                    <th className="px-3 lg:px-6 py-2.5 lg:py-4">Product Name</th>
                    <th className="px-3 lg:px-6 py-2.5 lg:py-4">Quantity Sold</th>
                    <th className="px-3 lg:px-6 py-2.5 lg:py-4">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-3 lg:px-6 py-6 lg:py-8 text-center text-slate-500 text-xs lg:text-sm">
                        Loading items sold...
                      </td>
                    </tr>
                  ) : !report || report.items_sold.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 lg:px-6 py-6 lg:py-8 text-center text-slate-500 text-xs lg:text-sm">
                        No sales recorded for this shift.
                      </td>
                    </tr>
                  ) : (
                    report.items_sold.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 lg:px-6 py-2.5 lg:py-4 font-medium text-white">{item.product_name}</td>
                        <td className="px-3 lg:px-6 py-2.5 lg:py-4">
                          <span className="px-2 lg:px-2.5 py-0.5 lg:py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] lg:text-xs font-medium border border-blue-500/20">
                            {item.total_quantity_sold} units
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-2.5 lg:py-4 font-medium text-white">
                          Ksh {item.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-3.5 lg:p-6 border-b border-slate-800 flex justify-between items-center gap-2">
              <h3 className="text-xs lg:text-lg font-semibold text-white truncate">Current Inventory Reconciliation</h3>
              <span className="text-[9px] lg:text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 lg:px-3 lg:py-1 rounded-full shrink-0">Stock Audit</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs lg:text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] lg:text-xs border-b border-slate-800">
                  <tr>
                    <th className="px-3 lg:px-6 py-2.5 lg:py-4">Product ID</th>
                    <th className="px-3 lg:px-6 py-2.5 lg:py-4">Item Name</th>
                    <th className="px-3 lg:px-6 py-2.5 lg:py-4">Remaining Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-3 lg:px-6 py-6 lg:py-8 text-center text-slate-500 text-xs lg:text-sm">
                        Loading inventory levels...
                      </td>
                    </tr>
                  ) : !report || report.current_inventory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 lg:px-6 py-6 lg:py-8 text-center text-slate-500 text-xs lg:text-sm">
                        No inventory records available.
                      </td>
                    </tr>
                  ) : (
                    report.current_inventory.map((item) => (
                      <tr key={item.product_id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 lg:px-6 py-2.5 lg:py-4 text-slate-400">#{item.product_id}</td>
                        <td className="px-3 lg:px-6 py-2.5 lg:py-4 font-medium text-white">{item.name}</td>
                        <td className="px-3 lg:px-6 py-2.5 lg:py-4">
                          <span
                            className={`inline-flex items-center px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${
                              item.remaining_stock > 5
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {item.remaining_stock} units
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}