import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  INITIAL_PESANTREN_INFO,
  INITIAL_SANTRI,
  INITIAL_KANTIN_PRODUCTS,
  INITIAL_LAUNDRY_SERVICES,
  INITIAL_WARTEL_BOOTHS,
  INITIAL_SPP_TAGIHAN,
  INITIAL_TRANSACTIONS,
  INITIAL_TOPUP_REQUESTS
} from '../data/initialData';
import { db, isDemoMode } from '../services/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const AppContext = createContext(null);

// Audio synthesizers for Cashier / POS & Biometrics (Zero external audio assets needed)
export function playSound(type = 'success') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.25);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (err) {
    console.debug('Audio play failed', err);
  }
}

export function formatRupiah(number) {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return 'Rp ' + Number(number).toLocaleString('id-ID');
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function AppProvider({ children }) {
  // Navigation / Role state
  const [currentRole, setCurrentRole] = useState(() => {
    // Check URL parameters for direct role or token
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    if (urlParams.get('token') || hashParams.get('token')) return 'wali';
    if (urlParams.get('role')) return urlParams.get('role');
    return 'wali'; // Default entry point
  });

  const [activeParentToken, setActiveParentToken] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    return urlParams.get('token') || hashParams.get('token') || 'wali-hendra';
  });

  // Data Collections (Synchronized with localStorage or Cloud Firestore)
  const [santriList, setSantriList] = useState(() => {
    const saved = localStorage.getItem('maisya_santri');
    return saved ? JSON.parse(saved) : INITIAL_SANTRI;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('maisya_products');
    return saved ? JSON.parse(saved) : INITIAL_KANTIN_PRODUCTS;
  });

  const [laundryServices, setLaundryServices] = useState(() => {
    const saved = localStorage.getItem('maisya_laundry');
    return saved ? JSON.parse(saved) : INITIAL_LAUNDRY_SERVICES;
  });

  const [wartelBooths, setWartelBooths] = useState(() => {
    const saved = localStorage.getItem('maisya_wartel');
    return saved ? JSON.parse(saved) : INITIAL_WARTEL_BOOTHS;
  });

  const [sppBills, setSppBills] = useState(() => {
    const saved = localStorage.getItem('maisya_spp');
    return saved ? JSON.parse(saved) : INITIAL_SPP_TAGIHAN;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('maisya_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [topupRequests, setTopupRequests] = useState(() => {
    const saved = localStorage.getItem('maisya_topups');
    return saved ? JSON.parse(saved) : INITIAL_TOPUP_REQUESTS;
  });

  const [pesantrenInfo, setPesantrenInfo] = useState(INITIAL_PESANTREN_INFO);

  // Selected Santri ID for Wali Santri view (defaults to first child of active parent)
  const [selectedChildId, setSelectedChildId] = useState('');

  // Notification Toast state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev && prev.id === toast?.id ? null : prev));
    }, 4500);
  }, [toast]);

  // Sync to localStorage as local cache
  useEffect(() => {
    localStorage.setItem('maisya_santri', JSON.stringify(santriList));
  }, [santriList]);

  useEffect(() => {
    localStorage.setItem('maisya_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('maisya_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('maisya_topups', JSON.stringify(topupRequests));
  }, [topupRequests]);

  useEffect(() => {
    localStorage.setItem('maisya_spp', JSON.stringify(sppBills));
  }, [sppBills]);

  // BroadcastChannel for cross-tab multi-device real-time sync in demo mode
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('maisya_saku_realtime');
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'SYNC_ALL') {
          if (payload.santriList) setSantriList(payload.santriList);
          if (payload.transactions) setTransactions(payload.transactions);
          if (payload.topupRequests) setTopupRequests(payload.topupRequests);
          if (payload.products) setProducts(payload.products);
          if (payload.sppBills) setSppBills(payload.sppBills);
        }
      };
    } catch (e) {
      console.debug('BroadcastChannel not supported', e);
    }
    return () => {
      if (channel) channel.close();
    };
  }, []);

  const broadcastState = useCallback((updated = {}) => {
    try {
      const channel = new BroadcastChannel('maisya_saku_realtime');
      channel.postMessage({
        type: 'SYNC_ALL',
        payload: {
          santriList: updated.santriList || santriList,
          transactions: updated.transactions || transactions,
          topupRequests: updated.topupRequests || topupRequests,
          products: updated.products || products,
          sppBills: updated.sppBills || sppBills
        }
      });
      channel.close();
    } catch (e) {
      // ignore
    }
  }, [santriList, transactions, topupRequests, products, sppBills]);

  // Cloud Firestore Realtime Listeners (if Firebase is configured and not in Demo Mode)
  useEffect(() => {
    if (isDemoMode() || !db) return;

    try {
      const unsubSantri = onSnapshot(collection(db, 'santri'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setSantriList(list);
        }
      });

      const unsubTrx = onSnapshot(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTransactions(list);
        }
      });

      const unsubTopup = onSnapshot(collection(db, 'topups'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTopupRequests(list);
        }
      });

      const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setProducts(list);
        }
      });

      return () => {
        unsubSantri();
        unsubTrx();
        unsubTopup();
        unsubProd();
      };
    } catch (err) {
      console.warn('Firestore subscription warning:', err);
    }
  }, []);

  // Filter children for active Wali Santri
  const activeChildren = useMemo(() => {
    return santriList.filter(s => s.parentToken === activeParentToken);
  }, [santriList, activeParentToken]);

  // Set selected child if not selected or current child is not in active children
  useEffect(() => {
    if (activeChildren.length > 0) {
      if (!selectedChildId || !activeChildren.some(c => c.id === selectedChildId)) {
        setSelectedChildId(activeChildren[0].id);
      }
    }
  }, [activeChildren, selectedChildId]);

  // Current selected santri object for Wali Santri view
  const currentChild = useMemo(() => {
    return santriList.find(s => s.id === selectedChildId) || activeChildren[0] || santriList[0];
  }, [santriList, selectedChildId, activeChildren]);

  // Spending Limit Verification Logic
  const checkSpendingLimit = useCallback((santri, amountToSpend) => {
    if (!santri) return { allowed: false, reason: "Data santri tidak ditemukan." };
    if (santri.balance < amountToSpend) {
      return {
        allowed: false,
        reason: `Saldo santri tidak mencukupi. (Saldo saat ini: ${formatRupiah(santri.balance)}, Total belanja: ${formatRupiah(amountToSpend)})`,
        remaining: santri.balance
      };
    }

    const limitConfig = santri.spendingLimit || { active: false, type: 'none', amount: 0 };
    if (!limitConfig.active || limitConfig.type === 'none' || !limitConfig.amount) {
      return { allowed: true, reason: "Bebas batasan belanja.", remaining: santri.balance };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const used = santri.spendingUsed || { daily: 0, weekly: 0, monthly: 0, lastResetDate: todayStr };

    // Reset daily used if day changed
    const isNewDay = used.lastResetDate !== todayStr;
    const currentDailyUsed = isNewDay ? 0 : (used.daily || 0);

    if (limitConfig.type === 'daily') {
      const remainingDaily = limitConfig.amount - currentDailyUsed;
      if (amountToSpend > remainingDaily) {
        return {
          allowed: false,
          reason: `Transaksi DITOLAK Orang Tua! Melebihi batas jajan harian (${formatRupiah(limitConfig.amount)}/hari). Sisa limit hari ini: ${formatRupiah(Math.max(0, remainingDaily))}`,
          remaining: Math.max(0, remainingDaily)
        };
      }
      return { allowed: true, reason: `Dalam batas harian. Sisa limit setelah ini: ${formatRupiah(remainingDaily - amountToSpend)}`, remaining: remainingDaily - amountToSpend };
    }

    if (limitConfig.type === 'weekly') {
      const remainingWeekly = limitConfig.amount - (used.weekly || 0);
      if (amountToSpend > remainingWeekly) {
        return {
          allowed: false,
          reason: `Transaksi DITOLAK Orang Tua! Melebihi batas jajan pekanan (${formatRupiah(limitConfig.amount)}/pekan). Sisa limit pekan ini: ${formatRupiah(Math.max(0, remainingWeekly))}`,
          remaining: Math.max(0, remainingWeekly)
        };
      }
      return { allowed: true, reason: `Dalam batas pekanan.`, remaining: remainingWeekly - amountToSpend };
    }

    if (limitConfig.type === 'monthly') {
      const remainingMonthly = limitConfig.amount - (used.monthly || 0);
      if (amountToSpend > remainingMonthly) {
        return {
          allowed: false,
          reason: `Transaksi DITOLAK Orang Tua! Melebihi batas jajan bulanan (${formatRupiah(limitConfig.amount)}/bulan). Sisa limit bulan ini: ${formatRupiah(Math.max(0, remainingMonthly))}`,
          remaining: Math.max(0, remainingMonthly)
        };
      }
      return { allowed: true, reason: `Dalam batas bulanan.`, remaining: remainingMonthly - amountToSpend };
    }

    return { allowed: true, reason: "OK", remaining: santri.balance };
  }, []);

  // Update Santri Spending Limit (by Parent or Admin)
  const updateSpendingLimit = useCallback(async (santriId, newLimit) => {
    const updatedSantri = santriList.map(s => {
      if (s.id === santriId) {
        return {
          ...s,
          spendingLimit: {
            ...s.spendingLimit,
            ...newLimit
          }
        };
      }
      return s;
    });

    setSantriList(updatedSantri);
    broadcastState({ santriList: updatedSantri });
    showToast(`Batas belanja santri berhasil diperbarui!`, 'success');
    playSound('beep');

    if (!isDemoMode() && db) {
      try {
        await updateDoc(doc(db, 'santri', santriId), {
          spendingLimit: newLimit
        });
      } catch (err) {
        console.error('Error updating limit on firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // Process POS / Service Transaction
  const recordTransaction = useCallback(async ({
    santriId,
    type,
    categoryLabel,
    amount,
    items = [],
    note = '',
    cashierRole = 'Petugas',
    cashierName = 'Petugas',
    verificationMethod = 'FINGERPRINT_TOUCH',
    durationMinutes = null,
    weightKg = null
  }) => {
    const targetSantri = santriList.find(s => s.id === santriId);
    if (!targetSantri) throw new Error('Santri tidak ditemukan');

    const limitCheck = checkSpendingLimit(targetSantri, amount);
    if (!limitCheck.allowed) {
      playSound('error');
      throw new Error(limitCheck.reason);
    }

    const previousBalance = targetSantri.balance;
    const currentBalance = previousBalance - amount;
    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate updated spendingUsed
    const prevUsed = targetSantri.spendingUsed || { daily: 0, weekly: 0, monthly: 0, lastResetDate: todayStr };
    const isNewDay = prevUsed.lastResetDate !== todayStr;
    const updatedUsed = {
      daily: (isNewDay ? 0 : (prevUsed.daily || 0)) + amount,
      weekly: (prevUsed.weekly || 0) + amount,
      monthly: (prevUsed.monthly || 0) + amount,
      lastResetDate: todayStr
    };

    const newTxId = `trx-${Date.now().toString().slice(-6)}`;
    const newTransaction = {
      id: newTxId,
      santriId: targetSantri.id,
      santriNis: targetSantri.nis,
      santriName: targetSantri.name,
      type,
      categoryLabel: categoryLabel || type,
      amount,
      previousBalance,
      currentBalance,
      items,
      note,
      cashierRole,
      cashierName,
      verificationMethod,
      durationMinutes,
      weightKg,
      timestamp: new Date().toISOString()
    };

    // Update Santri in state
    const updatedSantriList = santriList.map(s => {
      if (s.id === santriId) {
        return {
          ...s,
          balance: currentBalance,
          spendingUsed: updatedUsed
        };
      }
      return s;
    });

    // Update Kantin stock if items purchased
    let updatedProducts = products;
    if (items.length > 0) {
      updatedProducts = products.map(prod => {
        const boughtItem = items.find(it => it.id === prod.id || it.name === prod.name);
        if (boughtItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - boughtItem.qty)
          };
        }
        return prod;
      });
      setProducts(updatedProducts);
    }

    const updatedTransactions = [newTransaction, ...transactions];

    setSantriList(updatedSantriList);
    setTransactions(updatedTransactions);
    broadcastState({
      santriList: updatedSantriList,
      transactions: updatedTransactions,
      products: updatedProducts
    });

    playSound('success');
    showToast(`Transaksi ${formatRupiah(amount)} berhasil diproses!`, 'success');

    // Cloud Firestore Sync
    if (!isDemoMode() && db) {
      try {
        await updateDoc(doc(db, 'santri', santriId), {
          balance: currentBalance,
          spendingUsed: updatedUsed
        });
        await addDoc(collection(db, 'transactions'), newTransaction);
      } catch (err) {
        console.error('Error recording transaction to Firestore:', err);
      }
    }

    return newTransaction;
  }, [santriList, products, transactions, checkSpendingLimit, broadcastState, showToast]);

  // Submit Top-up Request by Wali Santri
  const submitTopupRequest = useCallback(async ({
    santriId,
    amount,
    bankTarget,
    proofImageUrl,
    note = ''
  }) => {
    const targetSantri = santriList.find(s => s.id === santriId);
    if (!targetSantri) throw new Error('Santri tidak ditemukan');

    const uniqueCode = Math.floor(100 + Math.random() * 900); // 3 digit unique code
    const totalTransfer = Number(amount) + uniqueCode;

    const newRequest = {
      id: `topup-${Date.now().toString().slice(-6)}`,
      santriId: targetSantri.id,
      santriNis: targetSantri.nis,
      santriName: targetSantri.name,
      parentName: targetSantri.parentName,
      parentPhone: targetSantri.parentPhone,
      bankTarget,
      amount: Number(amount),
      uniqueCode,
      totalTransfer,
      proofImageUrl: proofImageUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80",
      status: 'PENDING',
      note,
      createdAt: new Date().toISOString()
    };

    const updatedTopups = [newRequest, ...topupRequests];
    setTopupRequests(updatedTopups);
    broadcastState({ topupRequests: updatedTopups });

    playSound('success');
    showToast('Konfirmasi top-up berhasil dikirim! Menunggu verifikasi Bendahara.', 'success');

    if (!isDemoMode() && db) {
      try {
        await addDoc(collection(db, 'topups'), newRequest);
      } catch (err) {
        console.error('Error submitting topup to Firestore:', err);
      }
    }

    return newRequest;
  }, [santriList, topupRequests, broadcastState, showToast]);

  // Approve Top-up Request (by Bendahara)
  const approveTopup = useCallback(async (topupId) => {
    const request = topupRequests.find(t => t.id === topupId);
    if (!request || request.status !== 'PENDING') return;

    const targetSantri = santriList.find(s => s.id === request.santriId);
    if (!targetSantri) return;

    const previousBalance = targetSantri.balance;
    const currentBalance = previousBalance + request.amount;

    // Create deposit transaction record
    const newTx = {
      id: `trx-${Date.now().toString().slice(-6)}`,
      santriId: targetSantri.id,
      santriNis: targetSantri.nis,
      santriName: targetSantri.name,
      type: 'DEPOSIT',
      categoryLabel: 'Setoran Uang Saku',
      amount: request.amount,
      previousBalance,
      currentBalance,
      note: `Top Up disetujui via ${request.bankTarget} (Kode Unik: ${request.uniqueCode})`,
      cashierRole: 'Bendahara Pesantren',
      cashierName: 'Ust. Bendahara',
      verificationMethod: 'BANK_TRANSFER',
      timestamp: new Date().toISOString()
    };

    const updatedSantriList = santriList.map(s => {
      if (s.id === targetSantri.id) {
        return {
          ...s,
          balance: currentBalance
        };
      }
      return s;
    });

    const updatedTopups = topupRequests.map(t => {
      if (t.id === topupId) {
        return {
          ...t,
          status: 'APPROVED',
          approvedAt: new Date().toISOString()
        };
      }
      return t;
    });

    const updatedTransactions = [newTx, ...transactions];

    setSantriList(updatedSantriList);
    setTopupRequests(updatedTopups);
    setTransactions(updatedTransactions);

    broadcastState({
      santriList: updatedSantriList,
      topupRequests: updatedTopups,
      transactions: updatedTransactions
    });

    playSound('success');
    showToast(`Top up sebesar ${formatRupiah(request.amount)} untuk ${targetSantri.name} disetujui!`, 'success');

    if (!isDemoMode() && db) {
      try {
        await updateDoc(doc(db, 'santri', targetSantri.id), { balance: currentBalance });
        await updateDoc(doc(db, 'topups', topupId), { status: 'APPROVED', approvedAt: new Date().toISOString() });
        await addDoc(collection(db, 'transactions'), newTx);
      } catch (err) {
        console.error('Error updating firestore on approve:', err);
      }
    }
  }, [topupRequests, santriList, transactions, broadcastState, showToast]);

  // Reject Top-up Request
  const rejectTopup = useCallback(async (topupId, reason = 'Bukti transfer tidak valid') => {
    const updatedTopups = topupRequests.map(t => {
      if (t.id === topupId) {
        return {
          ...t,
          status: 'REJECTED',
          rejectReason: reason,
          rejectedAt: new Date().toISOString()
        };
      }
      return t;
    });

    setTopupRequests(updatedTopups);
    broadcastState({ topupRequests: updatedTopups });
    showToast(`Permintaan top-up ditolak.`, 'info');

    if (!isDemoMode() && db) {
      try {
        await updateDoc(doc(db, 'topups', topupId), {
          status: 'REJECTED',
          rejectReason: reason,
          rejectedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error rejecting topup on firestore:', err);
      }
    }
  }, [topupRequests, broadcastState, showToast]);

  // Manage Kantin Products (CRUD)
  const saveProduct = useCallback(async (productData) => {
    let updated;
    if (productData.id) {
      updated = products.map(p => p.id === productData.id ? { ...p, ...productData } : p);
      showToast(`Produk "${productData.name}" berhasil diupdate!`, 'success');
    } else {
      const newProduct = {
        ...productData,
        id: `prod-${Date.now().toString().slice(-5)}`,
        isAvailable: true
      };
      updated = [newProduct, ...products];
      showToast(`Produk "${productData.name}" berhasil ditambahkan!`, 'success');
    }

    setProducts(updated);
    broadcastState({ products: updated });
    playSound('beep');

    if (!isDemoMode() && db) {
      try {
        if (productData.id) {
          await updateDoc(doc(db, 'products', productData.id), productData);
        } else {
          await addDoc(collection(db, 'products'), productData);
        }
      } catch (err) {
        console.error('Error saving product on firestore:', err);
      }
    }
  }, [products, broadcastState, showToast]);

  const deleteProduct = useCallback(async (productId) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    broadcastState({ products: updated });
    showToast('Produk berhasil dihapus.', 'info');

    if (!isDemoMode() && db) {
      try {
        await updateDoc(doc(db, 'products', productId), { isDeleted: true });
      } catch (err) {
        console.error('Error deleting product from firestore:', err);
      }
    }
  }, [products, broadcastState, showToast]);

  // Pay SPP Bill
  const paySppBill = useCallback(async (billId, santriId, cashierName = 'Kasir Keuangan') => {
    const bill = sppBills.find(b => b.id === billId);
    const santri = santriList.find(s => s.id === santriId);
    if (!bill || !santri) throw new Error('Data tagihan atau santri tidak valid');

    if (santri.balance < bill.amount) {
      throw new Error(`Saldo santri (${formatRupiah(santri.balance)}) tidak mencukupi untuk tagihan ini (${formatRupiah(bill.amount)})`);
    }

    // Process transaction
    await recordTransaction({
      santriId: santri.id,
      type: 'SPP',
      categoryLabel: 'SPP & Tagihan Syahriyah',
      amount: bill.amount,
      note: `Pembayaran ${bill.title}`,
      cashierRole: 'Kasir SPP & Tagihan',
      cashierName,
      verificationMethod: 'FINGERPRINT_TOUCH'
    });

    const updatedBills = sppBills.map(b => {
      if (b.id === billId) {
        return {
          ...b,
          status: 'PAID',
          paidAt: new Date().toISOString()
        };
      }
      return b;
    });

    setSppBills(updatedBills);
    broadcastState({ sppBills: updatedBills });
    showToast(`Tagihan ${bill.title} berhasil lunas!`, 'success');
  }, [sppBills, santriList, recordTransaction, broadcastState, showToast]);

  // Value provided to consumers
  const value = {
    // Pesantren & System info
    pesantrenInfo,
    setPesantrenInfo,

    // Navigation & Role
    currentRole,
    setCurrentRole,
    activeParentToken,
    setActiveParentToken,

    // Santri data
    santriList,
    setSantriList,
    activeChildren,
    selectedChildId,
    setSelectedChildId,
    currentChild,

    // Collections
    products,
    laundryServices,
    wartelBooths,
    sppBills,
    transactions,
    topupRequests,

    // Actions & Methods
    checkSpendingLimit,
    updateSpendingLimit,
    recordTransaction,
    submitTopupRequest,
    approveTopup,
    rejectTopup,
    saveProduct,
    deleteProduct,
    paySppBill,

    // Toast & Alerts
    toast,
    showToast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
