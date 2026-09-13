/*eslint-disable*/
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import { getProducts, createProduct, updateProduct } from '@/services/api';
import { Product } from '@/types';
import { HiCube, HiPlus, HiMagnifyingGlass, HiPencilSquare, HiXMark } from 'react-icons/hi2';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [unitType, setUnitType] = useState('bottle');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const saveMutation = useMutation({
    mutationFn: async (productData: any) => {
      if (editingProduct) {
        return updateProduct(editingProduct.id, productData);
      } else {
        return createProduct(productData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeDrawer();
    },
    onError: (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      alert(errorMessage);
    },
  });

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name,
      barcode,
      buying_price: parseFloat(buyingPrice),
      selling_price: parseFloat(sellingPrice),
      stock_quantity: parseInt(stockQuantity, 10),
      unit_type: unitType,
    });
  };

  const openEditDrawer = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setBarcode(product.barcode);
    setBuyingPrice(product.buying_price.toString());
    setSellingPrice(product.selling_price.toString());
    setStockQuantity(product.stock_quantity.toString());
    setUnitType(product.unit_type || 'bottle');
    setIsDrawerOpen(true);
  };

  const openAddDrawer = () => {
    setEditingProduct(null);
    setName('');
    setBarcode('');
    setBuyingPrice('');
    setSellingPrice('');
    setStockQuantity('');
    setUnitType('bottle');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
    setName('');
    setBarcode('');
    setBuyingPrice('');
    setSellingPrice('');
    setStockQuantity('');
    setUnitType('bottle');
  };

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main 
        className={`flex-1 flex flex-col ml-0 lg:ml-64 h-full p-3.5 lg:p-8 pb-20 lg:pb-8 overflow-y-auto lg:overflow-hidden transition-all duration-300 ease-in-out ${
          isDrawerOpen ? 'lg:mr-112 mr-0' : 'mr-0'
        }`}
      >
        <div className="shrink-0">
          <header className="flex justify-between items-center mb-3 lg:mb-6 gap-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Inventory Management</h1>
              <p className="text-[9px] lg:text-sm text-slate-400">Manage stock quantities, prices, and product barcodes.</p>
            </div>
            <button
              onClick={openAddDrawer}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-colors shadow-md shrink-0"
            >
              <HiPlus className="text-base lg:text-lg" /> <span className="hidden sm:inline">Add New Product</span><span className="sm:hidden">Add</span>
            </button>
          </header>

          <div className="relative mb-3.5 lg:mb-6">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <HiMagnifyingGlass className="text-base lg:text-lg" />
            </span>
            <input
              type="text"
              placeholder="Search inventory by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 lg:pl-10 pr-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-y-auto shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-slate-800">
            {isLoading ? (
              <div className="text-center py-12 lg:py-16 text-slate-500 text-xs lg:text-sm">
                Loading inventory...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 lg:py-16 text-slate-500 text-xs lg:text-sm">
                <HiCube className="text-3xl lg:text-4xl mx-auto mb-2 opacity-30" />
                No inventory products found
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="p-3 lg:p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors gap-2">
                  <div className="space-y-0.5 lg:space-y-1 min-w-0 pr-2">
                    <div className="font-medium text-white text-xs lg:text-base truncate">{product.name}</div>
                    <div className="flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs text-slate-400">
                      <span className="truncate">Barcode: <strong className="text-slate-300">{product.barcode}</strong></span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">Buy: Ksh {product.buying_price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 lg:gap-6 shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-green-400 text-xs lg:text-sm">Ksh {product.selling_price.toLocaleString()}</div>
                      <span className={`inline-block mt-0.5 lg:mt-1 px-2 lg:px-2.5 py-0.5 rounded-full text-[9px] lg:text-xs font-semibold ${product.stock_quantity <= 5 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                        {product.stock_quantity} {product.unit_type || 'units'} left
                      </span>
                    </div>

                    <button
                      onClick={() => openEditDrawer(product)}
                      className="inline-flex items-center gap-1 px-2.5 lg:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] lg:text-xs font-medium transition-colors"
                    >
                      <HiPencilSquare className="text-xs lg:text-sm" /> <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-800">
          <h2 className="text-base lg:text-lg font-bold text-white">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={closeDrawer}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <HiXMark className="text-lg lg:text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <form onSubmit={handleSaveProduct} id="product-form" className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-[10px] lg:text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Jameson Irish Whiskey 750ml"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs lg:text-sm text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] lg:text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Barcode / SKU</label>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g., 5011007001402"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs lg:text-sm text-white font-medium focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] lg:text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Buying Price (Ksh)</label>
                <input
                  type="number"
                  required
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                  placeholder="850"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs lg:text-sm text-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[10px] lg:text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Selling Price (Ksh)</label>
                <input
                  type="number"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="1200"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs lg:text-sm text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] lg:text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Initial Stock</label>
                <input
                  type="number"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="24"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs lg:text-sm text-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[10px] lg:text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Unit Type</label>
                <input
                  type="text"
                  required
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  placeholder="bottle / tot / can"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs lg:text-sm text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 lg:p-6 border-t border-slate-800 bg-slate-900 flex gap-3">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs lg:text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={saveMutation.isPending}
            className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs lg:text-sm transition-colors shadow-md disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}