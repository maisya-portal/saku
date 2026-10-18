import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  INITIAL_PESANTREN_INFO,
  INITIAL_SANTRI,
  INITIAL_KANTIN_PRODUCTS,
  INITIAL_LAUNDRY_SERVICES,
  INITIAL_WARTEL_BOOTHS,
  INITIAL_SPP_TAGIHAN,
  INITIAL_TRANSACTIONS,
  INITIAL_TOPUP_REQUESTS,
  INITIAL_ROLE_ACCOUNTS
} from '../data/initialData';
import { db, isDemoMode } from '../services/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  setDoc, 
  getDocs,
  where,
  query, 
  orderBy 
} from 'firebase/firestore';
import { formatPhoneNumber } from '../utils/whatsapp';

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
  // Read token from URL query or hash
  const extractTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    return urlParams.get('token') || hashParams.get('token') || '';
  };

  // Role Accounts (Managed exclusively by Super Admin)
  const [roleAccounts, setRoleAccounts] = useState(() => {
    const saved = localStorage.getItem('maisya_role_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ROLE_ACCOUNTS;
  });

  // Santri List
  const [santriList, setSantriList] = useState(() => {
    const saved = localStorage.getItem('maisya_santri');
    return saved ? JSON.parse(saved) : INITIAL_SANTRI;
  });

  // Theme state: 'light' | 'dark'
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('maisya_theme');
    if (saved) return saved;
    return 'light'; // default to crisp Scalev Light theme
  });

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('maisya_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Active Authenticated Session (null when locked/logged out)
  const [authSession, setAuthSession] = useState(() => {
    const saved = sessionStorage.getItem('maisya_auth_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  // Pending Token from Magic Link URL
  const [urlToken, setUrlToken] = useState(() => extractTokenFromUrl());

  // Listen to hash / URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const token = extractTokenFromUrl();
      if (token) {
        setUrlToken(token);
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, []);

  // System & Collections
  const [pesantrenInfo, setPesantrenInfo] = useState(() => {
    const saved = localStorage.getItem('maisya_pesantren_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedUrl = parsed.appBaseUrl;
        const finalUrl = (!savedUrl || savedUrl.includes('github.io')) 
          ? 'https://isb-portal.web.app/' 
          : savedUrl;
        return {
          ...INITIAL_PESANTREN_INFO,
          ...parsed,
          appBaseUrl: finalUrl
        };
      } catch (e) { /* ignore */ }
    }
    return INITIAL_PESANTREN_INFO;
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

  // Selected child for Wali Santri view
  const [selectedChildId, setSelectedChildId] = useState('');

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 2500) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const newId = Date.now();
    setToast({ message, type, id: newId });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => (prev && prev.id === newId ? null : prev));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  }, []);

  // Persist roleAccounts & session
  useEffect(() => {
    localStorage.setItem('maisya_role_accounts', JSON.stringify(roleAccounts));
  }, [roleAccounts]);

  useEffect(() => {
    localStorage.setItem('maisya_santri', JSON.stringify(santriList));
  }, [santriList]);

  useEffect(() => {
    localStorage.setItem('maisya_pesantren_info', JSON.stringify(pesantrenInfo));
  }, [pesantrenInfo]);

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

  useEffect(() => {
    if (authSession) {
      sessionStorage.setItem('maisya_auth_session', JSON.stringify(authSession));
    } else {
      sessionStorage.removeItem('maisya_auth_session');
    }
  }, [authSession]);

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
          if (payload.roleAccounts) setRoleAccounts(payload.roleAccounts);
          if (payload.pesantrenInfo) setPesantrenInfo(payload.pesantrenInfo);
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
          sppBills: updated.sppBills || sppBills,
          roleAccounts: updated.roleAccounts || roleAccounts,
          pesantrenInfo: updated.pesantrenInfo || pesantrenInfo
        }
      });
      channel.close();
    } catch (e) {
      // ignore
    }
  }, [santriList, transactions, topupRequests, products, sppBills, roleAccounts, pesantrenInfo]);

  // Cloud Firestore Realtime Listeners
  useEffect(() => {
    if (isDemoMode() || !db) return;

    try {
      const unsubSantri = onSnapshot(collection(db, 'santri'), async (snapshot) => {
        if (!snapshot.empty) {
          setSantriList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          // If Firestore santri collection is empty, seed INITIAL_SANTRI so all devices have shared base data
          try {
            for (const s of INITIAL_SANTRI) {
              await setDoc(doc(db, 'santri', s.id), s);
            }
          } catch (e) {
            console.debug('Initial santri seed to Firestore error:', e);
          }
        }
      });

      const unsubTrx = onSnapshot(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')), (snapshot) => {
        if (!snapshot.empty) {
          setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      });

      const unsubTopup = onSnapshot(collection(db, 'topups'), (snapshot) => {
        if (!snapshot.empty) {
          setTopupRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      });

      const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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
    if (!authSession || authSession.role !== 'wali') return [];
    return santriList.filter(s => s.parentToken === authSession.token);
  }, [santriList, authSession]);

  useEffect(() => {
    if (activeChildren.length > 0) {
      if (!selectedChildId || !activeChildren.some(c => c.id === selectedChildId)) {
        setSelectedChildId(activeChildren[0].id);
      }
    }
  }, [activeChildren, selectedChildId]);

  const currentChild = useMemo(() => {
    return santriList.find(s => s.id === selectedChildId) || activeChildren[0] || null;
  }, [santriList, selectedChildId, activeChildren]);

  // Current active role derived from authSession
  const currentRole = authSession ? authSession.role : null;

  // Resolve target account for pending token (Role Account or Wali Santri)
  const resolveTargetFromToken = useCallback((token) => {
    if (!token) return null;
    const cleanToken = token.trim().replace(/^#/, '');

    // Check staff role accounts
    const roleAcc = roleAccounts.find(r => r.token.toLowerCase() === cleanToken.toLowerCase());
    if (roleAcc) {
      return {
        type: 'role',
        role: roleAcc.role,
        id: roleAcc.id,
        name: roleAcc.name,
        title: roleAcc.title,
        token: roleAcc.token,
        pin: roleAcc.pin,
        avatar: roleAcc.avatar
      };
    }

    // Check Wali Santri tokens
    const santriMatch = santriList.filter(s => s.parentToken && s.parentToken.toLowerCase() === cleanToken.toLowerCase());
    if (santriMatch.length > 0) {
      const first = santriMatch[0];
      return {
        type: 'wali',
        role: 'wali',
        id: first.parentToken,
        name: first.parentName,
        title: `Wali Santri dari ${santriMatch.map(s => `${s.name} (${s.nis})`).join(' & ')}`,
        token: first.parentToken,
        pin: first.pin || '1234',
        avatar: first.avatar,
        phone: first.parentPhone || '',
        childrenCount: santriMatch.length,
        children: santriMatch,
        bindingLockCode: first.bindingLockCode || `BIND-ISB-${first.parentToken.toUpperCase()}`,
        bindingStatus: first.bindingStatus || (first.fingerprintStatus === 'APPROVED' ? 'LOCKED' : 'PENDING_APPROVAL'),
        isLocked: first.isLocked ?? (first.fingerprintStatus === 'APPROVED'),
        fingerprintCode: first.fingerprintCode || null,
        fingerprintStatus: first.fingerprintStatus || 'NOT_REGISTERED',
        fingerprintRegisteredAt: first.fingerprintRegisteredAt || null,
        fingerprintApprovedAt: first.fingerprintApprovedAt || null
      };
    }

    return null;
  }, [roleAccounts, santriList]);

  // Async token resolver that queries Cloud Firestore if local state hasn't synced yet
  const resolveTargetFromTokenAsync = useCallback(async (token) => {
    if (!token) return null;
    const cleanToken = token.trim().replace(/^#/, '');

    // 1. Try immediate synchronous resolution
    const local = resolveTargetFromToken(cleanToken);
    if (local) return local;

    // 2. Query Firestore if online
    if (!isDemoMode() && db) {
      try {
        const snap = await getDocs(collection(db, 'santri'));
        if (!snap.empty) {
          const remoteList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setSantriList(remoteList);
          const santriMatch = remoteList.filter(s => s.parentToken && s.parentToken.toLowerCase() === cleanToken.toLowerCase());
          if (santriMatch.length > 0) {
            const first = santriMatch[0];
            return {
              type: 'wali',
              role: 'wali',
              id: first.parentToken,
              name: first.parentName,
              title: `Wali Santri dari ${santriMatch.map(s => `${s.name} (${s.nis})`).join(' & ')}`,
              token: first.parentToken,
              pin: first.pin || '1234',
              avatar: first.avatar,
              phone: first.parentPhone || '',
              childrenCount: santriMatch.length,
              children: santriMatch,
              bindingLockCode: first.bindingLockCode || `BIND-ISB-${first.parentToken.toUpperCase()}`,
              bindingStatus: first.bindingStatus || (first.fingerprintStatus === 'APPROVED' ? 'LOCKED' : 'PENDING_APPROVAL'),
              isLocked: first.isLocked ?? (first.fingerprintStatus === 'APPROVED'),
              fingerprintCode: first.fingerprintCode || null,
              fingerprintStatus: first.fingerprintStatus || 'NOT_REGISTERED',
              fingerprintRegisteredAt: first.fingerprintRegisteredAt || null,
              fingerprintApprovedAt: first.fingerprintApprovedAt || null
            };
          }
        }
      } catch (err) {
        console.warn('Async token lookup error:', err);
      }
    }
    return null;
  }, [resolveTargetFromToken]);

  // LOGIN VIA PIN
  const loginWithPin = useCallback((targetAccount, inputPin) => {
    if (!targetAccount) throw new Error('Akun tidak ditemukan.');
    if (targetAccount.pin !== inputPin) {
      playSound('error');
      throw new Error('PIN yang Anda masukkan salah! Silakan coba lagi.');
    }

    const session = {
      type: targetAccount.type,
      role: targetAccount.role,
      id: targetAccount.id,
      name: targetAccount.name,
      title: targetAccount.title,
      token: targetAccount.token,
      avatar: targetAccount.avatar,
      authMethod: 'PIN',
      verifiedAt: new Date().toISOString()
    };

    setAuthSession(session);
    playSound('success');
    showToast(`Ahlan wa Sahlan, ${targetAccount.name}!`, 'success');
    return session;
  }, [showToast]);

  // LOGIN VIA BIOMETRIC (FINGERPRINT SCREEN TOUCH OR USB/HARDWARE)
  const loginWithBiometric = useCallback((targetAccount, method = 'TOUCH_SCREEN_FINGER') => {
    if (!targetAccount) throw new Error('Akun tidak ditemukan.');

    if (targetAccount.type === 'wali' && targetAccount.fingerprintStatus !== 'APPROVED') {
      playSound('error');
      throw new Error('Akses ditolak! Sidik jari Anda belum disetujui atau belum diverifikasi oleh Admin Ma\'had Imam Syafi\'i.');
    }

    const session = {
      type: targetAccount.type,
      role: targetAccount.role,
      id: targetAccount.id,
      name: targetAccount.name,
      title: targetAccount.title,
      token: targetAccount.token,
      avatar: targetAccount.avatar,
      authMethod: method,
      verifiedAt: new Date().toISOString()
    };

    setAuthSession(session);
    playSound('success');
    showToast(`Autentikasi Sidik Jari Berhasil! Selamat Datang, ${targetAccount.name}`, 'success');
    return session;
  }, [showToast]);

  // LOGOUT / LOCK SESSION
  const logout = useCallback(() => {
    setAuthSession(null);
    playSound('beep');
    showToast('Sesi dikunci. Silakan verifikasi untuk masuk kembali.', 'info');
  }, [showToast]);

  // SUPER ADMIN: Update Role Account (PIN, Token, Name, Phone)
  const updateRoleAccount = useCallback((roleId, updatedData) => {
    const updated = roleAccounts.map(r => r.id === roleId ? { ...r, ...updatedData } : r);
    setRoleAccounts(updated);
    broadcastState({ roleAccounts: updated });
    playSound('beep');
    showToast(`Pengaturan akun "${updatedData.name || roleId}" diperbarui!`, 'success');
  }, [roleAccounts, broadcastState, showToast]);

  // SUPER ADMIN: Add Santri
  const addSantri = useCallback(async (newSantri) => {
    const updated = [...santriList, newSantri];
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('success');
    showToast(`Santri "${newSantri.name}" berhasil didaftarkan!`, 'success');

    if (!isDemoMode() && db) {
      try {
        await addDoc(collection(db, 'santri'), newSantri);
      } catch (err) {
        console.error('Error adding santri to firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Update Santri
  const updateSantri = useCallback(async (santriId, data) => {
    const updated = santriList.map(s => s.id === santriId ? { ...s, ...data } : s);
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('beep');
    showToast(`Data santri berhasil diperbarui!`, 'success');

    if (!isDemoMode() && db) {
      try {
        await updateDoc(doc(db, 'santri', santriId), data);
      } catch (err) {
        console.error('Error updating santri on firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Delete Santri
  const deleteSantri = useCallback(async (santriId) => {
    const target = santriList.find(s => s.id === santriId);
    const updated = santriList.filter(s => s.id !== santriId);
    setSantriList(updated);
    broadcastState({ santriList: updated });
    showToast(`Santri ${target?.name || ''} telah dihapus.`, 'info');

    if (!isDemoMode() && db) {
      try {
        await deleteDoc(doc(db, 'santri', santriId));
      } catch (err) {
        console.error('Error deleting santri on firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Update Pesantren Info
  const updatePesantrenInfo = useCallback((info) => {
    setPesantrenInfo(info);
    broadcastState({ pesantrenInfo: info });
    showToast('Informasi Pesantren berhasil diperbarui!', 'success');
  }, [broadcastState, showToast]);

  // WALI SANTRI: Registrasi & Pembuatan Magic Link Mandiri (Multi-Anak)
  const registerWaliSantri = useCallback(async ({ parentName, parentPhone, childrenList }) => {
    const cleanPhone = formatPhoneNumber(parentPhone);
    const trimmedParentName = (parentName || '').trim();

    // 1. Anti-Duplikasi Nama & Nomor WhatsApp Wali Santri
    const duplicateParent = santriList.find(s => {
      const existingParentName = (s.parentName || '').trim().toLowerCase();
      const existingParentPhone = (s.parentPhone || '').replace(/\D/g, '');
      const targetPhoneClean = cleanPhone.replace(/\D/g, '');
      return (
        (existingParentName && existingParentName === trimmedParentName.toLowerCase()) ||
        (targetPhoneClean && existingParentPhone === targetPhoneClean)
      );
    });

    if (duplicateParent) {
      playSound('error');
      throw new Error(
        `Wali Santri "${trimmedParentName}" atau nomor WA "${cleanPhone}" sudah terdaftar dan terkunci di database (${duplicateParent.bindingLockCode || duplicateParent.parentToken}). Data ganda tidak diperbolehkan!`
      );
    }

    // 2. Anti-Duplikasi Anak / Santri (Saling Mengunci dengan Wali)
    childrenList.forEach((child) => {
      const childName = (child.name || '').trim();
      const childIsb = (child.isb || '').trim();
      if (!childName) return;

      const existingChild = santriList.find(s => {
        const sNis = (s.nis || '').toLowerCase();
        const sBarcode = (s.barcode || '').toLowerCase();
        const sCleanNis = sNis.replace(/[^0-9]/g, '');
        const targetCleanIsb = childIsb.toLowerCase().replace(/[^0-9]/g, '');

        const matchIsb = (targetCleanIsb && (sNis === childIsb.toLowerCase() || sBarcode === childIsb.toLowerCase() || sCleanNis === targetCleanIsb));
        const matchName = s.name.trim().toLowerCase() === childName.toLowerCase();
        return matchIsb || matchName;
      });

      if (existingChild) {
        if (existingChild.parentName || existingChild.parentToken) {
          playSound('error');
          throw new Error(
            `Santri "${childName}" (ISB/NIS: ${childIsb || existingChild.nis}) sudah terdaftar dan terikat resmi dengan wali santri "${existingChild.parentName}". Data ini telah terkunci dan tidak dapat didaftarkan kembali!`
          );
        }
      }
    });

    // 3. Generate PIN 4-digit Otomatis dan Binding Lock Code Unik
    const token = `wali-${cleanPhone.slice(-4)}-${Date.now().toString(36).slice(-4)}`;
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString(); // PIN acak 4 digit
    const bindingLockCode = `BIND-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let updatedSantriList = [...santriList];
    const affectedChildrenDocs = [];

    childrenList.forEach((child, idx) => {
      const childName = (child.name || '').trim();
      const childIsb = (child.isb || '').trim();
      if (!childName) return;

      // Find if exists
      const existingIdx = updatedSantriList.findIndex(s => {
        const sNis = (s.nis || '').toLowerCase();
        const sBarcode = (s.barcode || '').toLowerCase();
        const sCleanNis = sNis.replace(/[^0-9]/g, '');
        const targetCleanIsb = childIsb.toLowerCase().replace(/[^0-9]/g, '');

        return (
          (targetCleanIsb && (sNis === childIsb.toLowerCase() || sBarcode === childIsb.toLowerCase() || sCleanNis === targetCleanIsb)) ||
          s.name.trim().toLowerCase() === childName.toLowerCase()
        );
      });

      if (existingIdx >= 0) {
        // Update existing santri with parent info and new binding token
        const updatedDoc = {
          ...updatedSantriList[existingIdx],
          parentName: trimmedParentName,
          parentPhone: cleanPhone,
          parentToken: token,
          pin: generatedPin,
          bindingLockCode,
          bindingStatus: 'PENDING_APPROVAL',
          isLocked: false,
          fingerprintStatus: 'NOT_REGISTERED',
          fingerprintRegisteredAt: null,
          fingerprintApprovedAt: null,
          fingerprintCode: null
        };
        updatedSantriList[existingIdx] = updatedDoc;
        affectedChildrenDocs.push(updatedDoc);
      } else {
        // Create new santri entry
        const cleanIsbNumber = childIsb || `${new Date().getFullYear()}${String(updatedSantriList.length + 1).padStart(4, '0')}`;
        const newSantri = {
          id: `santri-gen-${Date.now()}-${idx}`,
          nis: cleanIsbNumber,
          name: childName,
          class: 'Santri Baru',
          halaqah: "Ma'had Imam Syafi'i",
          room: 'Asrama Santri',
          rfidTag: `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
          barcode: `ISB${cleanIsbNumber.replace(/[^0-9]/g, '') || '0000'}`,
          balance: 0,
          parentName: trimmedParentName,
          parentPhone: cleanPhone,
          parentToken: token,
          pin: generatedPin,
          bindingLockCode,
          bindingStatus: 'PENDING_APPROVAL',
          isLocked: false,
          fingerprintStatus: 'NOT_REGISTERED',
          fingerprintRegisteredAt: null,
          fingerprintApprovedAt: null,
          fingerprintCode: null,
          spendingLimit: {
            type: 'daily',
            amount: 25000,
            active: true
          },
          spendingUsed: {
            daily: 0,
            weekly: 0,
            monthly: 0,
            lastResetDate: new Date().toISOString().split('T')[0]
          },
          avatar: `https://images.unsplash.com/photo-${1534528741775 + idx}?w=150&auto=format&fit=crop&q=80`
        };
        updatedSantriList.push(newSantri);
        affectedChildrenDocs.push(newSantri);
      }
    });

    setSantriList(updatedSantriList);
    broadcastState({ santriList: updatedSantriList });
    playSound('success');

    // SYNC DIRECTLY TO CLOUD FIRESTORE FOR MULTI-DEVICE ACCESSIBILITY
    if (!isDemoMode() && db) {
      try {
        for (const docItem of affectedChildrenDocs) {
          const docRef = doc(db, 'santri', docItem.id);
          await setDoc(docRef, docItem, { merge: true });
        }
      } catch (err) {
        console.error('Firestore registration sync error:', err);
      }
    }

    // WhatsApp blocks 'localhost' from being clickable.
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname === ''
    );

    const publicDomain = pesantrenInfo.appBaseUrl || 'https://isb-portal.web.app/';
    const effectiveBase = isLocalhost ? publicDomain : `${window.location.origin}${window.location.pathname}`;
    const cleanBase = effectiveBase.endsWith('/') ? effectiveBase : `${effectiveBase}/`;
    const fullLink = `${cleanBase}#token=${token}`;
    const localLink = `${window.location.origin}${window.location.pathname}#token=${token}`;

    return {
      token,
      fullLink,
      localLink,
      cleanPhone,
      parentName: trimmedParentName,
      generatedPin,
      bindingLockCode,
      children: childrenList
    };
  }, [santriList, pesantrenInfo, broadcastState]);

  // WALI SANTRI: Permohonan Pendaftaran Sidik Jari (Enrollment)
  const requestFingerprintEnrollment = useCallback(async (parentToken, method = 'TOUCH_SCREEN_FINGER', customFingerCode = null) => {
    const fingerprintCode = customFingerCode || `FP-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const updated = santriList.map(s => {
      if (s.parentToken === parentToken) {
        return {
          ...s,
          fingerprintStatus: 'PENDING_APPROVAL',
          fingerprintCode,
          fingerprintRegisteredAt: nowIso,
          fingerprintRegisteredMethod: method
        };
      }
      return s;
    });
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('success');
    showToast('Sidik jari berhasil direkam! Menunggu persetujuan Admin Ma\'had.', 'info');

    // Sync to Firestore
    if (!isDemoMode() && db) {
      try {
        const matches = updated.filter(s => s.parentToken === parentToken);
        for (const item of matches) {
          await updateDoc(doc(db, 'santri', item.id), {
            fingerprintStatus: 'PENDING_APPROVAL',
            fingerprintCode,
            fingerprintRegisteredAt: nowIso,
            fingerprintRegisteredMethod: method
          });
        }
      } catch (err) {
        console.error('Error updating FP to Firestore:', err);
      }
    }

    return fingerprintCode;
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Setujui (Approve) Biometrik & Kunci Data Permanen (Anti-Ganda)
  const approveFingerprint = useCallback(async (parentToken) => {
    const nowIso = new Date().toISOString();
    const updated = santriList.map(s => {
      if (s.parentToken === parentToken) {
        return {
          ...s,
          fingerprintStatus: 'APPROVED',
          bindingStatus: 'LOCKED',
          isLocked: true,
          fingerprintApprovedAt: nowIso,
          fingerprintApprovalNote: 'Disetujui dan Data Terkunci Resmi oleh Admin Ma\'had'
        };
      }
      return s;
    });
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('success');
    showToast('Sidik jari disetujui & data wali-santri resmi dikunci!', 'success');

    // Sync to Firestore
    if (!isDemoMode() && db) {
      try {
        const matches = updated.filter(s => s.parentToken === parentToken);
        for (const item of matches) {
          await updateDoc(doc(db, 'santri', item.id), {
            fingerprintStatus: 'APPROVED',
            bindingStatus: 'LOCKED',
            isLocked: true,
            fingerprintApprovedAt: nowIso,
            fingerprintApprovalNote: 'Disetujui dan Data Terkunci Resmi oleh Admin Ma\'had'
          });
        }
      } catch (err) {
        console.error('Error approving FP on Firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Tolak (Reject) Biometrik Wali Santri
  const rejectFingerprint = useCallback(async (parentToken, reason = 'Data identitas tidak sesuai') => {
    const updated = santriList.map(s => {
      if (s.parentToken === parentToken) {
        return {
          ...s,
          fingerprintStatus: 'REJECTED',
          fingerprintApprovalNote: reason
        };
      }
      return s;
    });
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('beep');
    showToast('Pendaftaran biometrik ditolak.', 'error');

    // Sync to Firestore
    if (!isDemoMode() && db) {
      try {
        const matches = updated.filter(s => s.parentToken === parentToken);
        for (const item of matches) {
          await updateDoc(doc(db, 'santri', item.id), {
            fingerprintStatus: 'REJECTED',
            fingerprintApprovalNote: reason
          });
        }
      } catch (err) {
        console.error('Error rejecting FP on Firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Reset Biometrik Wali Santri
  const resetFingerprint = useCallback(async (parentToken) => {
    const updated = santriList.map(s => {
      if (s.parentToken === parentToken) {
        return {
          ...s,
          fingerprintStatus: 'NOT_REGISTERED',
          fingerprintRegisteredAt: null,
          fingerprintApprovedAt: null,
          fingerprintApprovalNote: null
        };
      }
      return s;
    });
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('beep');
    showToast('Status biometrik berhasil direset.', 'info');

    // Sync to Firestore
    if (!isDemoMode() && db) {
      try {
        const matches = updated.filter(s => s.parentToken === parentToken);
        for (const item of matches) {
          await updateDoc(doc(db, 'santri', item.id), {
            fingerprintStatus: 'NOT_REGISTERED',
            fingerprintRegisteredAt: null,
            fingerprintApprovedAt: null,
            fingerprintApprovalNote: null
          });
        }
      } catch (err) {
        console.error('Error resetting FP on Firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // Spending Limit Verification
  const checkSpendingLimit = useCallback((santri, amountToSpend) => {
    if (!santri) return { allowed: false, reason: "Data santri tidak ditemukan." };
    if (santri.balance < amountToSpend) {
      return {
        allowed: false,
        reason: `Saldo santri tidak mencukupi. (Saldo: ${formatRupiah(santri.balance)}, Belanja: ${formatRupiah(amountToSpend)})`,
        remaining: santri.balance
      };
    }

    const limitConfig = santri.spendingLimit || { active: false, type: 'none', amount: 0 };
    if (!limitConfig.active || limitConfig.type === 'none' || !limitConfig.amount) {
      return { allowed: true, reason: "Bebas batasan belanja.", remaining: santri.balance };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const used = santri.spendingUsed || { daily: 0, weekly: 0, monthly: 0, lastResetDate: todayStr };
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
      return { allowed: true, reason: `Dalam batas harian.`, remaining: remainingDaily - amountToSpend };
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

  // Update Santri Spending Limit
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

    const uniqueCode = Math.floor(100 + Math.random() * 900);
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

  // Approve Top-up Request
  const approveTopup = useCallback(async (topupId) => {
    const request = topupRequests.find(t => t.id === topupId);
    if (!request || request.status !== 'PENDING') return;

    const targetSantri = santriList.find(s => s.id === request.santriId);
    if (!targetSantri) return;

    const previousBalance = targetSantri.balance;
    const currentBalance = previousBalance + request.amount;

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
        return { ...s, balance: currentBalance };
      }
      return s;
    });

    const updatedTopups = topupRequests.map(t => {
      if (t.id === topupId) {
        return { ...t, status: 'APPROVED', approvedAt: new Date().toISOString() };
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

  // Save Kantin Product
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

  // Delete Kantin Product
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

  // Pay SPP
  const paySppBill = useCallback(async (billId, santriId, cashierName = 'Kasir Keuangan') => {
    const bill = sppBills.find(b => b.id === billId);
    const santri = santriList.find(s => s.id === santriId);
    if (!bill || !santri) throw new Error('Data tagihan atau santri tidak valid');

    if (santri.balance < bill.amount) {
      throw new Error(`Saldo santri (${formatRupiah(santri.balance)}) tidak mencukupi untuk tagihan ini (${formatRupiah(bill.amount)})`);
    }

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
        return { ...b, status: 'PAID', paidAt: new Date().toISOString() };
      }
      return b;
    });

    setSppBills(updatedBills);
    broadcastState({ sppBills: updatedBills });
    showToast(`Tagihan ${bill.title} berhasil lunas!`, 'success');
  }, [sppBills, santriList, recordTransaction, broadcastState, showToast]);

  const value = {
    // Auth & Identity State
    authSession,
    currentRole,
    urlToken,
    setUrlToken,
    roleAccounts,
    resolveTargetFromToken,
    resolveTargetFromTokenAsync,
    loginWithPin,
    loginWithBiometric,
    logout,
    updateRoleAccount,

    // Pesantren & Admin configs
    pesantrenInfo,
    updatePesantrenInfo,

    // Santri management
    santriList,
    setSantriList,
    addSantri,
    updateSantri,
    deleteSantri,
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

    // Wali Santri & Biometrics Enrollment
    registerWaliSantri,
    requestFingerprintEnrollment,
    approveFingerprint,
    rejectFingerprint,
    resetFingerprint,

    // Theme (Light / Dark)
    theme,
    setTheme,
    toggleTheme,

    // Toast & Alerts
    toast,
    showToast,
    hideToast
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
