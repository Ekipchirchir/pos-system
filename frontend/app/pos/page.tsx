'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import { getProducts, createSale, initiateMpesaPayment } from '@/services/api';
import { saveOfflineSale } from '@/utils/offlineStorage';
import { Product, SaleResponse } from '@/types';
import { HiShoppingBag, HiTrash, HiQrCode, HiCurrencyDollar, HiDevicePhoneMobile } from 'react-icons/hi2';

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [phone, setPhone] = useState('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);
  
  const [cashierName] = useState<string>(() => {
    if (typeof window === 'undefined') return 'System Admin';
    const token = localStorage.getItem('access_token');
    if (!token) return 'System Admin';
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      return decodedPayload?.sub || 'System Admin';
    } catch {
      return 'System Admin';
    }
  });
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const salePayload = {
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        payment_method: paymentMethod,
      };

      const generateOfflineReceipt = (): SaleResponse => ({
        id: Math.floor(Math.random() * 10000), 
        total_amount: totalAmount,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        items: cart.map(i => ({ 
          id: i.id, 
          product_id: i.id, 
          quantity: i.quantity, 
          unit_price: i.selling_price,
          subtotal: i.selling_price * i.quantity 
        })),
        fiscal_invoice_number: 'OFFLINE-PENDING',
        vscu_response_code: 'LOCAL_QUEUE',
        qr_code_data: null
      });

      if (!navigator.onLine) {
        saveOfflineSale(salePayload);
        return generateOfflineReceipt();
      }

      let timeoutId: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 1500);
      });

      try {
        const saleResponse = await Promise.race([
          createSale(salePayload),
          timeoutPromise
        ]) as SaleResponse;

        clearTimeout(timeoutId!);

        if (paymentMethod === 'mpesa' && phone) {
          try {
            await initiateMpesaPayment(phone, totalAmount, `INV-${saleResponse.id}`, saleResponse.id);
          } catch (mpesaError) {
            console.warn("M-Pesa push failed, but sale was recorded:", mpesaError);
          }
        }

        return saleResponse;
      } catch {
        clearTimeout(timeoutId!); 
        saveOfflineSale(salePayload);
        return generateOfflineReceipt();
      }
    },
    onSuccess: (saleResponse) => {
      setCompletedSale(saleResponse);
      setCart([]);
      setCashReceived('');
      setPhone('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      alert(errorMessage);
    },
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.unit_type || 'bottle')))];

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock_quantity) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const cashChange = parseFloat(cashReceived || '0') - totalAmount;

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = products.find((p) => p.barcode === search.trim());
    if (match) {
      addToCart(match);
      setSearch('');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    checkoutMutation.mutate();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchesCategory = selectedCategory === 'All' || p.unit_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col lg:flex-row h-dvh bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col lg:flex-row ml-0 lg:ml-64 h-dvh pb-16 lg:pb-0 overflow-hidden">
        <div className="flex-1 flex flex-col p-2.5 sm:p-4 lg:p-6 lg:border-r border-slate-800 overflow-hidden min-h-0">
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2.5 sm:mb-4 gap-2 shrink-0">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Cashier Terminal</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">Scan barcode or tap products</p>
            </div>
            
            <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-64 lg:w-80">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500">
                <HiQrCode className="text-sm lg:text-lg" />
              </span>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode or search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 sm:py-2 text-xs text-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </form>
          </header>

          <div className="flex gap-1.5 sm:gap-2 mb-2.5 sm:mb-4 overflow-x-auto pb-1 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold tracking-wider transition-colors capitalize shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 sm:gap-3.5 pr-1 content-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock_quantity === 0}
                className={`p-2.5 sm:p-4 rounded-xl border text-left flex flex-col justify-between transition-all min-h-26.25 sm:min-h-32.5 ${
                  product.stock_quantity === 0 
                    ? 'bg-slate-900/40 border-slate-800/40 opacity-40 cursor-not-allowed' 
                    : 'bg-slate-900 border-slate-800 hover:border-blue-600 hover:shadow-md active:scale-[0.98]'
                }`}
              >
                <div>
                  <h3 className="font-semibold text-[11px] sm:text-xs lg:text-sm text-white line-clamp-2 leading-tight">{product.name}</h3>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block mt-0.5">{product.barcode}</span>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-1">
                  <span className="text-green-400 font-bold text-[11px] sm:text-xs lg:text-sm">Ksh {product.selling_price.toLocaleString()}</span>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium ${product.stock_quantity <= 5 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                    {product.stock_quantity} {product.unit_type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 bg-slate-900 flex flex-col justify-between p-3 sm:p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-slate-800 shadow-xl overflow-hidden shrink-0">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5">
                <HiShoppingBag className="text-base text-blue-500" />
                <h2 className="font-bold text-xs sm:text-sm text-white">Current Order</h2>
              </div>
              <span className="text-[10px] sm:text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-300 font-medium">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} items
              </span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0 max-h-28 sm:max-h-40 lg:max-h-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
              {cart.length === 0 ? (
                <div className="text-center py-4 sm:py-12 text-slate-500 text-xs flex flex-col items-center justify-center h-full">
                  <HiShoppingBag className="text-2xl mx-auto mb-1 opacity-30" />
                  Cart is empty. Scan items to start.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-xs shrink-0">
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="font-medium text-white truncate text-[11px] sm:text-xs">{item.name}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400">Ksh {item.selling_price.toLocaleString()} each</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-0.5 text-slate-400 hover:bg-slate-800 text-xs">-</button>
                        <span className="px-1.5 text-xs font-bold text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-0.5 text-slate-400 hover:bg-slate-800 text-xs">+</button>
                      </div>
                      <span className="font-semibold text-green-400 w-14 sm:w-16 text-right text-[11px] sm:text-xs">Ksh {(item.selling_price * item.quantity).toLocaleString()}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-red-400 p-0.5">
                        <HiTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2.5 sm:pt-3 space-y-2.5 mt-1.5 shrink-0">
            <div className="flex justify-between items-center text-sm sm:text-base font-bold">
              <span className="text-slate-300 text-xs sm:text-sm">Total Due:</span>
              <span className="text-green-400 text-sm sm:text-lg font-bold">Ksh {totalAmount.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${paymentMethod === 'cash' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                <HiCurrencyDollar className="text-sm" /> Cash
              </button>
              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${paymentMethod === 'mpesa' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                <HiDevicePhoneMobile className="text-sm" /> M-Pesa
              </button>
            </div>

            {paymentMethod === 'cash' ? (
              <div className="space-y-1.5">
                <input
                  type="number"
                  placeholder="Cash Paid (Ksh)"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium"
                />
                {cashReceived && (
                  <div className={`flex justify-between items-center p-2 rounded-xl text-xs font-semibold ${cashChange >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <span>Change Due:</span>
                    <span>Ksh {cashChange >= 0 ? cashChange.toLocaleString() : 'Insufficient Cash'}</span>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="M-Pesa Phone (0712345678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium"
              />
            )}

            <button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending || cart.length === 0 || (paymentMethod === 'cash' && cashChange < 0)}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-lg disabled:opacity-50"
            >
              {checkoutMutation.isPending ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </main>

      {completedSale && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-3 sm:p-4 z-50 print:bg-white print:block print:p-0 print:m-0 print:absolute print:inset-0 overflow-y-auto">
          <div className="flex flex-col gap-3 max-w-sm w-full my-auto print:w-[80mm] print:max-w-none print:mx-auto">
            
            <div className="bg-white text-slate-800 p-4 sm:p-6 rounded-2xl w-full text-xs leading-relaxed shadow-2xl overflow-y-auto max-h-[75vh] sm:max-h-[80vh] print:shadow-none print:p-4 print:m-0 print:rounded-none print:max-h-none print:overflow-visible border border-slate-100 font-mono">
              <div className="text-center flex flex-col items-center mb-3 sm:mb-4">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden mb-2 border border-slate-200 shadow-sm bg-slate-50">
                  <Image 
                    src="/images/logo/logo.png" 
                    alt="Logo" 
                    fill 
                    className="object-cover"
                  />
                </div>
                <h2 className="font-bold text-sm sm:text-base uppercase tracking-wider font-sans text-slate-900">Wines & Spirits</h2>
                <p className="text-slate-500 text-[10px] sm:text-[11px] font-sans">Nairobi, Kenya | Tel: +254 700 000 000</p>
              </div>

              <div className="border-t border-b border-slate-200 py-2 mb-2.5 space-y-1 text-slate-600 text-[10px] sm:text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Date:</span>
                  <span className="font-semibold text-slate-800">{new Date(completedSale.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Receipt No:</span>
                  <span className="font-semibold text-slate-800">#{completedSale.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Cashier:</span>
                  <span className="font-semibold text-slate-800 capitalize font-sans">{cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Payment Mode:</span>
                  <span className="font-semibold text-slate-800 uppercase">{completedSale.payment_method}</span>
                </div>
              </div>

              <div className="mb-2.5">
                <table className="w-full text-left text-[10px] sm:text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-sans text-[9px] sm:text-[10px]">
                      <th className="pb-1 font-semibold w-1/2">Item</th>
                      <th className="pb-1 font-semibold text-center w-1/6">Qty</th>
                      <th className="pb-1 font-semibold text-right w-1/3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedSale.items.map((item) => {
                      const product = products.find(p => p.id === item.product_id);
                      return (
                        <tr key={item.id} className="align-top">
                          <td className="py-1.5 pr-1 font-sans font-medium text-slate-800">{product?.name || `Item #${item.product_id}`}</td>
                          <td className="py-1.5 text-center text-slate-600">{item.quantity}</td>
                          <td className="py-1.5 text-right font-semibold text-slate-900">{(item.quantity * item.unit_price).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 pt-2 mb-3 space-y-1">
                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-900">
                  <span className="font-sans text-[11px] text-slate-500 uppercase tracking-wider">Total Due:</span>
                  <span className="text-blue-600 text-sm sm:text-base font-mono">Ksh {completedSale.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {completedSale.fiscal_invoice_number && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center space-y-0.5 mb-3 text-[9px] sm:text-[10px] text-slate-600">
                  <p className="font-bold text-slate-800 uppercase tracking-wider font-sans">KRA eTIMS Fiscal Receipt</p>
                  <p><span className="text-slate-400">Inv:</span> {completedSale.fiscal_invoice_number}</p>
                  <p><span className="text-slate-400">VSCU:</span> {completedSale.vscu_response_code}</p>
                </div>
              )}

              <div className="text-center pt-2.5 border-t border-dashed border-slate-200 text-slate-500 text-[10px] sm:text-[11px] space-y-0.5 font-sans">
                <p className="font-bold text-slate-800">Thank you for shopping with us!</p>
                <p className="text-slate-400 text-[9px]">Please come again.</p>
              </div>
            </div>

            <div className="flex gap-2.5 print:hidden shrink-0">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs sm:text-sm transition-colors border border-slate-700 shadow-md"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs sm:text-sm transition-colors shadow-md"
              >
                New Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}