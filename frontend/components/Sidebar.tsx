'use client';

import { useSyncExternalStore } from 'react';
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
import { HiSwitchHorizontal } from 'react-icons/hi';

const EMPTY_USER = { username: '', role: '' };

let cachedToken: string | null = null;
let cachedUserInfo = EMPTY_USER;

function getClientSnapshot() {
  if (typeof window === 'undefined') return EMPTY_USER;
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    cachedToken = null;
    cachedUserInfo = EMPTY_USER;
    return EMPTY_USER;
  }

  if (token === cachedToken) {
    return cachedUserInfo;
  }

  cachedToken = token;
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    cachedUserInfo = {
      username: decodedPayload?.sub || '',
      role: decodedPayload?.role || 'cashier'
    };
  } catch (err) {
    console.error('Failed to decode token', err);
    cachedUserInfo = EMPTY_USER;
  }

  return cachedUserInfo;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const userInfo = useSyncExternalStore(
    () => () => {},
    getClientSnapshot,
    () => EMPTY_USER
  );

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/');
  };

  const operationsNav = [
    { name: 'POS Checkout', href: '/pos', icon: HiShoppingBag },
    {name: 'Sales', href: '/sales', icon: HiSwitchHorizontal }
  ];

  const managementNav = [
    { name: 'Dashboard', href: '/admin', icon: HiChartPie },
    { name: 'Inventory', href: '/admin/inventory', icon: HiCube },
    { name: 'Shift Reports', href: '/admin/reports', icon: HiDocumentText },
    { name: 'Users', href: '/admin/users', icon: HiUsers }
  ];

  const allNavItems = [...operationsNav, ...managementNav];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col fixed inset-y-0 left-0 z-40 shadow-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-6 border-b border-slate-800 bg-slate-900 flex items-center gap-3 shrink-0">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700/50 shadow-sm shrink-0 bg-white">
            <Image 
              src="/images/logo/logo.png" 
              alt="Logo" 
              fill 
              sizes="40px"
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

      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-slate-900 border-t border-slate-800 z-50 flex items-center justify-around px-1 shadow-2xl">
        {allNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          let mobileName = item.name;
          if (mobileName === 'Shift Reports') mobileName = 'Reports';
          if (mobileName === 'POS Checkout') mobileName = 'POS';

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
                isActive ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="text-lg mb-0.5" />
              <span className="text-[9px] font-medium tracking-tight truncate max-w-12.5">{mobileName}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-red-400 hover:text-red-300 transition-colors"
        >
          <HiArrowRightOnRectangle className="text-lg mb-0.5" />
          <span className="text-[9px] font-medium tracking-tight">Logout</span>
        </button>
      </nav>
    </>
  );
}