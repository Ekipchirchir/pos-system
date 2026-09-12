'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import { getProducts, createSale, initiateMpesaPayment } from '@/services/api';
import { Product, SaleResponse } from '@/types';
import { HiShoppingBag, HiTrash, HiQrCode, HiCurrencyDollar, HiDevicePhoneMobile } from 'react-icons/hi2';

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [phone, setPhone] = useState('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
    barcodeInputRef.current?.focus();
  }, []);

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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const salePayload = {
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        payment_method: paymentMethod,
      };

      const saleResponse = await createSale(salePayload);

      if (paymentMethod === 'mpesa' && phone) {
        await initiateMpesaPayment(phone, totalAmount, `INV-${saleResponse.id}`, saleResponse.id);
      }

      setCompletedSale(saleResponse);
      setCart([]);
      setCashReceived('');
      setPhone('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchesCategory = selectedCategory === 'All' || p.unit_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex ml-64 h-full">
        <div className="flex-1 flex flex-col p-6 border-r border-slate-800">
          <header className="flex justify-between items-center mb-4 gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">POS Cashier Terminal</h1>
              <p className="text-xs text-slate-400">Scan barcode or tap products to build order</p>
            </div>
            
            <form onSubmit={handleBarcodeSubmit} className="relative w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <HiQrCode className="text-lg" />
              </span>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </form>
          </header>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium tracking-wider transition-colors capitalize ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 pr-2 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock_quantity === 0}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  product.stock_quantity === 0 
                    ? 'bg-slate-900/40 border-slate-800/40 opacity-40 cursor-not-allowed' 
                    : 'bg-slate-900 border-slate-800 hover:border-blue-600 hover:shadow-md'
                }`}
              >
                <div>
                  <h3 className="font-semibold text-white line-clamp-1">{product.name}</h3>
                  <span className="text-xs text-slate-500 font-medium">{product.barcode}</span>
                </div>
                <div className="mt-4 flex justify-between items-end">
                  <span className="text-green-400 font-bold">Ksh {product.selling_price.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${product.stock_quantity <= 5 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    {product.stock_quantity} {product.unit_type}s
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-100 bg-slate-900 flex flex-col justify-between p-6 shrink-0 border-l border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HiShoppingBag className="text-xl text-blue-500" />
                <h2 className="font-bold text-white">Current Order</h2>
              </div>
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-medium">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} items
              </span>
            </div>

            <div className="space-y-2.5 max-h-75 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  <HiShoppingBag className="text-3xl mx-auto mb-2 opacity-30" />
                  Cart is empty. Scan items to start.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm">
                    <div className="flex-1 pr-2">
                      <div className="font-medium text-white line-clamp-1">{item.name}</div>
                      <div className="text-xs text-slate-400">Ksh {item.selling_price.toLocaleString()} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 text-slate-400 hover:bg-slate-800 text-xs">-</button>
                        <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 text-slate-400 hover:bg-slate-800 text-xs">+</button>
                      </div>
                      <span className="font-semibold text-green-400 w-20 text-right">Ksh {(item.selling_price * item.quantity).toLocaleString()}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-red-400 ml-1">
                        <HiTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-slate-300">Total Due:</span>
              <span className="text-green-400 text-xl">Ksh {totalAmount.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${paymentMethod === 'cash' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                <HiCurrencyDollar className="text-base" /> Cash Payment
              </button>
              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${paymentMethod === 'mpesa' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                <HiDevicePhoneMobile className="text-base" /> M-Pesa STK
              </button>
            </div>

            {paymentMethod === 'cash' ? (
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Cash Tendered (Ksh)"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-medium"
                />
                {cashReceived && (
                  <div className={`flex justify-between items-center p-2 rounded-lg text-xs font-semibold ${cashChange >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-medium"
              />
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0 || (paymentMethod === 'cash' && cashChange < 0)}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </main>

      {completedSale && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 print:bg-white print:block print:p-0 print:m-0 print:absolute print:inset-0">
          <div className="flex flex-col gap-4 max-w-sm w-full max-h-[90vh] print:w-[80mm] print:max-w-none print:mx-auto print:max-h-none">
            
            {/* Scrollable Container for Modal Viewing */}
            <div className="bg-white text-slate-800 p-6 rounded-2xl w-full font-sans text-xs leading-relaxed shadow-2xl overflow-y-auto max-h-[calc(90vh-80px)] print:shadow-none print:p-4 print:m-0 print:rounded-none print:max-h-none print:overflow-visible border border-slate-100">
              <div className="text-center flex flex-col items-center mb-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden mb-2 border border-slate-200 shadow-sm bg-slate-50">
                  <Image 
                    src="/images/logo/logo.png" 
                    alt="Logo" 
                    fill 
                    className="object-cover"
                  />
                </div>
                <h2 className="font-bold text-base uppercase tracking-wider text-slate-900">Wines & Spirits</h2>
                <p className="text-slate-500 text-[11px]">Nairobi, Kenya | Tel: +254 700 000 000</p>
              </div>

              <div className="border-t border-b border-slate-200 py-2.5 mb-3 space-y-1.5 text-slate-600 text-[11px] font-mono">
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
                  <span className="font-semibold text-slate-800 capitalize">{cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Payment Mode:</span>
                  <span className="font-semibold text-slate-800 uppercase">{completedSale.payment_method}</span>
                </div>
              </div>

              <div className="mb-3">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-sans">
                      <th className="pb-1.5 font-semibold w-1/2">Item</th>
                      <th className="pb-1.5 font-semibold text-center w-1/6">Qty</th>
                      <th className="pb-1.5 font-semibold text-right w-1/3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedSale.items.map((item) => {
                      const product = products.find(p => p.id === item.product_id);
                      return (
                        <tr key={item.id} className="align-top">
                          <td className="py-2 pr-1 wrap-break-word font-sans font-medium text-slate-800">{product?.name || `Item #${item.product_id}`}</td>
                          <td className="py-2 text-center text-slate-600">{item.quantity}</td>
                          <td className="py-2 text-right font-semibold text-slate-900">{(item.quantity * item.unit_price).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 pt-2.5 mb-4 space-y-1 font-mono">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span className="font-sans text-xs text-slate-500 uppercase tracking-wider">Total Due:</span>
                  <span className="text-blue-600 text-base">Ksh {completedSale.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {completedSale.fiscal_invoice_number && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center space-y-0.5 mb-4 text-[10px] text-slate-600 font-mono">
                  <p className="font-bold text-slate-800 uppercase tracking-wider font-sans">KRA eTIMS Fiscal Receipt</p>
                  <p><span className="text-slate-400">Inv:</span> {completedSale.fiscal_invoice_number}</p>
                  <p><span className="text-slate-400">VSCU:</span> {completedSale.vscu_response_code}</p>
                </div>
              )}

              <div className="text-center pt-3 border-t border-dashed border-slate-200 text-slate-500 text-[11px] space-y-0.5 font-sans">
                <p className="font-bold text-slate-800">Thank you for shopping with us!</p>
                <p className="text-slate-400 text-[10px]">Please come again.</p>
              </div>
            </div>

            <div className="flex gap-3 print:hidden shrink-0">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-sm transition-colors border border-slate-700 shadow-md"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors shadow-md"
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