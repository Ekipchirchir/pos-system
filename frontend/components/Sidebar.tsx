'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HiChartPie, HiShoppingBag, HiCube, HiDocumentText, HiArrowRightOnRectangle } from 'react-icons/hi2';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: HiChartPie },
    { name: 'POS Checkout', href: '/pos', icon: HiShoppingBag },
    { name: 'Inventory', href: '/admin/inventory', icon: HiCube },
    { name: 'Shift Reports', href: '/admin/reports', icon: HiDocumentText },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between fixed inset-y-0 left-0 z-40">
      <div>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white tracking-tight">Wines & Spirits POS</h1>
          <p className="text-xs text-slate-400 mt-0.5">Admin Control Center</p>
        </div>

        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="text-lg" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <HiArrowRightOnRectangle className="text-lg" />
          Logout
        </button>
      </div>
    </aside>
  );
}