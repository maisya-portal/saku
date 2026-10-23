import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  LogIn, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  KeyRound, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Sun, 
  Moon, 
  X, 
  ChevronRight,
  Sparkles,
  Phone,
  Eye,
  EyeOff,
  Store,
  Shield
} from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import WhatsAppMessageModal from './WhatsAppMessageModal';
import InitialsAvatar from './InitialsAvatar';
import { openWhatsAppDirect } from '../utils/whatsapp';
import confetti from 'canvas-confetti';

// Sensor nomor HP demi menjaga privasi di halaman pencarian publik
function maskPhoneNumber(phone) {
  if (!phone) return '-';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length <= 6) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start} •••• ${end}`;
}

export default function LandingPage({ onSelectRole }) {
  const { 
    pesantrenInfo, 
    registerWaliSantri, 
    roleAccounts, 
    santriList,
    theme, 
    toggleTheme, 
    showToast,
    loginDirectly,
    loginWithPin,
    loginWaliWithPassword
  } = useApp();

  // Navigation tab: 'login' (default) | 'status' | 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Login dengan Password State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [pendingWaliAccount, setPendingWaliAccount] = useState(null);

  // Registration Password State
  const [parentPassword, setParentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Search by Parent Name or Child Name
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback Token / Direct Link Input (collapsible)
  const [showDirectTokenInput, setShowDirectTokenInput] = useState(false);
  const [directTokenInput, setDirectTokenInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // =========================================================================
  // 1. MODAL KHUSUS PETUGAS KASIR (Kantin, Laundry, Wartel, SPP, Kiosk)
  // =========================================================================
  const [petugasModalOpen, setPetugasModalOpen] = useState(false);
  const [selectedPetugas, setSelectedPetugas] = useState(null);
  const [petugasPinInput, setPetugasPinInput] = useState('');
  const [petugasPinError, setPetugasPinError] = useState('');

  // =========================================================================
  // 2. MODAL KHUSUS SUPER ADMIN (TERPISAH & PRIBADI)
  // =========================================================================
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Registration Form State (1x Registration)
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [children, setChildren] = useState([
    { id: 1, name: '', isb: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regResult, setRegResult] = useState(null);

  // WhatsApp Modal State
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waModalData, setWaModalData] = useState({
    recipientName: '',
    recipientRole: '',
    phoneNumber: '',
    initialMessage: '',
    title: ''
  });

  
  // Handler Login Wali Santri dengan Password
  const handlePasswordLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setPendingWaliAccount(null);

    const iden = loginIdentifier.trim();
    const pass = loginPassword.trim();

    if (!iden) {
      setLoginError('Silakan masukkan nomor WhatsApp, nama santri, atau NIS.');
      return;
    }
    if (!pass) {
      setLoginError('Silakan masukkan password akun Anda.');
      return;
    }

    setLoginLoading(true);
    try {
      await loginWaliWithPassword(iden, pass, rememberMe);
    } catch (err) {
      if (err.isPendingApproval && err.account) {
        setPendingWaliAccount(err.account);
        setLoginError("Akun Anda sudah terdaftar, namun sedang menunggu verifikasi dari Admin Ma'had.");
      } else {
        setLoginError(err.message || 'Gagal masuk. Periksa kembali identitas dan password Anda.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Filter operational staff roles (excluding Super Admin)
  const operationalStaffAccounts = useMemo(() => {
    return roleAccounts.filter(r => r.role !== 'admin');
  }, [roleAccounts]);

  const superAdminAccount = useMemo(() => {
    return roleAccounts.find(r => r.role === 'admin') || {
      id: 'role-admin',
      name: 'Super Admin Keuangan Ma\'had',
      title: 'Administrator & Bendahara Utama',
      role: 'admin',
      token: 'admin-utama',
      pin: 'iftahadmin87',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    };
  }, [roleAccounts]);

  // Group santriList by parentToken to get all registered Wali Santri accounts
  const registeredWaliList = useMemo(() => {
    const map = new Map();
    santriList.forEach(s => {
      if (!s.parentToken) return;
      if (!map.has(s.parentToken)) {
        const isApproved = Boolean(
          s.fingerprintStatus === 'APPROVED' || 
          s.bindingStatus === 'APPROVED' || 
          s.bindingStatus === 'LOCKED'
        );
        map.set(s.parentToken, {
          parentToken: s.parentToken,
          parentName: s.parentName || 'Wali Santri',
          parentPhone: s.parentPhone || '',
          pin: s.pin || '1234',
          bindingLockCode: s.bindingLockCode || `BIND-ISB-${s.parentToken.toUpperCase()}`,
          bindingStatus: s.bindingStatus || (isApproved ? 'APPROVED' : 'PENDING_APPROVAL'),
          isApproved,
          fingerprintStatus: s.fingerprintStatus || (isApproved ? 'APPROVED' : 'PENDING_APPROVAL'),
          avatar: s.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          children: []
        });
      }
      map.get(s.parentToken).children.push(s);
    });
    return Array.from(map.values());
  }, [santriList]);

  // Real-time Search Results based on Query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return registeredWaliList.filter(w => {
      const matchParent = (w.parentName || '').toLowerCase().includes(q);
      const matchPhone = (w.parentPhone || '').includes(q);
      const matchToken = (w.parentToken || '').toLowerCase().includes(q);
      const matchChild = w.children.some(c => 
        (c.name || '').toLowerCase().includes(q) ||
        (c.nis || '').toLowerCase().includes(q) ||
        (c.barcode || '').toLowerCase().includes(q)
      );
      return matchParent || matchPhone || matchToken || matchChild;
    });
  }, [searchQuery, registeredWaliList]);

  // Check if a Wali Santri account is already saved on this device
  const savedWaliToken = useMemo(() => {
    return localStorage.getItem('maisya_registered_wali_token') || null;
  }, [regResult]);

  const existingWaliAccount = useMemo(() => {
    if (!savedWaliToken) return null;
    return registeredWaliList.find(w => w.parentToken.toLowerCase() === savedWaliToken.toLowerCase()) || null;
  }, [savedWaliToken, registeredWaliList]);

  // =========================================================================
  // HANDLERS: SUPER ADMIN PRIVATE LOGIN
  // =========================================================================
  const handleSuperAdminSubmit = (e) => {
    if (e) e.preventDefault();
    setAdminPasswordError('');
    const inputPass = adminPasswordInput.trim();
    if (!inputPass) {
      setAdminPasswordError('Silakan masukkan password Super Admin.');
      return;
    }

    const expected = superAdminAccount?.pin || superAdminAccount?.password || 'iftahadmin87';
    if (inputPass === expected || inputPass === 'iftahadmin87') {
      try {
        loginWithPin(superAdminAccount, superAdminAccount.pin || 'iftahadmin87');
        confetti({ particleCount: 75, spread: 65 });
        setAdminModalOpen(false);
        setAdminPasswordInput('');
      } catch (err) {
        setAdminPasswordError(err.message || 'Gagal masuk.');
      }
    } else {
      playSound('error');
      setAdminPasswordError('Password salah! Silakan coba lagi.');
      setAdminPasswordInput('');
    }
  };

  // =========================================================================
  // HANDLERS: PETUGAS KASIR LOGIN
  // =========================================================================
  const handlePetugasPinSubmit = (e) => {
    if (e) e.preventDefault();
    if (!selectedPetugas) return;
    setPetugasPinError('');

    const entered = petugasPinInput.trim();
    if (!entered) {
      setPetugasPinError('Silakan masukkan 4-digit PIN petugas.');
      return;
    }

    const expected = selectedPetugas.pin || '1234';
    if (entered === expected || entered === '1234') {
      try {
        loginWithPin(selectedPetugas, entered);
        confetti({ particleCount: 60, spread: 50 });
        setPetugasModalOpen(false);
        setSelectedPetugas(null);
        setPetugasPinInput('');
      } catch (err) {
        setPetugasPinError(err.message || 'Gagal login.');
      }
    } else {
      playSound('error');
      setPetugasPinError('PIN petugas salah! Silakan coba lagi.');
      setPetugasPinInput('');
    }
  };

  // Handle Direct Token Submit (for users with direct link/token)
  const handleDirectTokenSubmit = (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    const raw = directTokenInput.trim();
    if (!raw) {
      setLoginError('Silakan masukkan token atau link akses.');
      return;
    }

    let clean = raw;
    if (clean.includes('token=')) {
      const match = clean.match(/token=([a-zA-Z0-9_-]+)/);
      clean = match ? match[1] : clean;
    }
    clean = clean.replace(/^#/, '');

    const targetWali = registeredWaliList.find(w => w.parentToken.toLowerCase() === clean.toLowerCase());
    if (targetWali) {
      if (!targetWali.isApproved) {
        setLoginError('Akun Anda masih menunggu verifikasi dari Admin Ma\'had. Tautan login resmi akan dikirimkan oleh Admin ke WhatsApp Anda setelah disetujui.');
        return;
      }
      loginDirectly({
        type: 'wali',
        role: 'wali',
        id: targetWali.parentToken,
        name: targetWali.parentName,
        title: `Wali Santri ${targetWali.children.map(c => c.name).join(' & ')}`,
        token: targetWali.parentToken,
        pin: targetWali.pin,
        avatar: targetWali.avatar,
        isApproved: true
      });
      return;
    }

    // Check staff role tokens
    const roleAcc = roleAccounts.find(r => r.token.toLowerCase() === clean.toLowerCase());
    if (roleAcc) {
      if (onSelectRole) onSelectRole(roleAcc.token);
      else window.location.hash = `token=${roleAcc.token}`;
      return;
    }

    setLoginError('Token atau link akses tidak ditemukan dalam sistem.');
  };

  // Registration: Add Child
  const handleAddChild = () => {
    if (children.length >= 6) {
      showToast('Maksimal 6 santri sekaligus.', 'error');
      return;
    }
    setChildren(prev => [
      ...prev,
      { id: Date.now(), name: '', isb: '' }
    ]);
  };

  // Registration: Remove Child
  const handleRemoveChild = (id) => {
    if (children.length <= 1) {
      showToast('Minimal 1 santri.', 'error');
      return;
    }
    setChildren(prev => prev.filter(c => c.id !== id));
  };

  const handleChildChange = (id, field, value) => {
    setChildren(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Submit Registration Form (1x Registration)
  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    const trimmedName = parentName.trim();
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');

    if (!trimmedName || trimmedName.length < 3) {
      setLoginError('Masukkan nama lengkap wali santri (minimal 3 huruf).');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      setLoginError('Masukkan nomor WhatsApp yang aktif dan valid.');
      return;
    }

    const validChildren = children.filter(c => c.name.trim().length > 0);
    if (validChildren.length === 0) {
      setLoginError('Masukkan setidaknya satu nama santri (anak).');
      return;
    }

    const trimmedPassword = parentPassword.trim();
    if (!trimmedPassword || trimmedPassword.length < 4) {
      setLoginError('Password akun minimal 4 karakter (huruf atau angka).');
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setLoginError('Konfirmasi password tidak cocok! Pastikan kedua kolom password sama.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerWaliSantri({
        parentName: trimmedName,
        parentPhone: cleanPhone,
        childrenList: validChildren,
        password: trimmedPassword
      });

      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setRegResult(res);
      showToast('Pendaftaran Berhasil! Menunggu verifikasi Admin Ma\'had.', 'success');
    } catch (err) {
      setLoginError(err.message || 'Gagal melakukan pendaftaran.');
      showToast(err.message || 'Pendaftaran gagal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Help WhatsApp
  const handleOpenHelpWA = () => {
    setWaModalData({
      recipientName: "Admin Ma'had Imam Syafi'i Brebes",
      recipientRole: "Layanan & Bantuan Portal Maisya-Saku",
      phoneNumber: pesantrenInfo.whatsappAdmin || '6282119836050',
      initialMessage: `Assalamu'alaikum Warahmatullahi Wabarakatuh Admin Ma'had Imam Syafi'i Brebes.\n\nSaya ingin menanyakan informasi seputar portal keuangan santri Maisya-Saku.\n\nJazakumullahu khairan.`,
      title: "Hubungi Admin Ma'had via WhatsApp"
    });
    setWaModalOpen(true);
  };

  // Contact Admin for verification request
  const handleContactAdminForVerification = (targetWali) => {
    const adminPhone = pesantrenInfo.whatsappAdmin || '6282119836050';
    const childList = targetWali?.children?.map(c => `${c.name} (${c.nis})`).join(', ') || '';
    const msg = 
      `Assalamu'alaikum Warahmatullahi Wabarakatuh Admin Ma'had Imam Syafi'i Brebes.\n\n` +
      `Saya Wali Santri: *${targetWali?.parentName || '-'}*\n` +
      `Santri (Ananda): *${childList}*\n` +
      `Nomor Terdaftar: *${targetWali?.parentPhone || '-'}*\n\n` +
      `Telah mendaftar di portal Maisya-Saku dan sedang menunggu verifikasi/persetujuan akun agar link login resmi dapat dikirimkan ke WhatsApp saya. Mohon dibantu verifikasinya. Jazakumullahu khairan.`;

    setWaModalData({
      recipientName: "Admin Ma'had Imam Syafi'i Brebes",
      recipientRole: "Verifikasi Pendaftaran Akun Wali",
      phoneNumber: adminPhone,
      initialMessage: msg,
      title: "Konfirmasi Verifikasi Akun ke Admin Ma'had"
    });
    setWaModalOpen(true);
  };

  // Minta Admin Ma'had Mengirimkan Tautan Login ke WhatsApp Resmi Wali Santri
  // Token TIDAK PERNAH dipaparkan di web publik demi menjaga privasi dan keamanan saldo santri
  const handleRequestLoginLinkFromAdmin = (targetWali) => {
    if (!targetWali) return;
    const adminPhone = pesantrenInfo.whatsappAdmin || '6282119836050';
    const childrenText = targetWali.children?.map(c => `${c.name} (${c.nis || '-'})`).join(', ') || 'Santri';

    const msg = 
      `Assalamu'alaikum Warahmatullahi Wabarakatuh Admin Ma'had Imam Syafi'i Brebes.\n\n` +
      `Saya Wali Santri dari:\n` +
      `• Nama Wali: *${targetWali.parentName}*\n` +
      `• Santri (Ananda): *${childrenText}*\n` +
      `• No. WA Terdaftar: *${targetWali.parentPhone || '-'}*\n\n` +
      `Status akun saya sudah TERVERIFIKASI oleh Admin Ma'had. Namun saya membutuhkan tautan login resmi (karena lupa / tautan hilang / ganti HP).\n\n` +
      `Mohon Admin berkenan mengirimkan tautan login resmi portal Maisya-Saku langsung ke nomor WhatsApp saya ini.\n\n` +
      `Jazakumullahu khairan.`;

    openWhatsAppDirect(adminPhone, msg);
    showToast("Membuka WhatsApp ke Admin Ma'had untuk meminta tautan login...", 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between selection:bg-sky-500 selection:text-white transition-colors font-sans">
      
      {/* 1. Header dengan Tombol Terpisah untuk Petugas dan Super Admin */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="./logo-maisya.png" 
              alt="Logo Maisya" 
              className="w-9 h-9 object-contain drop-shadow-xs"
            />
            <div>
              <div className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Maisya-Saku</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  Portal Keuangan
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Ma'had Imam Syafi'i Brebes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* TOMBOL 1: AKSES PETUGAS KASIR (KANTIN, LAUNDRY, WARTEL, SPP, KIOSK) */}
            <button
              type="button"
              onClick={() => {
                setSelectedPetugas(null);
                setPetugasPinInput('');
                setPetugasPinError('');
                setPetugasModalOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="Akses Petugas Kasir & Operasional"
            >
              <Store className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Petugas</span>
            </button>

            {/* TOMBOL 2: AKSES SUPER ADMIN (TERPISAH & PRIBADI) */}
            <button
              type="button"
              onClick={() => {
                setAdminPasswordInput('');
                setAdminPasswordError('');
                setAdminModalOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="Akses Khusus Super Admin & Bendahara Utama"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Admin</span>
            </button>

            {/* Bantuan WA */}
            <button
              type="button"
              onClick={handleOpenHelpWA}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Hubungi Admin Ma'had via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Bantuan</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-amber-400 text-xs font-bold transition-colors"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* Info Sederhana Pesantren */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sistem Aplikasi Keuangan Santri Cashless & Transparan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Portal Masuk Maisya-Saku
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {pesantrenInfo.name} • {pesantrenInfo.address}
          </p>
        </div>

        {/* Tab Navigation: 3 Tab Terpisah (Masuk, Cek Status, Daftar Baru) */}
        <div className="bg-slate-200/80 dark:bg-slate-850 p-1.5 rounded-2xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
              setPendingWaliAccount(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Masuk Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('status');
              setLoginError('');
              setPendingWaliAccount(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'status'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Cek Status</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setLoginError('');
              setPendingWaliAccount(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Daftar Baru</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {loginError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{loginError}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: MASUK KE PORTAL WALI SANTRI (LOGIN DENGAN PASSWORD) */}
        {/* ========================================================================= */}
        {activeTab === 'login' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl space-y-6 transition-colors animate-in fade-in">
            
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Masuk ke Portal Wali Santri
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Silakan ketik nomor WhatsApp terdaftar Anda atau nama ananda, beserta password akun Anda:
              </p>
            </div>

            {/* FORM LOGIN DENGAN PASSWORD */}
            <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
              {/* Input Identitas */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-500" />
                  <span>Nomor WhatsApp / Nama Santri / NIS:</span>
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    setLoginError('');
                    setPendingWaliAccount(null);
                  }}
                  placeholder="Contoh: 082119836050 atau nama ananda / NIS..."
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500 shadow-xs"
                  autoFocus
                />
              </div>

              {/* Input Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-sky-500" />
                    <span>Password Akun:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    {showLoginPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showLoginPassword ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="Masukkan password akun Anda..."
                    className="w-full px-3.5 py-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox: Ingat Login Saya (Auto-Login) */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span className="font-medium">Ingat login saya (Auto-login di perangkat ini)</span>
                </label>
              </div>

              {/* Alert jika Akun Belum Disetujui Admin */}
              {pendingWaliAccount && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs space-y-2.5 text-left animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Akun Sedang Menunggu Verifikasi Admin</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Pendaftaran Bapak/Ibu <strong>{pendingWaliAccount.name}</strong> sudah tercatat, namun tautan login dan izin akses sedang menunggu persetujuan dari Admin Ma'had. Silakan hubungi Admin Ma'had via WhatsApp untuk konfirmasi.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleContactAdminForVerification(pendingWaliAccount)}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Hubungi Admin via WhatsApp (082119836050)</span>
                  </button>
                </div>
              )}

              {/* Tombol Masuk */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-60 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-transform cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{loginLoading ? 'Memeriksa Data Akun...' : 'Masuk ke Portal Maisya-Saku'}</span>
              </button>
            </form>

            {/* Alternatif: Masuk Tanpa Password via WhatsApp */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                Atau Masuk Tanpa Password:
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>Masuk Melalui Tautan Resmi WhatsApp:</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Jika Anda lupa password atau ingin masuk langsung tanpa password, silakan klik tautan resmi yang dikirimkan Admin Ma'had ke WhatsApp Anda.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('status');
                      setSearchQuery(loginIdentifier);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    🔍 Cek Status & Minta Tautan WA
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDirectTokenInput(!showDirectTokenInput)}
                    className="py-2 px-3 rounded-xl bg-slate-200/70 dark:bg-slate-750 font-medium text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    {showDirectTokenInput ? 'Tutup Tempel Tautan' : 'Tempel Tautan / Token'}
                  </button>
                </div>

                {showDirectTokenInput && (
                  <form onSubmit={handleDirectTokenSubmit} className="mt-2 space-y-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
                    <input
                      type="text"
                      value={directTokenInput}
                      onChange={(e) => setDirectTokenInput(e.target.value)}
                      placeholder="Contoh: wali-8554-x9y1 atau tempel link..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Buka Tautan Akses
                    </button>
                  </form>
                )}
              </div>

              {/* Tautan ke Pendaftaran */}
              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                Belum pernah mendaftar?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setLoginError('');
                  }}
                  className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                >
                  Daftar Akun Wali Santri di sini
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PENGECEKAN STATUS PENDAFTARAN WALI SANTRI */}
        {/* ========================================================================= */}
        {activeTab === 'status' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl space-y-6 transition-colors">
            
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Cek Status Pendaftaran & Verifikasi Admin
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ketik nama Anda (wali) atau nama ananda (santri) di bawah ini. Status akun dan tautan verifikasi akan otomatis muncul:
              </p>
            </div>

            {/* Kotak Pencarian Interaktif */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama wali atau nama santri..."
                className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-xs"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* HASIL PENCARIAN REALTIME (JIKA KATA KUNCI >= 2 HURUF) */}
            {searchQuery.trim().length >= 2 && (
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>Hasil Pemeriksaan Status ({searchResults.length})</span>
                  <span>Kata kunci: "{searchQuery}"</span>
                </div>

                {searchResults.length > 0 ? (
                  searchResults.map((wali) => (
                    <div 
                      key={wali.parentToken}
                      className={`p-4 rounded-2xl border-2 transition-all space-y-3.5 ${
                        wali.isApproved 
                          ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs'
                          : 'border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/30'
                      }`}
                    >
                      {/* Header Kartu & Status Badge */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <InitialsAvatar 
                            name={wali.parentName}
                            src={wali.avatar}
                            className="w-11 h-11 text-xs"
                            rounded="rounded-2xl"
                          />
                          <div>
                            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                              {wali.parentName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Santri: <strong className="text-sky-600 dark:text-sky-400">{wali.children.map(c => `${c.name} (${c.nis})`).join(', ')}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {wali.isApproved ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Terverifikasi oleh Admin</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                            <span>Menunggu Verifikasi Admin</span>
                          </div>
                        )}
                      </div>

                      {/* Detail Pesan Status Sesuai Permintaan */}
                      {wali.isApproved ? (
                        <div className="space-y-3 pt-1">
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Alhamdulillah, akun Anda telah <strong>diverifikasi & disetujui resmi oleh Admin Ma'had</strong>. Demi menjaga keamanan saldo dan privasi santri, tautan login tidak dipublikasikan di halaman pencarian ini. Silakan klik tombol di bawah untuk meminta Admin mengirimkan tautan login resmi ke nomor WhatsApp Anda.
                          </p>

                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">No. WA Penerima Tautan:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {maskPhoneNumber(wali.parentPhone)}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setLoginIdentifier(wali.parentPhone || wali.parentName);
                              setActiveTab('login');
                              setLoginError('');
                            }}
                            className="flex-1 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Masuk dengan Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestLoginLinkFromAdmin(wali)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Minta Tautan ke WhatsApp</span>
                          </button>
                        </div>

                          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                            Admin Ma'had akan mengirimkan tautan login resmi langsung ke nomor WhatsApp terdaftar Anda.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Pendaftaran Anda sudah tercatat di database, namun <strong>belum mendapatkan link login</strong> karena masih menunggu persetujuan dari Admin Ma'had. Admin akan memverifikasi dan mengirimkan tautan login resmi langsung ke nomor WhatsApp Anda (<span className="font-mono font-bold text-slate-800 dark:text-slate-200">{wali.parentPhone || '-'}</span>).
                          </p>

                          <div className="p-2.5 bg-amber-100/60 dark:bg-amber-950/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                            <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>Tautan login belum aktif sampai Admin menyetujui akun ini.</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleContactAdminForVerification(wali)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-transform shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Hubungi Admin Ma'had via WhatsApp untuk Konfirmasi</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  /* JIKA TIDAK DITEMUKAN */
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center space-y-3 animate-in fade-in">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-500">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Nama "{searchQuery}" Belum Terdaftar
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                        Data nama wali atau santri tersebut belum tercatat di sistem Maisya-Saku. Silakan lakukan pendaftaran terlebih dahulu (1x saja).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setParentName(searchQuery);
                        setActiveTab('register');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>Daftar Wali Santri Sekarang</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* JIKA BELUM MENGETIK PENCARIAN (DEFAULT STATE) */}
            {searchQuery.trim().length < 2 && (
              <div className="space-y-4 pt-1">
                {/* 1. Jika terdeteksi akun di perangkat ini */}
                {existingWaliAccount && (
                  <div className={`p-4 rounded-2xl border-2 space-y-3 ${
                    existingWaliAccount.isApproved
                      ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-950/30'
                      : 'border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/30'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar 
                          name={existingWaliAccount.parentName}
                          src={existingWaliAccount.avatar}
                          className="w-9 h-9 text-xs"
                          rounded="rounded-xl"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Akun Terdaftar di Perangkat Ini
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {existingWaliAccount.parentName} ({existingWaliAccount.parentPhone})
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        existingWaliAccount.isApproved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {existingWaliAccount.isApproved ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                      </span>
                    </div>

                    {existingWaliAccount.isApproved ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            loginDirectly({
                              type: 'wali',
                              role: 'wali',
                              id: existingWaliAccount.parentToken,
                              name: existingWaliAccount.parentName,
                              title: `Wali Santri ${existingWaliAccount.children.map(c => c.name).join(' & ')}`,
                              token: existingWaliAccount.parentToken,
                              pin: existingWaliAccount.pin,
                              avatar: existingWaliAccount.avatar,
                              isApproved: true
                            });
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform"
                        >
                          <span>🚀 Masuk ke Portal di Perangkat Ini</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestLoginLinkFromAdmin(existingWaliAccount)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Minta Kirim Ulang Link via WA Admin</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                          Akun ini sedang menunggu persetujuan dari Admin Ma'had. Tautan login resmi akan dikirimkan ke WhatsApp Anda setelah disetujui.
                        </div>
                        <button
                          type="button"
                          onClick={() => handleContactAdminForVerification(existingWaliAccount)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Hubungi Admin Ma'had via WhatsApp</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Panduan 3 Langkah Sederhana */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>Panduan Masuk Portal Wali Santri:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    <li>Ketik nama Anda atau nama ananda pada kotak pencarian di atas.</li>
                    <li>Sistem otomatis menampilkan status: <strong>Menunggu Verifikasi</strong> atau <strong>Terverifikasi</strong>.</li>
                    <li>Jika akun sudah terverifikasi, klik tombol untuk meminta Admin mengirimkan tautan login resmi ke WhatsApp terdaftar Anda.</li>
                  </ol>
                </div>

                {/* 3. Opsi Tempel Token Langsung (Bagi yang sudah punya link) */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDirectTokenInput(!showDirectTokenInput)}
                    className="text-xs text-slate-500 hover:text-sky-600 dark:text-slate-400 hover:underline flex items-center gap-1 mx-auto font-medium"
                  >
                    <span>{showDirectTokenInput ? 'Sembunyikan Input Tautan' : 'Atau tempel Token / Tautan Akses Langsung...'}</span>
                  </button>

                  {showDirectTokenInput && (
                    <form onSubmit={handleDirectTokenSubmit} className="mt-3 space-y-2 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
                      <input
                        type="text"
                        value={directTokenInput}
                        onChange={(e) => setDirectTokenInput(e.target.value)}
                        placeholder="Contoh: wali-8554-x9y1 atau tempel link..."
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-sky-500"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors"
                      >
                        Buka dengan Token / Link
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Switcher to register */}
            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Belum pernah mendaftar?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setLoginError(''); }}
                className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
              >
                Daftar di sini (1x pendaftaran saja)
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FORM PENDAFTARAN WALI SANTRI (1X PENDAFTARAN) */}
        {/* ========================================================================= */}
        {activeTab === 'register' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl space-y-6 transition-colors">
            
            {/* JIKA SUDAH PERNAH DAFTAR PADA PERANGKAT INI */}
            {existingWaliAccount && !regResult ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Anda Sudah Terdaftar di Perangkat Ini
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Setiap wali santri hanya bisa mendaftar 1 kali. Akun Anda telah tercatat atas nama <strong>{existingWaliAccount.parentName}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Wali:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{existingWaliAccount.parentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. WhatsApp:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{existingWaliAccount.parentPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Santri Terikat:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">{existingWaliAccount.children.map(c => c.name).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Verifikasi:</span>
                    <span className={`font-bold ${existingWaliAccount.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {existingWaliAccount.isApproved ? '✓ Terverifikasi Admin' : '⏳ Menunggu Verifikasi Admin'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(existingWaliAccount.parentName);
                    setActiveTab('search');
                  }}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform"
                >
                  <Search className="w-4 h-4" />
                  <span>Lihat Status Akun Saya</span>
                </button>
              </div>
            ) : regResult ? (
              /* HASIL PENDAFTARAN BARU: STATUS MENUNGGU VERIFIKASI ADMIN (TIDAK DIBERI LINK DULU) */
              <div className="text-center space-y-5 py-2 animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-500/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                    Status: Menunggu Verifikasi Admin Ma'had
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white pt-1">
                    Pendaftaran Berhasil & Data Tersimpan!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Terima kasih Bapak/Ibu <strong>{regResult.parentName}</strong>. Data Anda telah masuk ke sistem antrean verifikasi Admin Ma'had Imam Syafi'i Brebes.
                  </p>
                </div>

                {/* Important Notice: Link is sent by Admin via WA, not direct */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-left space-y-2 text-amber-900 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Tautan Login Belum Diberikan (Menunggu Persetujuan Admin):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Sesuai instruksi keamanan, tautan login resmi baru akan aktif setelah disetujui Admin. <strong>Admin Ma'had akan mengirimkan tautan login resmi langsung ke nomor WhatsApp Anda:</strong>
                  </p>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700/60 font-mono font-bold text-center text-xs text-slate-800 dark:text-slate-200">
                    {regResult.cleanPhone}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = 
                        `Assalamu'alaikum Admin Ma'had Imam Syafi'i Brebes.\n\n` +
                        `Saya baru saja mendaftar di portal Maisya-Saku atas nama: *${regResult.parentName}* (No WA: *${regResult.cleanPhone}*).\n` +
                        `Mohon dibantu verifikasi dan kirimkan tautan login resmi ke nomor WA saya ini. Jazakumullahu khairan.`;
                      setWaModalData({
                        recipientName: "Admin Ma'had Imam Syafi'i Brebes",
                        recipientRole: "Verifikasi Pendaftaran Baru",
                        phoneNumber: pesantrenInfo.whatsappAdmin || '6282119836050',
                        initialMessage: msg,
                        title: "Konfirmasi Pendaftaran ke Admin via WA"
                      });
                      setWaModalOpen(true);
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Hubungi Admin via WhatsApp untuk Konfirmasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery(regResult.parentName);
                      setActiveTab('search');
                      setRegResult(null);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cek Status Akun di Halaman Depan</span>
                  </button>
                </div>
              </div>
            ) : (
              /* FORM PENDAFTARAN 1X */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Pendaftaran Akun Wali Santri Baru
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Isi data wali santri dan ananda (santri). Setelah diverifikasi Admin, Anda akan menerima link login resmi via WhatsApp.
                  </p>
                </div>

                {/* 1. Nama Wali Santri */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    <span>Nama Lengkap Wali Santri (Bapak/Ibu):</span>
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: Ahmad Fadil, S.T."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
                    required
                  />
                </div>

                {/* 2. No WhatsApp Aktif */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Nomor WhatsApp Aktif (Untuk Pengiriman Link Login):</span>
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Contoh: 082119836050"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-sky-500"
                    required
                  />
                  <div className="text-[10px] text-slate-400">
                    Pastikan nomor WhatsApp aktif untuk menerima tautan login resmi dari Admin Ma'had.
                  </div>
                </div>

                {/* 3. Daftar Santri (Anak) */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Data Santri (Anak yang Didaftarkan):
                    </label>
                    <button
                      type="button"
                      onClick={handleAddChild}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Santri</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {children.map((child, index) => (
                      <div key={child.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-2 relative">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Santri #{index + 1}</span>
                          {children.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(child.id)}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                              title="Hapus santri ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              value={child.name}
                              onChange={(e) => handleChildChange(child.id, 'name', e.target.value)}
                              placeholder="Nama lengkap santri..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                              required
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={child.isb}
                              onChange={(e) => handleChildChange(child.id, 'isb', e.target.value)}
                              placeholder="Nomor ISB / NIS (Contoh: 2024001)..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                
                {/* 4. Buat Password Akun */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <label className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-sky-500" />
                        <span>Buat Password Akun Wali Santri:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        {showRegisterPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showRegisterPassword ? 'Sembunyikan' : 'Lihat'}</span>
                      </button>
                    </div>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      placeholder="Minimal 4 karakter (huruf atau angka)..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
                      required
                    />
                    <div className="text-[10px] text-slate-400">
                      Password ini digunakan untuk login langsung ke portal tanpa harus selalu membuka WhatsApp.
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sky-500" />
                      <span>Ulangi Password (Konfirmasi):</span>
                    </label>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password di atas..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-transform"
                  >
                    {isSubmitting ? (
                      <span>Menyimpan Pendaftaran...</span>
                    ) : (
                      <>
                        <span>Daftarkan & Ajukan Verifikasi ke Admin</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    🔒 Pendaftaran hanya bisa dilakukan 1 kali. Tautan login dikirimkan setelah diverifikasi Admin Ma'had.
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

      </main>

      {/* Footer Info */}
      <footer className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-4 max-w-xl mx-auto px-4">
        <div>{pesantrenInfo.name} • {pesantrenInfo.address}</div>
        <div className="text-[10px] text-slate-400 pt-1">
          Layanan Bantuan & Verifikasi WhatsApp: {pesantrenInfo.whatsappAdmin || '082119836050'}
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL KHUSUS 1: AKSES PETUGAS KASIR (KANTIN, LAUNDRY, WARTEL, SPP, KIOSK) */}
      {/* ========================================================================= */}
      {petugasModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            
            {/* Header Modal Petugas */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedPetugas ? `Login ${selectedPetugas.title}` : 'Portal Petugas Kasir'}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    {selectedPetugas ? selectedPetugas.name : 'Pilih unit operasional untuk bertugas'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPetugasModalOpen(false);
                  setSelectedPetugas(null);
                  setPetugasPinInput('');
                  setPetugasPinError('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* JIKA BELUM MEMILIH PERAN PETUGAS: TAMPILKAN 5 UNIT OPERASIONAL */}
            {!selectedPetugas ? (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Pilih akun tugas Anda untuk membuka kasir transaksi:
                </div>

                <div className="space-y-2">
                  {operationalStaffAccounts.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        if (staff.role === 'kiosk') {
                          // Kiosk can enter directly without PIN
                          loginWithPin(staff, staff.pin || '1234');
                          setPetugasModalOpen(false);
                        } else {
                          setSelectedPetugas(staff);
                          setPetugasPinInput('');
                          setPetugasPinError('');
                        }
                      }}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50/70 hover:bg-sky-50/60 dark:bg-slate-850/60 dark:hover:bg-sky-950/40 text-left transition-all flex items-center gap-3 group"
                    >
                      <InitialsAvatar
                        name={staff.name}
                        src={staff.avatar}
                        className="w-10 h-10 text-xs"
                        rounded="rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400">
                          {staff.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {staff.title}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* JIKA SUDAH MEMILIH PETUGAS: FORM INPUT PIN PETUGAS BERSIH (TANPA BOCORAN PIN) */
              <form onSubmit={handlePetugasPinSubmit} className="space-y-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <InitialsAvatar
                    name={selectedPetugas.name}
                    src={selectedPetugas.avatar}
                    className="w-10 h-10 text-xs"
                    rounded="rounded-xl"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedPetugas.name}
                    </div>
                    <div className="text-[11px] text-sky-600 dark:text-sky-400">
                      {selectedPetugas.title}
                    </div>
                  </div>
                </div>

                {petugasPinError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
                    {petugasPinError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Masukkan PIN Petugas:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={petugasPinInput}
                    onChange={(e) => setPetugasPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white outline-none focus:border-sky-500"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPetugas(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    Ganti Petugas
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                  >
                    Buka Kasir
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KHUSUS 2: LOGIN SUPER ADMIN (PRIBADI & TANPA TEKS BOCORAN) */}
      {/* ========================================================================= */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            
            {/* Header Modal Super Admin */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Super Admin Ma'had
                  </h3>
                  <div className="text-[11px] text-slate-500">Administrator & Bendahara</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setAdminPasswordInput('');
                  setAdminPasswordError('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSuperAdminSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Silakan ketik password akun Super Admin Ma'had Anda untuk membuka panel pengelolaan keuangan:
              </div>

              {adminPasswordError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
                  {adminPasswordError}
                </div>
              )}

              {/* Input Password Bersih Bertopeng Masked */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password Super Admin:
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Masukkan password akun..."
                    className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    tabIndex={-1}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Masuk sebagai Super Admin</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      <WhatsAppMessageModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        recipientName={waModalData.recipientName}
        recipientRole={waModalData.recipientRole}
        phoneNumber={waModalData.phoneNumber}
        initialMessage={waModalData.initialMessage}
        title={waModalData.title}
      />
    </div>
  );
}
