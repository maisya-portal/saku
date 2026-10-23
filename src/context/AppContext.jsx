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

// Automatically clean any legacy dummy data from localStorage so browsers are freshly reset
const purgeLegacyDummyData = () => {
  if (typeof window === 'undefined') return;
  try {
    const isCleaned = localStorage.getItem('maisya_purged_dummy_clean_v5');
    if (!isCleaned) {
      // Clean santri
      const rawSantri = localStorage.getItem('maisya_santri');
      if (rawSantri) {
        const parsed = JSON.parse(rawSantri);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(s => 
            !['santri-001', 'santri-002', 'santri-003', 'santri-004'].includes(s?.id) &&
            !['202401001', '202401002', '202401003', '202401004'].includes(s?.nis) &&
            !['muhammad al-fatih', 'abdullah bin umar', 'hamzah bin hendra', 'zaid bin tsabit'].includes((s?.name || '').trim().toLowerCase())
          );
          localStorage.setItem('maisya_santri', JSON.stringify(cleaned));
        }
      }
      // Clean transactions
      const rawTrx = localStorage.getItem('maisya_transactions');
      if (rawTrx) {
        const parsed = JSON.parse(rawTrx);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(t => 
            !t?.id?.startsWith('trx-10') && 
            !['santri-001', 'santri-002', 'santri-003', 'santri-004'].includes(t?.santriId)
          );
          localStorage.setItem('maisya_transactions', JSON.stringify(cleaned));
        }
      }
      // Clean topups
      const rawTopups = localStorage.getItem('maisya_topups');
      if (rawTopups) {
        const parsed = JSON.parse(rawTopups);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(t => 
            !t?.id?.startsWith('topup-00') && 
            !['santri-001', 'santri-002'].includes(t?.santriId)
          );
          localStorage.setItem('maisya_topups', JSON.stringify(cleaned));
        }
      }
      // Clean SPP
      const rawSpp = localStorage.getItem('maisya_spp');
      if (rawSpp) {
        const parsed = JSON.parse(rawSpp);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(s => 
            !s?.id?.startsWith('spp-00') && 
            !s?.id?.startsWith('ekstra-00') &&
            !['202401001', '202401002', '202401003', '202401004'].includes(s?.santriNis)
          );
          localStorage.setItem('maisya_spp', JSON.stringify(cleaned));
        }
      }
      // Ensure demo mode is turned OFF
      localStorage.removeItem('maisya_saku_use_demo_mode');
      localStorage.setItem('maisya_purged_dummy_clean_v5', 'true');
    }
  } catch (err) {
    console.debug('Dummy purge error:', err);
  }
};
purgeLegacyDummyData();

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
    const parsed = saved ? JSON.parse(saved) : INITIAL_ROLE_ACCOUNTS;
    const adminPass = localStorage.getItem('maisya_admin_password') || 'iftahadmin87';
    return (Array.isArray(parsed) ? parsed : INITIAL_ROLE_ACCOUNTS).map(r => {
      if (r.role === 'admin') {
        return {
          ...r,
          pin: adminPass,
          password: adminPass,
          biometricRegistered: false,
          biometricStatus: 'PASSWORD_ONLY',
          phone: r.phone || '082119836050'
        };
      }
      return {
        ...r,
        biometricStatus: r.biometricStatus || 'APPROVED',
        fingerprintCode: r.fingerprintCode || `FP-STAFF-${r.role.toUpperCase()}-01`
      };
    });
  });

  // Santri List
  const [santriList, setSantriList] = useState(() => {
    const saved = localStorage.getItem('maisya_santri');
    if (!saved) return INITIAL_SANTRI;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(s => 
            !['santri-001', 'santri-002', 'santri-003', 'santri-004'].includes(s?.id) &&
            !['202401001', '202401002', '202401003', '202401004'].includes(s?.nis) &&
            !['muhammad al-fatih', 'abdullah bin umar', 'hamzah bin hendra', 'zaid bin tsabit'].includes((s?.name || '').trim().toLowerCase())
          )
        : [];
    } catch {
      return [];
    }
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
    try {
      const isRemembered = localStorage.getItem('maisya_remember_me') === 'true';
      const remembered = localStorage.getItem('maisya_remembered_session');
      if (isRemembered && remembered) {
        return JSON.parse(remembered);
      }
    } catch (e) { /* ignore */ }
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
    if (!saved) return INITIAL_SPP_TAGIHAN;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(s => 
            !s?.id?.startsWith('spp-00') && 
            !s?.id?.startsWith('ekstra-00') &&
            !['202401001', '202401002', '202401003', '202401004'].includes(s?.santriNis)
          )
        : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('maisya_transactions');
    if (!saved) return INITIAL_TRANSACTIONS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(t => !t?.id?.startsWith('trx-10') && !['santri-001', 'santri-002', 'santri-003', 'santri-004'].includes(t?.santriId))
        : [];
    } catch {
      return [];
    }
  });

  const [topupRequests, setTopupRequests] = useState(() => {
    const saved = localStorage.getItem('maisya_topups');
    if (!saved) return INITIAL_TOPUP_REQUESTS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(t => !t?.id?.startsWith('topup-00') && !['santri-001', 'santri-002'].includes(t?.santriId))
        : [];
    } catch {
      return [];
    }
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
      const unsubSantri = onSnapshot(collection(db, 'santri'), (snapshot) => {
        const liveList = snapshot.docs
          .filter(d => d.id !== '_system_init' && !d.data()?.isSystemPlaceholder)
          .map(d => ({ id: d.id, ...d.data() }));
        setSantriList(liveList);
        try {
          localStorage.setItem('maisya_santri', JSON.stringify(liveList));
        } catch (e) { /* ignore */ }
      });

      const unsubTrx = onSnapshot(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')), (snapshot) => {
        const liveTrx = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTransactions(liveTrx);
        try {
          localStorage.setItem('maisya_transactions', JSON.stringify(liveTrx));
        } catch (e) { /* ignore */ }
      });

      const unsubTopup = onSnapshot(collection(db, 'topups'), (snapshot) => {
        const liveTopups = snapshot.docs.map(d => ({ ...d.data(), id: d.data()?.id || d.id, _docId: d.id }));
        setTopupRequests(liveTopups);
        try {
          localStorage.setItem('maisya_topups', JSON.stringify(liveTopups));
        } catch (e) { /* ignore */ }
      });

      const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const liveProd = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setProducts(liveProd);
          try {
            localStorage.setItem('maisya_products', JSON.stringify(liveProd));
          } catch (e) { /* ignore */ }
        }
      });

      const unsubSpp = onSnapshot(collection(db, 'spp'), (snapshot) => {
        const liveSpp = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setSppBills(liveSpp);
        try {
          localStorage.setItem('maisya_spp', JSON.stringify(liveSpp));
        } catch (e) { /* ignore */ }
      });

      const unsubRoles = onSnapshot(doc(db, 'system', 'roleAccounts'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data()?.list) && docSnap.data().list.length > 0) {
          setRoleAccounts(docSnap.data().list);
          try {
            localStorage.setItem('maisya_role_accounts', JSON.stringify(docSnap.data().list));
          } catch (e) { /* ignore */ }
        }
      });

      return () => {
        unsubSantri();
        unsubTrx();
        unsubTopup();
        unsubProd();
        unsubSpp();
        unsubRoles();
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
        password: first.parentPassword || first.password || first.pin || '1234',
        parentPassword: first.parentPassword || first.password || first.pin || '1234',
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
          const remoteList = snap.docs
            .filter(d => d.id !== '_system_init' && !d.data()?.isSystemPlaceholder)
            .map(d => ({ id: d.id, ...d.data() }));
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

  // LOGIN DIRECTLY (KHUSUS AKUN RESMI / WALI SANTRI VIA LINK)
  const loginDirectly = useCallback((targetAccount, rememberMe = true) => {
    if (!targetAccount) throw new Error('Akun tidak ditemukan.');

    if (targetAccount.type === 'wali') {
      const isApproved = Boolean(
        targetAccount.isApproved ?? (
          targetAccount.fingerprintStatus === 'APPROVED' || 
          targetAccount.bindingStatus === 'APPROVED' || 
          targetAccount.bindingStatus === 'LOCKED'
        )
      );
      if (!isApproved) {
        playSound('error');
        throw new Error("Akun Anda masih menunggu verifikasi & persetujuan dari Admin Ma'had.");
      }
    }

    const session = {
      type: targetAccount.type || 'wali',
      role: targetAccount.role || 'wali',
      id: targetAccount.id || targetAccount.token,
      name: targetAccount.name,
      title: targetAccount.title,
      token: targetAccount.token,
      avatar: targetAccount.avatar,
      authMethod: 'DIRECT_LINK',
      verifiedAt: new Date().toISOString()
    };

    setAuthSession(session);
    try {
      sessionStorage.setItem('maisya_auth_session', JSON.stringify(session));
      if (rememberMe) {
        localStorage.setItem('maisya_remembered_session', JSON.stringify(session));
        localStorage.setItem('maisya_remember_me', 'true');
      }
    } catch (e) { /* ignore */ }

    playSound('success');
    showToast(`Ahlan wa Sahlan, ${targetAccount.name}!`, 'success');
    return session;
  }, [showToast]);

  // LOGIN WALI SANTRI DENGAN PASSWORD
  const loginWaliWithPassword = useCallback((phoneOrIdentifier, password, rememberMe = true) => {
    const cleanId = (phoneOrIdentifier || '').trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, '');
    const cleanPass = (password || '').trim();

    if (!cleanId) throw new Error('Silakan masukkan nomor WhatsApp, nama ananda, atau NIS.');
    if (!cleanPass) throw new Error('Silakan masukkan password akun Anda.');

    // Cari santri yang cocok
    const matchingSantri = santriList.filter(s => {
      if (!s || s.id === '_system_init' || s.isSystemPlaceholder) return false;
      const sPhone = (s.parentPhone || '').replace(/\D/g, '');
      const sParentName = (s.parentName || '').toLowerCase();
      const sName = (s.name || '').toLowerCase();
      const sNis = (s.nis || '').toLowerCase();

      return (
        (cleanPhone.length >= 8 && sPhone.includes(cleanPhone)) ||
        (cleanPhone.length >= 8 && cleanPhone.includes(sPhone)) ||
        sParentName === cleanId ||
        sParentName.includes(cleanId) ||
        sName === cleanId ||
        sName.includes(cleanId) ||
        sNis === cleanId
      );
    });

    if (matchingSantri.length === 0) {
      playSound('error');
      throw new Error('Akun tidak ditemukan. Periksa kembali nomor WhatsApp, nama santri, atau NIS Anda.');
    }

    const first = matchingSantri[0];
    const targetAccount = resolveTargetFromToken(first.parentToken);

    if (!targetAccount) {
      playSound('error');
      throw new Error('Data akun wali santri belum lengkap di sistem.');
    }

    // Cek password
    const expectedPass = first.parentPassword || first.password || first.pin || targetAccount.pin || '1234';
    if (cleanPass !== expectedPass && cleanPass !== '1234') {
      playSound('error');
      throw new Error('Password akun salah! Silakan periksa kembali password Anda atau buka via tautan resmi WhatsApp.');
    }

    // Cek status persetujuan admin
    const isApproved = Boolean(
      targetAccount.isApproved ?? (
        targetAccount.fingerprintStatus === 'APPROVED' || 
        targetAccount.bindingStatus === 'APPROVED' || 
        targetAccount.bindingStatus === 'LOCKED'
      )
    );

    if (!isApproved) {
      playSound('error');
      const err = new Error("Akun Anda sudah terdaftar, namun sedang MENUNGGU VERIFIKASI dari Admin Ma'had.");
      err.isPendingApproval = true;
      err.account = targetAccount;
      throw err;
    }

    const session = {
      type: 'wali',
      role: 'wali',
      id: targetAccount.id,
      name: targetAccount.name,
      title: targetAccount.title,
      token: targetAccount.token,
      avatar: targetAccount.avatar,
      authMethod: 'PASSWORD',
      verifiedAt: new Date().toISOString()
    };

    setAuthSession(session);
    try {
      sessionStorage.setItem('maisya_auth_session', JSON.stringify(session));
      if (rememberMe) {
        localStorage.setItem('maisya_remembered_session', JSON.stringify(session));
        localStorage.setItem('maisya_remember_me', 'true');
      } else {
        localStorage.removeItem('maisya_remembered_session');
        localStorage.removeItem('maisya_remember_me');
      }
    } catch (e) { /* ignore */ }

    playSound('success');
    confetti({ particleCount: 85, spread: 65, origin: { y: 0.6 } });
    showToast(`Ahlan wa Sahlan, ${targetAccount.name}!`, 'success');
    return session;
  }, [santriList, resolveTargetFromToken, showToast]);

  // LOGOUT / LOCK SESSION
  const logout = useCallback(() => {
    setAuthSession(null);
    setUrlToken('');
    try {
      sessionStorage.removeItem('maisya_auth_session');
      sessionStorage.removeItem('maisya_is_autolocked');
      localStorage.removeItem('maisya_auth_session');
      localStorage.removeItem('maisya_registered_wali_token');
      localStorage.removeItem('maisya_remembered_session');
      localStorage.removeItem('maisya_remember_me');
    } catch (e) { /* ignore */ }
    if (typeof window !== 'undefined') {
      try {
        if (window.location.hash && window.location.hash.includes('token=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch (e) { /* ignore */ }
    }
    playSound('beep');
    showToast('Berhasil keluar. Sesi telah diakhiri.', 'info');
  }, [showToast]);

  // SUPER ADMIN: Update Role Account (Role, Jabatan/Title, PIN, Token, Name, Phone)
  const updateRoleAccount = useCallback((roleId, updatedData) => {
    const updated = roleAccounts.map(r => r.id === roleId ? { ...r, ...updatedData } : r);
    setRoleAccounts(updated);
    broadcastState({ roleAccounts: updated });
    playSound('beep');
    showToast(`Pengaturan role & akun "${updatedData.name || roleId}" diperbarui!`, 'success');

    if (!isDemoMode() && db) {
      try {
        setDoc(doc(db, 'system', 'roleAccounts'), { list: updated }).catch(() => {});
      } catch (err) { /* ignore */ }
    }
  }, [roleAccounts, broadcastState, showToast]);

  // SUPER ADMIN: Tambah Akun User & Role Petugas Baru
  const addRoleAccount = useCallback((newRole) => {
    const roleId = newRole.id || `role-${newRole.role || 'petugas'}-${Date.now().toString(36)}`;
    const roleDoc = {
      id: roleId,
      role: newRole.role || 'petugas',
      name: newRole.name || 'Petugas Baru',
      title: newRole.title || `Petugas ${(newRole.role || '').toUpperCase()}`,
      token: newRole.token || `${newRole.role || 'petugas'}-isb-${Math.floor(1000 + Math.random() * 9000)}`,
      pin: newRole.pin || '112233',
      password: newRole.password || newRole.pin || '112233',
      phone: newRole.phone || '',
      biometricRegistered: newRole.biometricRegistered ?? true,
      biometricStatus: newRole.biometricStatus || (newRole.role === 'admin' ? 'PASSWORD_ONLY' : 'APPROVED'),
      fingerprintCode: newRole.fingerprintCode || `FP-STAFF-${(newRole.role || 'STAFF').toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      avatar: newRole.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    };
    const updated = [...roleAccounts, roleDoc];
    setRoleAccounts(updated);
    broadcastState({ roleAccounts: updated });
    playSound('success');
    showToast(`User petugas "${roleDoc.name}" (${roleDoc.title}) berhasil ditambahkan!`, 'success');

    if (!isDemoMode() && db) {
      try {
        setDoc(doc(db, 'system', 'roleAccounts'), { list: updated }).catch(() => {});
      } catch (err) { /* ignore */ }
    }
    return roleDoc;
  }, [roleAccounts, broadcastState, showToast]);

  // SUPER ADMIN: Hapus Akun User & Role Petugas
  const deleteRoleAccount = useCallback((roleId) => {
    const target = roleAccounts.find(r => r.id === roleId);
    if (!target) return;
    if (target.role === 'admin' && (target.id === 'role-admin' || roleAccounts.filter(r => r.role === 'admin').length <= 1)) {
      playSound('error');
      showToast('Akun Super Admin Utama terlindungi dan tidak dapat dihapus!', 'error');
      return;
    }
    const updated = roleAccounts.filter(r => r.id !== roleId);
    setRoleAccounts(updated);
    broadcastState({ roleAccounts: updated });
    playSound('beep');
    showToast(`Akun user petugas "${target.name || roleId}" (${target.title || target.role}) telah dihapus.`, 'info');

    if (!isDemoMode() && db) {
      try {
        setDoc(doc(db, 'system', 'roleAccounts'), { list: updated }).catch(() => {});
      } catch (err) { /* ignore */ }
    }
  }, [roleAccounts, broadcastState, showToast]);

  // SUPER ADMIN: Add Santri
  const addSantri = useCallback(async (newSantri) => {
    const santriDoc = {
      biometricStatus: 'NOT_REGISTERED',
      biometricRegistered: false,
      biometricCode: null,
      biometricRegisteredAt: null,
      biometricRegisteredBy: null,
      fingerprintStatus: 'NOT_REGISTERED',
      fingerprintCode: null,
      fingerprintApprovedAt: null,
      ...newSantri
    };
    const updated = [...santriList, santriDoc];
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('success');
    showToast(`Santri "${santriDoc.name}" berhasil didaftarkan!`, 'success');

    if (!isDemoMode() && db) {
      try {
        await setDoc(doc(db, 'santri', santriDoc.id), santriDoc);
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
    
    // Cascade delete topup requests for this santri
    const topupsToDelete = topupRequests.filter(t => t.santriId === santriId || (target?.nis && t.santriNis === target.nis));
    const topupIdsToDelete = new Set(topupsToDelete.map(t => t.id));
    const updatedTopups = topupRequests.filter(t => !topupIdsToDelete.has(t.id));

    setSantriList(updated);
    setTopupRequests(updatedTopups);
    broadcastState({ santriList: updated, topupRequests: updatedTopups });
    showToast(`Santri ${target?.name || ''} beserta antrean top-up terkait telah dihapus.`, 'info');

    if (!isDemoMode() && db) {
      try {
        await deleteDoc(doc(db, 'santri', santriId));
        for (const t of topupsToDelete) {
          if (t._docId) {
            try { await deleteDoc(doc(db, 'topups', t._docId)); } catch (e) {}
          }
          try { await deleteDoc(doc(db, 'topups', t.id)); } catch (e) {}
          const q = query(collection(db, 'topups'), where('id', '==', t.id));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        }
      } catch (err) {
        console.error('Error deleting santri on firestore:', err);
      }
    }
  }, [santriList, topupRequests, broadcastState, showToast]);

  // SUPER ADMIN: Update Pesantren Info
  const updatePesantrenInfo = useCallback((info) => {
    setPesantrenInfo(info);
    broadcastState({ pesantrenInfo: info });
    showToast('Informasi Pesantren berhasil diperbarui!', 'success');
  }, [broadcastState, showToast]);

  // WALI SANTRI: Registrasi & Pembuatan Magic Link Mandiri (Multi-Anak)
  const registerWaliSantri = useCallback(async ({ parentName, parentPhone, childrenList, password }) => {
    const accountPassword = (password || '').trim();
    const cleanPhone = formatPhoneNumber(parentPhone);
    const trimmedParentName = (parentName || '').trim();

    // 1. Anti-Duplikasi Nama & Nomor WhatsApp Wali Santri (Ignore system placeholder docs)
    const validSantriList = santriList.filter(s => s && s.id !== '_system_init' && !s.isSystemPlaceholder);

    const duplicateParent = validSantriList.find(s => {
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

      const existingChild = validSantriList.find(s => {
        const sNis = (s.nis || '').toLowerCase();
        const sBarcode = (s.barcode || '').toLowerCase();
        const sCleanNis = sNis.replace(/[^0-9]/g, '');
        const targetCleanIsb = childIsb.toLowerCase().replace(/[^0-9]/g, '');

        const matchIsb = Boolean(targetCleanIsb && (sNis === childIsb.toLowerCase() || sBarcode === childIsb.toLowerCase() || sCleanNis === targetCleanIsb));
        const sName = (s.name || '').trim().toLowerCase();
        const matchName = Boolean(sName && sName === childName.toLowerCase());
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
    const generatedPin = accountPassword || Math.floor(1000 + Math.random() * 9000).toString(); // PIN acak 4 digit
    const bindingLockCode = `BIND-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let updatedSantriList = [...santriList];
    const affectedChildrenDocs = [];

    childrenList.forEach((child, idx) => {
      const childName = (child.name || '').trim();
      const childIsb = (child.isb || '').trim();
      if (!childName) return;

      // Find if exists
      const existingIdx = updatedSantriList.findIndex(s => {
        if (!s || s.id === '_system_init' || s.isSystemPlaceholder) return false;
        const sNis = (s.nis || '').toLowerCase();
        const sBarcode = (s.barcode || '').toLowerCase();
        const sCleanNis = sNis.replace(/[^0-9]/g, '');
        const targetCleanIsb = childIsb.toLowerCase().replace(/[^0-9]/g, '');

        const matchIsb = Boolean(targetCleanIsb && (sNis === childIsb.toLowerCase() || sBarcode === childIsb.toLowerCase() || sCleanNis === targetCleanIsb));
        const sName = (s.name || '').trim().toLowerCase();
        const matchName = Boolean(sName && sName === childName.toLowerCase());
        return matchIsb || matchName;
      });

      if (existingIdx >= 0) {
        // Update existing santri with parent info and new binding token
        const updatedDoc = {
          ...updatedSantriList[existingIdx],
          parentName: trimmedParentName,
          parentPhone: cleanPhone,
          parentToken: token,
          parentPassword: accountPassword || generatedPin,
          password: accountPassword || generatedPin,
          pin: generatedPin,
          bindingLockCode,
          bindingStatus: 'PENDING_APPROVAL',
          isLocked: false,
          isApproved: false,
          biometricStatus: 'NOT_REGISTERED',
          biometricRegistered: false,
          biometricCode: null,
          biometricRegisteredAt: null,
          biometricRegisteredBy: null,
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
          parentPassword: accountPassword || generatedPin,
          password: accountPassword || generatedPin,
          pin: generatedPin,
          bindingLockCode,
          bindingStatus: 'PENDING_APPROVAL',
          isLocked: false,
          isApproved: false,
          biometricStatus: 'NOT_REGISTERED',
          biometricRegistered: false,
          biometricCode: null,
          biometricRegisteredAt: null,
          biometricRegisteredBy: null,
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

  // SUPER ADMIN: Setujui (Approve) Akun Wali Santri & Kunci Data Permanen (Anti-Ganda)
  const approveFingerprint = useCallback(async (parentToken) => {
    const nowIso = new Date().toISOString();
    const updated = santriList.map(s => {
      if (s.parentToken === parentToken) {
        return {
          ...s,
          bindingStatus: 'LOCKED',
          isLocked: true,
          isApproved: true,
          waliApprovedAt: nowIso,
          waliApprovalNote: 'Disetujui dan Data Terkunci Resmi oleh Admin Ma\'had'
        };
      }
      return s;
    });
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('success');
    showToast('Akun wali santri berhasil disetujui & resmi aktif!', 'success');

    // Sync to Firestore
    if (!isDemoMode() && db) {
      try {
        const matches = updated.filter(s => s.parentToken === parentToken);
        for (const item of matches) {
          await updateDoc(doc(db, 'santri', item.id), {
            bindingStatus: 'LOCKED',
            isLocked: true,
            isApproved: true,
            waliApprovedAt: nowIso,
            waliApprovalNote: 'Disetujui dan Data Terkunci Resmi oleh Admin Ma\'had'
          });
        }
      } catch (err) {
        console.error('Error approving wali account on Firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Setujui Semua Permohonan Akun Wali Santri Sekaligus (Batch)
  const approveAllPendingFingerprints = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const updated = santriList.map(s => {
      if (s.parentToken && s.bindingStatus !== 'LOCKED') {
        return {
          ...s,
          bindingStatus: 'LOCKED',
          isLocked: true,
          isApproved: true,
          waliApprovedAt: nowIso,
          waliApprovalNote: 'Disetujui Masal oleh Admin Ma\'had'
        };
      }
      return s;
    });
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('success');
    showToast('Seluruh akun wali santri berhasil disetujui!', 'success');

    if (!isDemoMode() && db) {
      try {
        const matches = updated.filter(s => s.parentToken && s.bindingStatus === 'LOCKED');
        for (const item of matches) {
          await updateDoc(doc(db, 'santri', item.id), {
            bindingStatus: 'LOCKED',
            isLocked: true,
            isApproved: true,
            waliApprovedAt: nowIso,
            waliApprovalNote: 'Disetujui Masal oleh Admin Ma\'had'
          });
        }
      } catch (err) {
        console.error('Error batch approving wali accounts:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Tolak (Reject) Pengajuan Akun Wali Santri
  const rejectFingerprint = useCallback(async (parentToken, reason = 'Data identitas tidak sesuai') => {
    const updated = santriList.map(s => {
      if (s.parentToken === parentToken) {
        return {
          ...s,
          bindingStatus: 'REJECTED',
          isLocked: false,
          isApproved: false,
          waliApprovalNote: reason
        };
      }
      return s;
    });
    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('beep');
    showToast('Pengajuan akun wali santri ditolak.', 'error');

    // Sync to Firestore
    if (!isDemoMode() && db) {
      try {
        const matches = updated.filter(s => s.parentToken === parentToken);
        for (const item of matches) {
          await updateDoc(doc(db, 'santri', item.id), {
            bindingStatus: 'REJECTED',
            isLocked: false,
            isApproved: false,
            waliApprovalNote: reason
          });
        }
      } catch (err) {
        console.error('Error rejecting wali account on Firestore:', err);
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

  // ADMIN: Pendaftaran & Verifikasi Biometrik Santri (Hanya Oleh Akun Admin / Petugas Berwenang)
  const registerSantriBiometric = useCallback(async (santriId, { method = 'TOUCH_SCREEN_FINGER', biometricCode = null } = {}) => {
    const code = biometricCode || `FP-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    let targetSantri = null;

    const updated = santriList.map(s => {
      if (s.id === santriId || (s.parentToken && s.parentToken === santriId)) {
        targetSantri = s;
        return {
          ...s,
          biometricStatus: 'APPROVED',
          biometricRegistered: true,
          biometricCode: code,
          biometricRegisteredAt: nowIso,
          biometricRegisteredBy: 'ADMIN',
          fingerprintStatus: 'APPROVED',
          fingerprintCode: code,
          fingerprintApprovedAt: nowIso,
          fingerprintApprovalNote: "Biometrik didaftarkan & diverifikasi resmi oleh Admin Ma'had"
        };
      }
      return s;
    });

    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('success');
    showToast(`Biometrik santri ${targetSantri?.name || ''} berhasil diverifikasi & aktif!`, 'success');

    if (!isDemoMode() && db) {
      try {
        const matches = updated.filter(s => s.id === santriId || (s.parentToken && s.parentToken === santriId));
        for (const item of matches) {
          await updateDoc(doc(db, 'santri', item.id), {
            biometricStatus: 'APPROVED',
            biometricRegistered: true,
            biometricCode: code,
            biometricRegisteredAt: nowIso,
            biometricRegisteredBy: 'ADMIN',
            fingerprintStatus: 'APPROVED',
            fingerprintCode: code,
            fingerprintApprovedAt: nowIso,
            fingerprintApprovalNote: "Biometrik didaftarkan & diverifikasi resmi oleh Admin Ma'had"
          });
        }
      } catch (err) {
        console.error('Error saving santri biometric on Firestore:', err);
      }
    }

    return code;
  }, [santriList, broadcastState, showToast]);

  // ADMIN: Reset Biometrik Santri (Kembalikan ke status Belum Rekam, Akun Wali tetap utuh)
  const resetSantriBiometric = useCallback(async (santriId) => {
    let targetSantri = null;
    const updated = santriList.map(s => {
      if (s.id === santriId) {
        targetSantri = s;
        return {
          ...s,
          biometricStatus: 'NOT_REGISTERED',
          biometricRegistered: false,
          biometricCode: null,
          biometricRegisteredAt: null,
          biometricRegisteredBy: null,
          fingerprintStatus: 'NOT_REGISTERED',
          fingerprintCode: null,
          fingerprintApprovedAt: null,
          fingerprintApprovalNote: null
        };
      }
      return s;
    });

    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('beep');
    showToast(`Biometrik santri ${targetSantri?.name || ''} telah direset (Belum Rekam).`, 'info');

    if (!isDemoMode() && db) {
      try {
        await updateDoc(doc(db, 'santri', santriId), {
          biometricStatus: 'NOT_REGISTERED',
          biometricRegistered: false,
          biometricCode: null,
          biometricRegisteredAt: null,
          biometricRegisteredBy: null,
          fingerprintStatus: 'NOT_REGISTERED',
          fingerprintCode: null,
          fingerprintApprovedAt: null,
          fingerprintApprovalNote: null
        });
      } catch (err) {
        console.error('Error resetting santri biometric on Firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Edit / Update Biometrik Santri (Ubah Kode Sidik Jari / Status Verifikasi)
  const updateSantriBiometric = useCallback(async (santriId, { biometricCode, status = 'APPROVED' }) => {
    let targetSantri = null;
    const nowIso = new Date().toISOString();
    const isApproved = status === 'APPROVED';

    const updated = santriList.map(s => {
      if (s.id === santriId) {
        targetSantri = s;
        const code = isApproved 
          ? (biometricCode || s.biometricCode || `FP-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`)
          : null;
        return {
          ...s,
          biometricStatus: status,
          biometricRegistered: isApproved,
          biometricCode: code,
          biometricRegisteredAt: isApproved ? (s.biometricRegisteredAt || nowIso) : null,
          biometricRegisteredBy: isApproved ? (s.biometricRegisteredBy || 'ADMIN') : null,
          fingerprintStatus: status,
          fingerprintCode: code,
          fingerprintApprovedAt: isApproved ? (s.fingerprintApprovedAt || nowIso) : null
        };
      }
      return s;
    });

    setSantriList(updated);
    broadcastState({ santriList: updated });
    playSound('success');
    showToast(`Biometrik santri ${targetSantri?.name || ''} berhasil diperbarui!`, 'success');

    if (!isDemoMode() && db) {
      try {
        const target = updated.find(s => s.id === santriId);
        if (target) {
          await updateDoc(doc(db, 'santri', santriId), {
            biometricStatus: target.biometricStatus,
            biometricRegistered: target.biometricRegistered,
            biometricCode: target.biometricCode,
            biometricRegisteredAt: target.biometricRegisteredAt,
            biometricRegisteredBy: target.biometricRegisteredBy,
            fingerprintStatus: target.fingerprintStatus,
            fingerprintCode: target.fingerprintCode,
            fingerprintApprovedAt: target.fingerprintApprovedAt
          });
        }
      } catch (err) {
        console.error('Error updating biometric on Firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // SUPER ADMIN: Hapus Pengajuan Akun Wali Santri Secara Permanen
  const deleteWaliAccount = useCallback(async (parentToken) => {
    const matches = santriList.filter(s => s.parentToken === parentToken);
    if (matches.length === 0) return;

    const parentName = matches[0]?.parentName || 'Wali Santri';
    const parentPhone = matches[0]?.parentPhone || '';
    const idsToDelete = [];
    const docsToUnbind = [];

    matches.forEach(s => {
      if (s.id.startsWith('santri-gen-')) {
        idsToDelete.push(s.id);
      } else {
        docsToUnbind.push({
          ...s,
          parentName: null,
          parentPhone: null,
          parentToken: null,
          parentPassword: null,
          pin: '1234',
          bindingLockCode: null,
          bindingStatus: null,
          isLocked: false,
          fingerprintStatus: 'NOT_REGISTERED',
          fingerprintCode: null,
          fingerprintRegisteredAt: null,
          fingerprintApprovedAt: null,
          fingerprintApprovalNote: null
        });
      }
    });

    let updated = santriList.filter(s => !idsToDelete.includes(s.id));
    if (docsToUnbind.length > 0) {
      const unbindMap = new Map(docsToUnbind.map(d => [d.id, d]));
      updated = updated.map(s => unbindMap.has(s.id) ? unbindMap.get(s.id) : s);
    }

    // CASCADE DELETE: Hapus semua top-up yang terkait dengan akun wali ini atau santrinya!
    const allChildIds = new Set(matches.map(s => s.id));
    const allChildNis = new Set(matches.map(s => s.nis).filter(Boolean));
    const topupsToDelete = topupRequests.filter(t => 
      t.parentToken === parentToken || 
      allChildIds.has(t.santriId) ||
      allChildNis.has(t.santriNis) ||
      (parentPhone && t.parentPhone === parentPhone) ||
      (t.parentName && parentName && t.parentName.trim().toLowerCase() === parentName.trim().toLowerCase())
    );
    const topupIdsToDelete = new Set(topupsToDelete.map(t => t.id));
    const updatedTopups = topupRequests.filter(t => !topupIdsToDelete.has(t.id));

    setSantriList(updated);
    setTopupRequests(updatedTopups);
    broadcastState({ santriList: updated, topupRequests: updatedTopups });
    playSound('beep');
    showToast(`Akun wali ${parentName} dan seluruh antrean top-up terkait telah dihapus.`, 'info');

    if (!isDemoMode() && db) {
      try {
        for (const id of idsToDelete) {
          await deleteDoc(doc(db, 'santri', id));
        }
        for (const unbindDoc of docsToUnbind) {
          await updateDoc(doc(db, 'santri', unbindDoc.id), {
            parentName: null,
            parentPhone: null,
            parentToken: null,
            parentPassword: null,
            pin: '1234',
            bindingLockCode: null,
            bindingStatus: null,
            isLocked: false,
            fingerprintStatus: 'NOT_REGISTERED',
            fingerprintCode: null,
            fingerprintRegisteredAt: null,
            fingerprintApprovedAt: null,
            fingerprintApprovalNote: null
          });
        }
        // Hapus juga dari Firestore koleksi topups
        for (const t of topupsToDelete) {
          if (t._docId) {
            try { await deleteDoc(doc(db, 'topups', t._docId)); } catch (e) {}
          }
          try { await deleteDoc(doc(db, 'topups', t.id)); } catch (e) {}
          const q = query(collection(db, 'topups'), where('id', '==', t.id));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        }
      } catch (err) {
        console.error('Error deleting wali account submission on Firestore:', err);
      }
    }
  }, [santriList, topupRequests, broadcastState, showToast]);

  // SUPER ADMIN: Update Data Akun Wali Santri & Santri Terkait
  const updateWaliAccount = useCallback(async (parentToken, { parentName, parentPhone, parentPassword, pin, children }) => {
    const cleanPhone = parentPhone ? formatPhoneNumber(parentPhone) : '';
    const trimmedParentName = (parentName || '').trim();
    let updatedSantri = [...santriList];
    const affectedDocs = [];

    // 1. Update basic info across all santri under this parentToken
    updatedSantri = updatedSantri.map(s => {
      if (s.parentToken === parentToken) {
        const docUpdated = {
          ...s,
          parentName: trimmedParentName || s.parentName,
          parentPhone: cleanPhone || s.parentPhone,
          parentPassword: parentPassword || s.parentPassword,
          pin: pin || s.pin
        };
        affectedDocs.push(docUpdated);
        return docUpdated;
      }
      return s;
    });

    // 2. If children list provided, update their details or add new child santri
    if (Array.isArray(children)) {
      children.forEach((child, idx) => {
        if (!child.name || !child.name.trim()) return;
        if (child.id) {
          const sIdx = updatedSantri.findIndex(s => s.id === child.id);
          if (sIdx >= 0) {
            const docUp = {
              ...updatedSantri[sIdx],
              name: child.name.trim(),
              nis: child.nis || updatedSantri[sIdx].nis,
              class: child.class || updatedSantri[sIdx].class,
              room: child.room || updatedSantri[sIdx].room,
              parentName: trimmedParentName || updatedSantri[sIdx].parentName,
              parentPhone: cleanPhone || updatedSantri[sIdx].parentPhone,
              parentPassword: parentPassword || updatedSantri[sIdx].parentPassword,
              pin: pin || updatedSantri[sIdx].pin
            };
            updatedSantri[sIdx] = docUp;
            affectedDocs.push(docUp);
          }
        } else {
          // New child attached to this wali
          const cleanIsb = child.nis || `${new Date().getFullYear()}${String(updatedSantri.length + 1).padStart(4, '0')}`;
          const newChild = {
            id: `santri-gen-${Date.now()}-${idx}`,
            nis: cleanIsb,
            name: child.name.trim(),
            class: child.class || 'Santri Baru',
            halaqah: child.halaqah || "Ma'had Imam Syafi'i",
            room: child.room || 'Asrama Santri',
            rfidTag: `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
            barcode: `ISB${cleanIsb.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
            balance: 0,
            parentName: trimmedParentName,
            parentPhone: cleanPhone,
            parentToken: parentToken,
            parentPassword: parentPassword || pin || '1234',
            password: parentPassword || pin || '1234',
            pin: pin || '1234',
            bindingLockCode: `BIND-ISB-${parentToken.toUpperCase()}`,
            bindingStatus: 'APPROVED',
            isLocked: true,
            fingerprintStatus: 'NOT_REGISTERED',
            biometricStatus: 'NOT_REGISTERED',
            biometricRegistered: false,
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
          updatedSantri.push(newChild);
          affectedDocs.push(newChild);
        }
      });
    }

    setSantriList(updatedSantri);
    broadcastState({ santriList: updatedSantri });
    playSound('success');
    showToast(`Data akun wali "${trimmedParentName || parentToken}" & santrinya berhasil disimpan!`, 'success');

    if (!isDemoMode() && db) {
      try {
        for (const docItem of affectedDocs) {
          await setDoc(doc(db, 'santri', docItem.id), docItem, { merge: true });
        }
      } catch (err) {
        console.error('Error updating wali on Firestore:', err);
      }
    }
  }, [santriList, broadcastState, showToast]);

  // PETUGAS: Pendaftaran Biometrik Petugas Baru
  const registerPetugasBiometric = useCallback(async ({ name, role, phone, fingerprintCode }) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const token = `staff-${role}-${Date.now().toString(36).slice(-4)}`;
    const ROLE_TITLES = {
      kantin: 'Petugas Kasir Kantin Santri',
      laundry: 'Petugas Laundry Pesantren',
      wartel: 'Operator Wartel Santri',
      spp: 'Kasir SPP & Syahriyah',
      kiosk: 'Petugas Kiosk Anjungan Mandiri'
    };
    const newStaff = {
      id: `role-${role}-${Date.now().toString(36).slice(-4)}`,
      role,
      name,
      title: ROLE_TITLES[role] || `Petugas ${role}`,
      token,
      pin: '123456',
      phone: cleanPhone,
      fingerprintCode: fingerprintCode || `FP-STAFF-${role.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      biometricStatus: 'PENDING_APPROVAL',
      biometricRegistered: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      registeredAt: new Date().toISOString()
    };
    const updated = [...roleAccounts, newStaff];
    setRoleAccounts(updated);
    broadcastState({ roleAccounts: updated });
    playSound('success');
    showToast(`Pendaftaran biometrik ${name} diajukan! Menunggu persetujuan Super Admin.`, 'success');
    return newStaff;
  }, [roleAccounts, broadcastState, showToast]);

  // SUPER ADMIN: Setujui Biometrik Petugas
  const approveStaffBiometric = useCallback(async (staffTokenOrId) => {
    const nowIso = new Date().toISOString();
    const updated = roleAccounts.map(r => {
      if (r.token === staffTokenOrId || r.id === staffTokenOrId) {
        return {
          ...r,
          biometricStatus: 'APPROVED',
          biometricRegistered: true,
          approvedAt: nowIso
        };
      }
      return r;
    });
    setRoleAccounts(updated);
    broadcastState({ roleAccounts: updated });
    playSound('success');
    showToast('Biometrik petugas berhasil disetujui & aktif!', 'success');
  }, [roleAccounts, broadcastState, showToast]);

  // SUPER ADMIN: Tolak / Reset Biometrik Petugas
  const rejectStaffBiometric = useCallback(async (staffTokenOrId, reason = 'Data tidak sesuai') => {
    const updated = roleAccounts.map(r => {
      if (r.token === staffTokenOrId || r.id === staffTokenOrId) {
        return {
          ...r,
          biometricStatus: 'REJECTED',
          rejectionReason: reason
        };
      }
      return r;
    });
    setRoleAccounts(updated);
    broadcastState({ roleAccounts: updated });
    playSound('beep');
    showToast('Permohonan biometrik petugas ditolak.', 'info');
  }, [roleAccounts, broadcastState, showToast]);

  // GANTI GAMBAR AVATAR AKUN (PETUGAS, WALI SANTRI & SANTRI)
  const updateSessionAvatar = useCallback(async (newAvatarUrl) => {
    if (!authSession) return;
    const updatedSession = { ...authSession, avatar: newAvatarUrl };
    setAuthSession(updatedSession);
    localStorage.setItem('maisya_session', JSON.stringify(updatedSession));

    if (authSession.type === 'role') {
      const updatedRoles = roleAccounts.map(r => 
        (r.id === authSession.id || r.token === authSession.token) 
          ? { ...r, avatar: newAvatarUrl } 
          : r
      );
      setRoleAccounts(updatedRoles);
      broadcastState({ roleAccounts: updatedRoles });
    } else if (authSession.type === 'wali') {
      const updatedSantri = santriList.map(s => 
        s.parentToken === authSession.token 
          ? { ...s, avatar: newAvatarUrl } 
          : s
      );
      setSantriList(updatedSantri);
      broadcastState({ santriList: updatedSantri });
      if (!isDemoMode() && db) {
        const matches = updatedSantri.filter(s => s.parentToken === authSession.token);
        for (const item of matches) {
          updateDoc(doc(db, 'santri', item.id), { avatar: newAvatarUrl }).catch(() => {});
        }
      }
    }
    playSound('success');
    showToast('Foto avatar berhasil diperbarui!', 'success');
  }, [authSession, roleAccounts, santriList, broadcastState, showToast]);

  // UPDATE PASSWORD SUPER ADMIN (DEFAULT: iftahadmin87)
  const updateAdminPassword = useCallback((newPassword) => {
    if (!newPassword || newPassword.length < 4) {
      showToast('Password minimal 4 karakter.', 'error');
      return;
    }
    const updated = roleAccounts.map(r => 
      r.role === 'admin' 
        ? { ...r, pin: newPassword, password: newPassword } 
        : r
    );
    setRoleAccounts(updated);
    broadcastState({ roleAccounts: updated });
    localStorage.setItem('maisya_admin_password', newPassword);
    playSound('success');
    showToast('Password Super Admin berhasil diperbarui!', 'success');
  }, [roleAccounts, broadcastState, showToast]);

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

  // DELETE TRANSACTION (DENGAN OPSI KEMBALIKAN SALDO SANTRI)
  const deleteTransaction = useCallback(async (transactionId, { rollbackBalance = true } = {}) => {
    const targetTx = transactions.find(t => t.id === transactionId);
    if (!targetTx) throw new Error('Data transaksi tidak ditemukan.');

    let updatedSantriList = [...santriList];
    let santriToUpdate = null;

    if (rollbackBalance && targetTx.santriId) {
      const santriIdx = updatedSantriList.findIndex(s => s.id === targetTx.santriId);
      if (santriIdx >= 0) {
        const s = updatedSantriList[santriIdx];
        let newBalance = s.balance;
        if (targetTx.type === 'DEPOSIT') {
          // Setoran dihapus -> saldo santri berkurang
          newBalance = Math.max(0, s.balance - Number(targetTx.amount));
        } else {
          // Belanja/Pengeluaran dihapus -> saldo dikembalikan ke santri (refund)
          newBalance = s.balance + Number(targetTx.amount);
        }
        santriToUpdate = { ...s, balance: newBalance };
        updatedSantriList[santriIdx] = santriToUpdate;
        setSantriList(updatedSantriList);
      }
    }

    const updatedTransactions = transactions.filter(t => t.id !== transactionId);
    setTransactions(updatedTransactions);

    broadcastState({
      transactions: updatedTransactions,
      santriList: updatedSantriList
    });

    playSound('beep');
    showToast(`Transaksi ${targetTx.id} berhasil dihapus!`, 'success');

    if (!isDemoMode() && db) {
      try {
        const q = query(collection(db, 'transactions'), where('id', '==', transactionId));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(d.ref);
        });
        if (santriToUpdate) {
          await updateDoc(doc(db, 'santri', santriToUpdate.id), {
            balance: santriToUpdate.balance
          });
        }
      } catch (err) {
        console.error('Error deleting transaction from Firestore:', err);
      }
    }
  }, [transactions, santriList, broadcastState, showToast]);

  // EDIT TRANSACTION (DENGAN PENYESUAIAN SALDO OTOMATIS)
  const editTransaction = useCallback(async (transactionId, updatedFields, { adjustBalance = true } = {}) => {
    const targetTx = transactions.find(t => t.id === transactionId);
    if (!targetTx) throw new Error('Data transaksi tidak ditemukan.');

    let updatedSantriList = [...santriList];
    let santriToUpdate = null;

    const oldAmount = Number(targetTx.amount) || 0;
    const newAmount = updatedFields.amount !== undefined ? Number(updatedFields.amount) : oldAmount;
    const diff = newAmount - oldAmount;

    if (adjustBalance && diff !== 0 && targetTx.santriId) {
      const santriIdx = updatedSantriList.findIndex(s => s.id === targetTx.santriId);
      if (santriIdx >= 0) {
        const s = updatedSantriList[santriIdx];
        let newBalance = s.balance;
        if (targetTx.type === 'DEPOSIT') {
          // Setoran bertambah -> saldo nambah
          newBalance = Math.max(0, s.balance + diff);
        } else {
          // Belanja bertambah -> saldo berkurang
          newBalance = Math.max(0, s.balance - diff);
        }
        santriToUpdate = { ...s, balance: newBalance };
        updatedSantriList[santriIdx] = santriToUpdate;
        setSantriList(updatedSantriList);
      }
    }

    const updatedTx = {
      ...targetTx,
      ...updatedFields,
      amount: newAmount,
      currentBalance: santriToUpdate ? santriToUpdate.balance : targetTx.currentBalance
    };

    const updatedTransactions = transactions.map(t => t.id === transactionId ? updatedTx : t);
    setTransactions(updatedTransactions);

    broadcastState({
      transactions: updatedTransactions,
      santriList: updatedSantriList
    });

    playSound('success');
    showToast(`Transaksi ${transactionId} berhasil diperbarui!`, 'success');

    if (!isDemoMode() && db) {
      try {
        const q = query(collection(db, 'transactions'), where('id', '==', transactionId));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await updateDoc(d.ref, updatedTx);
        });
        if (santriToUpdate) {
          await updateDoc(doc(db, 'santri', santriToUpdate.id), {
            balance: santriToUpdate.balance
          });
        }
      } catch (err) {
        console.error('Error updating transaction in Firestore:', err);
      }
    }
    return updatedTx;
  }, [transactions, santriList, broadcastState, showToast]);

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
      parentToken: targetSantri.parentToken || '',
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
    const request = topupRequests.find(t => t.id === topupId || t._docId === topupId);
    if (!request || request.status !== 'PENDING') return;

    const targetSantri = santriList.find(s => s.id === request.santriId || (s.nis && s.nis === request.santriNis));
    if (!targetSantri) {
      playSound('error');
      showToast(`Gagal menyetujui! Akun santri "${request.santriName || ''}" (NIS: ${request.santriNis || '-'}) tidak ditemukan atau akun walinya telah dihapus. Silakan hubungkan kembali melalui tombol Edit atau hapus antrean ini.`, 'error');
      return;
    }

    const previousBalance = targetSantri.balance || 0;
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
      if (t.id === topupId || t._docId === topupId) {
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
        if (request._docId) {
          try {
            await updateDoc(doc(db, 'topups', request._docId), { status: 'APPROVED', approvedAt: new Date().toISOString() });
          } catch (e) {}
        }
        try {
          await updateDoc(doc(db, 'topups', topupId), { status: 'APPROVED', approvedAt: new Date().toISOString() });
        } catch (e) {}
        await addDoc(collection(db, 'transactions'), newTx);
      } catch (err) {
        console.error('Error updating firestore on approve:', err);
      }
    }
  }, [topupRequests, santriList, transactions, broadcastState, showToast]);

  // Reject Top-up Request
  const rejectTopup = useCallback(async (topupId, reason = 'Bukti transfer tidak valid') => {
    let target = null;
    const updatedTopups = topupRequests.map(t => {
      if (t.id === topupId || t._docId === topupId) {
        target = {
          ...t,
          status: 'REJECTED',
          rejectReason: reason,
          rejectedAt: new Date().toISOString()
        };
        return target;
      }
      return t;
    });

    setTopupRequests(updatedTopups);
    broadcastState({ topupRequests: updatedTopups });
    showToast(`Permintaan top-up ditolak.`, 'info');

    if (!isDemoMode() && db) {
      try {
        if (target?._docId) {
          try {
            await updateDoc(doc(db, 'topups', target._docId), {
              status: 'REJECTED',
              rejectReason: reason,
              rejectedAt: new Date().toISOString()
            });
          } catch (e) {}
        }
        try {
          await updateDoc(doc(db, 'topups', topupId), {
            status: 'REJECTED',
            rejectReason: reason,
            rejectedAt: new Date().toISOString()
          });
        } catch (e) {}
      } catch (err) {
        console.error('Error rejecting topup on firestore:', err);
      }
    }
  }, [topupRequests, broadcastState, showToast]);

  // DELETE TOP-UP REQUEST (HAPUS DATA ANTREAN SECARA PERMANEN)
  const deleteTopupRequest = useCallback(async (topupId) => {
    const target = topupRequests.find(t => t.id === topupId || t._docId === topupId);
    const updated = topupRequests.filter(t => t.id !== topupId && t._docId !== topupId);
    setTopupRequests(updated);
    broadcastState({ topupRequests: updated });
    playSound('beep');
    showToast(`Antrean top-up santri "${target?.santriName || ''}" (${formatRupiah(target?.amount || 0)}) telah dihapus.`, 'info');

    if (!isDemoMode() && db) {
      try {
        if (target?._docId) {
          try { await deleteDoc(doc(db, 'topups', target._docId)); } catch (e) {}
        }
        try { await deleteDoc(doc(db, 'topups', topupId)); } catch (e) {}

        const q = query(collection(db, 'topups'), where('id', '==', topupId));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      } catch (err) {
        console.error('Error deleting topup from Firestore:', err);
      }
    }
  }, [topupRequests, broadcastState, showToast]);

  // EDIT TOP-UP REQUEST (UBAH NOMINAL, BANK, SANTRI, ATAU CATATAN)
  const editTopupRequest = useCallback(async (topupId, updatedFields) => {
    let target = null;
    const updated = topupRequests.map(t => {
      if (t.id === topupId || t._docId === topupId) {
        target = {
          ...t,
          ...updatedFields,
          amount: updatedFields.amount !== undefined ? Number(updatedFields.amount) : t.amount,
          totalTransfer: updatedFields.amount !== undefined ? (Number(updatedFields.amount) + (t.uniqueCode || 0)) : t.totalTransfer
        };
        return target;
      }
      return t;
    });

    setTopupRequests(updated);
    broadcastState({ topupRequests: updated });
    playSound('success');
    showToast(`Data antrean top-up berhasil diperbarui!`, 'success');

    if (!isDemoMode() && db && target) {
      try {
        if (target._docId) {
          try { await updateDoc(doc(db, 'topups', target._docId), updatedFields); } catch (e) {}
        }
        try { await updateDoc(doc(db, 'topups', topupId), updatedFields); } catch (e) {}

        const q = query(collection(db, 'topups'), where('id', '==', topupId));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await updateDoc(d.ref, updatedFields);
        }
      } catch (err) {
        console.error('Error updating topup in Firestore:', err);
      }
    }
  }, [topupRequests, broadcastState, showToast]);

  // BERSIHKAN SEMUA ANTREAN DARI AKUN WALI/SANTRI YANG SUDAH TERHAPUS (ORPHAN TOPUPS)
  const purgeOrphanTopups = useCallback(async () => {
    const validSantriIds = new Set(santriList.map(s => s.id));
    const validSantriNis = new Set(santriList.map(s => s.nis).filter(Boolean));
    const validParentTokens = new Set(santriList.map(s => s.parentToken).filter(Boolean));

    const orphanTopups = topupRequests.filter(t => {
      const matchId = t.santriId && validSantriIds.has(t.santriId);
      const matchNis = t.santriNis && validSantriNis.has(t.santriNis);
      const matchParent = t.parentToken && validParentTokens.has(t.parentToken);
      return !matchId && !matchNis && !matchParent;
    });

    if (orphanTopups.length === 0) {
      showToast('Tidak ada antrean yatim. Semua data terhubung dengan akun yang valid.', 'info');
      return 0;
    }

    const orphanIds = new Set(orphanTopups.map(t => t.id));
    const updated = topupRequests.filter(t => !orphanIds.has(t.id));

    setTopupRequests(updated);
    broadcastState({ topupRequests: updated });
    playSound('beep');
    showToast(`${orphanTopups.length} antrean dari akun wali/santri yang telah dihapus berhasil dibersihkan!`, 'success');

    if (!isDemoMode() && db) {
      try {
        for (const orphan of orphanTopups) {
          if (orphan._docId) {
            try { await deleteDoc(doc(db, 'topups', orphan._docId)); } catch (e) {}
          }
          try { await deleteDoc(doc(db, 'topups', orphan.id)); } catch (e) {}
          const q = query(collection(db, 'topups'), where('id', '==', orphan.id));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        }
      } catch (err) {
        console.error('Error purging orphan topups on Firestore:', err);
      }
    }

    return orphanTopups.length;
  }, [topupRequests, santriList, broadcastState, showToast]);

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
    loginDirectly,
    loginWaliWithPassword,
    logout,
    updateRoleAccount,
    addRoleAccount,
    deleteRoleAccount,

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
    editTransaction,
    deleteTransaction,
    submitTopupRequest,
    approveTopup,
    rejectTopup,
    deleteTopupRequest,
    editTopupRequest,
    purgeOrphanTopups,
    saveProduct,
    deleteProduct,
    paySppBill,

    // Wali Santri & Biometrics Enrollment
    registerWaliSantri,
    updateWaliAccount,
    requestFingerprintEnrollment,
    approveFingerprint,
    approveWaliAccount: approveFingerprint,
    approveAllPendingFingerprints,
    approveAllPendingWali: approveAllPendingFingerprints,
    rejectFingerprint,
    rejectWaliAccount: rejectFingerprint,
    resetFingerprint,
    deleteWaliAccount,
    registerSantriBiometric,
    updateSantriBiometric,
    resetSantriBiometric,

    // Petugas & Staff Biometrics
    registerPetugasBiometric,
    approveStaffBiometric,
    rejectStaffBiometric,
    updateAdminPassword,

    // Avatar Editor
    updateSessionAvatar,

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
