/*eslint-disable*/
'use client';

import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import { getShiftReport } from '@/services/api';
import { ShiftReport } from '@/types';
import { HiArrowDownTray } from 'react-icons/hi2';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export default function ReportsPage() {
  const { data: report, isLoading: loading, error: queryError } = useQuery<ShiftReport, Error>({
    queryKey: ['shiftReport'],
    queryFn: getShiftReport,
  });

  const error = queryError ? queryError.message : null;

  const totalRevenueAllItems = report?.items_sold.reduce((acc, item) => acc + item.total_revenue, 0) || 0;
  const lowStockCount = report?.current_inventory.filter((item) => item.remaining_stock <= 5).length || 0;
  const healthyStockCount = report?.current_inventory.filter((item) => item.remaining_stock > 5).length || 0;

  // Data preparation for charts
  const topRevenueItems = report?.items_sold
    .slice(0, 5) 
    .map(item => ({
      name: item.product_name,
      revenue: item.total_revenue,
      quantity: item.total_quantity_sold
    })) || [];

  const stockDistributionData = [
    { name: 'Healthy Stock (>5)', value: healthyStockCount, color: '#22c55e' },
    { name: 'Low Stock (≤5)', value: lowStockCount, color: '#ef4444' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col ml-0 lg:ml-64 h-full p-3.5 lg:p-8 pb-20 lg:pb-8 overflow-y-auto lg:overflow-hidden">
        <div className="shrink-0 mb-3 lg:mb-6">
          <header className="mb-3 lg:mb-6 flex justify-between items-center gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Shift Reports & Analytics</h2>
              <p className="text-[9px] lg:text-sm text-slate-400">Live operational shift metrics, sales breakdowns, and visual stock insights.</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-4">
            
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs lg:text-sm font-semibold text-white">Top Products by Revenue (Ksh)</h3>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Bar Chart</span>
              </div>
              <div className="h-48 lg:h-56 w-full">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-xs text-slate-500">Loading chart data...</div>
                ) : topRevenueItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-slate-500">No revenue data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topRevenueItems} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                        formatter={(value: any) => [`Ksh ${Number(value).toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs lg:text-sm font-semibold text-white">Inventory Stock Status</h3>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Donut Chart</span>
              </div>
              <div className="h-48 lg:h-56 w-full flex items-center justify-center">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-xs text-slate-500">Loading inventory...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stockDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4 bg-slate-900/50 border border-slate-800/80 p-3 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cash Collected</span>
              <span className="text-xs lg:text-base font-bold text-green-400">
                {loading ? '...' : `Ksh ${report?.total_cash_collected.toLocaleString()}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Transactions</span>
              <span className="text-xs lg:text-base font-bold text-blue-400">
                {loading ? '...' : report?.total_transactions}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Revenue</span>
              <span className="text-xs lg:text-base font-bold text-purple-400">
                {loading ? '...' : `Ksh ${totalRevenueAllItems.toLocaleString()}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Low Stock Items</span>
              <span className="text-xs lg:text-base font-bold text-red-400">
                {loading ? '...' : lowStockCount}
              </span>
            </div>
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