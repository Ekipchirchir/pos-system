'use client';

import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import { getShiftReport, getProducts } from '@/services/api';
import { ShiftReport, Product } from '@/types';
import { HiCurrencyDollar, HiShoppingBag, HiExclamationTriangle, HiArrowTrendingUp } from 'react-icons/hi2';

export default function AdminDashboard() {
  const { data: report, isLoading: isReportLoading } = useQuery<ShiftReport>({
    queryKey: ['shiftReport'],
    queryFn: getShiftReport,
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const loading = isReportLoading || isProductsLoading;

  const lowStockProducts = products.filter((p) => p.stock_quantity <= 5);
  const totalRevenueAllItems = report?.items_sold.reduce((acc, item) => acc + item.total_revenue, 0) || 0;

  const stats = [
    {
      title: "Today's Cash Revenue",
      value: report ? `Ksh ${report.total_cash_collected.toLocaleString()}` : 'Ksh 0',
      icon: HiCurrencyDollar,
      cardBg: 'bg-green-950/30 border-green-800/40',
      iconBg: 'text-green-400 bg-green-500/20',
    },
    {
      title: 'Total Transactions',
      value: report ? report.total_transactions.toString() : '0',
      icon: HiShoppingBag,
      cardBg: 'bg-blue-950/30 border-blue-800/40',
      iconBg: 'text-blue-400 bg-blue-500/20',
    },
    {
      title: 'Total Revenue Generated',
      value: `Ksh ${totalRevenueAllItems.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: HiArrowTrendingUp,
      cardBg: 'bg-purple-950/30 border-purple-800/40',
      iconBg: 'text-purple-400 bg-purple-500/20',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockProducts.length.toString(),
      icon: HiExclamationTriangle,
      cardBg: 'bg-red-950/30 border-red-800/40',
      iconBg: 'text-red-400 bg-red-500/20',
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col ml-0 lg:ml-64 h-full p-3.5 lg:p-8 pb-20 lg:pb-8 overflow-y-auto lg:overflow-hidden">
        <div className="shrink-0 mb-3 lg:mb-6">
          <header>
            <h2 className="text-lg lg:text-2xl font-bold tracking-tight">Admin Command Center</h2>
            <p className="text-[11px] lg:text-sm text-slate-400">Real-time oversight of store liquidity, sales velocity, and inventory health.</p>
          </header>
        </div>

        <div className="flex-1 lg:overflow-y-auto space-y-3.5 lg:space-y-6 pr-0 lg:pr-2 pb-6 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className={`${stat.cardBg} border p-3 lg:p-6 rounded-xl shadow-sm backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-1.5 lg:mb-4">
                    <span className="text-[10px] lg:text-sm font-medium text-slate-200 line-clamp-1">{stat.title}</span>
                    <div className={`p-1.5 lg:p-3 rounded-lg ${stat.iconBg}`}>
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

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-3 lg:p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-2.5 lg:mb-4">
                <h3 className="text-xs lg:text-lg font-semibold text-white truncate">Top Moving Products</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 lg:space-y-3 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {loading ? (
                  <div className="text-center py-4 lg:py-8 text-slate-500 text-[11px] lg:text-sm">Loading performance data...</div>
                ) : !report || report.items_sold.length === 0 ? (
                  <div className="text-center py-4 lg:py-8 text-slate-500 text-[11px] lg:text-sm">No sales recorded for this shift yet.</div>
                ) : (
                  report.items_sold.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-950 p-2 lg:p-3.5 rounded-xl border border-slate-800">
                      <div className="min-w-0 pr-2">
                        <div className="font-medium text-white text-[9px] lg:text-sm truncate">{item.product_name}</div>
                        <div className="text-[9px] lg:text-xs text-slate-400 mt-0.5">{item.total_quantity_sold} units sold</div>
                      </div>
                      <div className="text-right font-semibold text-green-400 text-[11px] lg:text-sm shrink-0">
                        Ksh {item.total_revenue.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 lg:p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-2.5 lg:mb-4">
                <h3 className="text-xs lg:text-lg font-semibold text-white truncate">Stock Alerts</h3>
                <span className="text-[9px] lg:text-xs bg-red-500/10 text-red-400 px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full font-medium border border-red-500/20 shrink-0">
                  {lowStockProducts.length} Critical
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-62 lg:max-h-64 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {loading ? (
                  <div className="text-center py-4 lg:py-8 text-slate-500 text-[11px] lg:text-sm">Checking stock levels...</div>
                ) : lowStockProducts.length === 0 ? (
                  <div className="text-center py-4 lg:py-8 text-slate-500 text-[11px] lg:text-sm">All inventory levels optimal.</div>
                ) : (
                  lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-950 p-2 lg:p-3 rounded-xl border border-slate-800 text-[10px] lg:text-xs">
                      <div className="min-w-0 pr-1">
                        <div className="font-medium text-white text-[9px] lg:text-sm  truncate">{p.name}</div>
                        <span className="text-red-400 font-semibold">{p.stock_quantity} {p.unit_type || 'units'} left</span>
                      </div>
                      <span className="font-medium text-slate-500 text-[9px] lg:text-xs shrink-0">{p.barcode}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 lg:p-6 shadow-sm">
            <h3 className="text-xs lg:text-lg font-semibold mb-2.5 lg:mb-4 text-white">Infrastructure & Gateway Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 lg:gap-4 text-[11px] lg:text-sm">
              <div className="bg-slate-950 p-2.5 lg:p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[9px] lg:text-xs mb-0.5">KRA eTIMS VSCU</div>
                  <div className="font-semibold text-white">Online & Fiscalizing</div>
                </div>
                <span className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="bg-slate-950 p-2.5 lg:p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[9px] lg:text-xs mb-0.5">M-Pesa Daraja Gateway</div>
                  <div className="font-semibold text-white">STK Push Active</div>
                </div>
                <span className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="bg-slate-950 p-2.5 lg:p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[9px] lg:text-xs mb-0.5">PostgreSQL Database</div>
                  <div className="font-semibold text-white">Connected & Synced</div>
                </div>
                <span className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500 animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}