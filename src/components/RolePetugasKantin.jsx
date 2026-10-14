import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  AlertTriangle, 
  CreditCard, 
  Receipt, 
  Printer, 
  Package, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import RfidBarcodeScanner from './RfidBarcodeScanner';
import BiometricTouchPad from './BiometricTouchPad';
import confetti from 'canvas-confetti';

export default function RolePetugasKantin() {
  const {
    products,
    saveProduct,
    deleteProduct,
    recordTransaction,
    checkSpendingLimit,
    showToast
  } = useApp();

  // Mode: 'pos' (Cashier) or 'inventory' (Product Catalog Editor)
  const [activeMode, setActiveMode] = useState('pos');

  // POS State
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout Flow Modal
  const [checkoutStep, setCheckoutStep] = useState(null); // null | 'select_santri' | 'biometric' | 'receipt'
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [completedTx, setCompletedTx] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Product Editor Modal State
  const [editingProduct, setEditingProduct] = useState(null); // null or product object
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Categories
  const categories = ['Semua', 'Makanan & Roti', 'Minuman Dingin', 'Makanan Berat', 'Alat Tulis & Kitab', 'Perlengkapan Santri'];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  // Cart Functions
  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast('Stok produk ini sedang habis!', 'error');
      playSound('error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          showToast(`Stok maksimal ${product.stock}`, 'info');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });

    playSound('beep');
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const cartItemCount = cart.reduce((sum, it) => sum + it.qty, 0);

  // Begin Checkout
  const handleStartCheckout = () => {
    if (cart.length === 0) {
      showToast('Keranjang belanja masih kosong', 'info');
      return;
    }
    setCheckoutError('');
    setSelectedSantri(null);
    setCheckoutStep('select_santri');
  };

  // Handle Santri Selected
  const handleSantriSelect = (santri) => {
    setSelectedSantri(santri);
    setCheckoutError('');

    // Check spending limit & balance
    const check = checkSpendingLimit(santri, cartTotal);
    if (!check.allowed) {
      setCheckoutError(check.reason);
      playSound('error');
    } else {
      playSound('beep');
    }
  };

  // Proceed to Biometric Touch
  const handleProceedToBiometric = () => {
    if (!selectedSantri) return;
    const check = checkSpendingLimit(selectedSantri, cartTotal);
    if (!check.allowed) {
      setCheckoutError(check.reason);
      return;
    }
    setCheckoutStep('biometric');
  };

  // Process Final Payment
  const handleBiometricVerified = async (method) => {
    try {
      const itemsDetail = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.price * item.qty
      }));

      const tx = await recordTransaction({
        santriId: selectedSantri.id,
        type: 'PURCHASE_KANTIN',
        categoryLabel: 'Belanja Kantin Ma\'had',
        amount: cartTotal,
        items: itemsDetail,
        note: `Belanja ${cartItemCount} barang di Kantin Santri`,
        cashierRole: 'Petugas Kantin',
        cashierName: 'Akhi Kasir Kantin',
        verificationMethod: method === 'TOUCH_SCREEN_FINGER' ? 'FINGERPRINT_TOUCH' : 'FINGERPRINT_USB'
      });

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      setCompletedTx(tx);
      setCheckoutStep('receipt');
      clearCart();
    } catch (err) {
      setCheckoutError(err.message);
      setCheckoutStep('select_santri');
    }
  };

  // Save / Update Product
  const handleSaveProductSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = {
      id: editingProduct?.id || null,
      name: formData.get('name'),
      category: formData.get('category'),
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      unit: formData.get('unit') || 'pcs',
      barcode: formData.get('barcode') || '',
      image: formData.get('image') || '📦',
      isAvailable: true
    };

    saveProduct(productData);
    setIsEditorOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header with Mode Toggle */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>POS Kasir & Manajemen Kantin Ma'had</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Kantin Santri Imam Syafi'i Brebes
          </h2>
          <p className="text-xs text-slate-500">
            Sistem pembayaran non-tunai santri menggunakan RFID, Barcode, & Biometrik Touch
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveMode('pos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛒 Mesin Kasir (POS)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'inventory'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 Kelola Barang & Harga
          </button>
        </div>
      </div>

      {/* MODE 1: POS CASHIER VIEW */}
      {activeMode === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Products Catalog Grid (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search and Category Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk kantin atau scan barcode barang..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const inCart = cart.find(it => it.id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      p.stock <= 0
                        ? 'opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:border-emerald-500 hover:shadow-md border-slate-200 active:scale-97'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                        {inCart.qty}
                      </span>
                    )}

                    <div>
                      <div className="text-3xl mb-1 text-center py-2 bg-slate-50 rounded-xl">
                        {p.image || '📦'}
                      </div>
                      <div className="text-xs font-bold text-slate-800 line-clamp-2 mt-1">
                        {p.name}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs font-black text-emerald-700">
                        {formatRupiah(p.price)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Stok: {p.stock}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart Sidebar (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm sticky top-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">Keranjang Belanja</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  Keranjang masih kosong.<br />Klik barang di sebelah kiri untuk menambahkan.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="overflow-hidden flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          {formatRupiah(item.price)} × {item.qty} = {formatRupiah(item.price * item.qty)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart Summary */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Total {cartItemCount} Barang</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-slate-900">
                  <span>Total Tagihan</span>
                  <span className="text-emerald-700 text-lg">{formatRupiah(cartTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 text-sm"
              >
                <span>Pilih Santri & Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: INVENTORY & PRODUCT EDITOR */}
      {activeMode === 'inventory' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Katalog Produk & Harga Kantin
              </h3>
              <p className="text-xs text-slate-500">
                Petugas kantin dapat menambah, mengedit harga, dan memperbarui stok barang kapan saja
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>

          {/* Table List of Products */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4">Barcode</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{p.image || '📦'}</span>
                        <span className="font-bold text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${p.stock < 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {p.stock} {p.unit || 'pcs'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.barcode || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus produk "${p.name}"?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CHECKOUT - STEP 1 (SELECT SANTRI & LIMIT CHECK) */}
      {checkoutStep === 'select_santri' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Identifikasi Santri Pembeli
                </h3>
                <p className="text-xs text-slate-500">
                  Total Belanja: <span className="font-bold text-emerald-700">{formatRupiah(cartTotal)}</span> ({cartItemCount} item)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStep(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* RFID / Barcode / Search Box */}
            <RfidBarcodeScanner
              selectedSantri={selectedSantri}
              onSelectSantri={handleSantriSelect}
            />

            {/* Error / Spending Limit Rejection Alert */}
            {checkoutError && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400/50 text-rose-900 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">TRANSAKSI DITOLAK!</div>
                  <div className="mt-1 leading-relaxed">{checkoutError}</div>
                </div>
              </div>
            )}

            {/* Santri Selected & Valid -> Continue */}
            {selectedSantri && !checkoutError && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between">
                <div className="text-xs text-emerald-900">
                  Saldo ananda mencukupi dan belanja sesuai batasan orang tua.
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  Siap Sidik Jari
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutStep(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProceedToBiometric}
                disabled={!selectedSantri || !!checkoutError}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                <span>Lanjut Verifikasi Sidik Jari</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHECKOUT - STEP 2 (BIOMETRIC TOUCH PAD) */}
      {checkoutStep === 'biometric' && selectedSantri && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setCheckoutStep('select_santri')}
              className="absolute -top-12 right-0 text-white/80 hover:text-white flex items-center gap-1 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <BiometricTouchPad
              santriName={`${selectedSantri.name} (${selectedSantri.class})`}
              amount={cartTotal}
              title="Konfirmasi Belanja Kantin"
              subtitle="Santri menyentuh sensor sidik jari pada layar tablet/HP atau tap pada mesin fingerprint USB kasir"
              onVerified={handleBiometricVerified}
            />
          </div>
        </div>
      )}

      {/* MODAL 3: CHECKOUT - STEP 3 (DIGITAL RECEIPT STRUK) */}
      {checkoutStep === 'receipt' && completedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800 space-y-4 animate-in zoom-in-95">
            {/* Thermal Struk Header */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
              <div className="font-black text-emerald-800 text-base">MA'HAD IMAM SYAFI'I BREBES</div>
              <div className="text-xs font-bold text-slate-700">STRUK KANTIN SANTRI CASHLESS</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {formatDateTime(completedTx.timestamp)} • No: {completedTx.id}
              </div>
            </div>

            {/* Santri Info */}
            <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Santri:</span>
                <span className="font-bold text-slate-900">{completedTx.santriName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIS:</span>
                <span className="font-mono font-bold">{completedTx.santriNis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Otorisasi:</span>
                <span className="font-semibold text-emerald-700">{completedTx.verificationMethod}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-1.5 text-xs border-b border-dashed border-slate-300 pb-3 max-h-40 overflow-y-auto">
              {completedTx.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.name} x{it.qty}</span>
                  <span className="font-bold">{formatRupiah(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals & Balance */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL BELANJA:</span>
                <span className="text-emerald-800">{formatRupiah(completedTx.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Sisa Saldo Santri:</span>
                <span className="font-bold text-slate-800">{formatRupiah(completedTx.currentBalance)}</span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-400">
              Syukron & Jazakumullahu Khairan.<br />Simpan bukti ini sebagai tanda transaksi resmi.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckoutStep(null);
                  setCompletedTx(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Selesai (Transaksi Baru)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD / EDIT PRODUCT */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProductSubmit}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Produk Kantin' : 'Tambah Produk Kantin Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Barang:</label>
                <input
                  name="name"
                  defaultValue={editingProduct?.name || ''}
                  required
                  placeholder="Contoh: Roti Manis Coklat"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori:</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || 'Makanan & Roti'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  >
                    {categories.filter(c => c !== 'Semua').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ikon / Emoji:</label>
                  <input
                    name="image"
                    defaultValue={editingProduct?.image || '🍞'}
                    placeholder="Contoh: 🍞, 🥛, 🧃"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Jual (Rp):</label>
                  <input
                    name="price"
                    type="number"
                    min="500"
                    step="500"
                    defaultValue={editingProduct?.price || 5000}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Stok:</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={editingProduct?.stock || 50}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan:</label>
                  <input
                    name="unit"
                    defaultValue={editingProduct?.unit || 'bungkus'}
                    placeholder="pcs, bungkus, botol"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode Barang (Opsional):</label>
                  <input
                    name="barcode"
                    defaultValue={editingProduct?.barcode || ''}
                    placeholder="899123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Simpan Produk
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
