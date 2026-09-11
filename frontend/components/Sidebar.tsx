'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HiChartPie, 
  HiShoppingBag, 
  HiCube, 
  HiDocumentText, 
  HiArrowRightOnRectangle, 
  HiUsers 
} from 'react-icons/hi2';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [userInfo] = useState<{ username: string; role: string }>(() => {
    if (typeof window === 'undefined') return { username: '', role: '' };
    const token = localStorage.getItem('access_token');
    if (!token) return { username: '', role: '' };
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      return {
        username: decodedPayload?.sub || '',
        role: decodedPayload?.role || 'cashier'
      };
    } catch (err) {
      console.error('Failed to decode token', err);
      return { username: '', role: '' };
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const operationsNav = [
    { name: 'POS Checkout', href: '/pos', icon: HiShoppingBag },
  ];

  const managementNav = [
    { name: 'Dashboard', href: '/admin', icon: HiChartPie },
    { name: 'Inventory', href: '/admin/inventory', icon: HiCube },
    { name: 'Shift Reports', href: '/admin/reports', icon: HiDocumentText },
    { name: 'Users', href: '/admin/users', icon: HiUsers }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 left-0 z-40 shadow-2xl overflow-hidden">
      
      <div className="relative z-10 px-5 py-6 border-b border-slate-800 bg-slate-900 flex items-center gap-3 shrink-0">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700/50 shadow-sm shrink-0 bg-white">
          <Image 
            src="/images/logo/logo.png" 
            alt="Logo" 
            fill 
            className="object-cover"
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <h1 className="text-[15px] font-bold text-white tracking-tight truncate leading-tight">Wines & Spirits</h1>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">POS System</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        
        {userInfo.username && (
          <div className="px-4 pt-5 pb-2">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                  {userInfo.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold text-white capitalize truncate">{userInfo.username}</span>
                  <span className="text-[10px] text-slate-400 capitalize tracking-wide font-medium">{userInfo.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 space-y-7">
          
          <div>
            <h2 className="px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operations</h2>
            <nav className="space-y-1">
              {operationsNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`text-lg transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <h2 className="px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Management</h2>
            <nav className="space-y-1">
              {managementNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`text-lg transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-400 text-white transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <HiArrowRightOnRectangle className="text-lg" />
          Logout
        </button>
      </div>
    </aside>
  );
}