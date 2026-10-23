import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2, 
  Clock,
  Sun, 
  Moon,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  MessageSquare,
  LogOut,
  Fingerprint
} from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import LandingPage from './LandingPage';
import WhatsAppMessageModal from './WhatsAppMessageModal';
import InitialsAvatar from './InitialsAvatar';
import confetti from 'canvas-confetti';

export default function AuthGate() {
  const { 
    urlToken, 
    setUrlToken, 
    resolveTargetFromToken,
    resolveTargetFromTokenAsync,
    loginWithPin, 
    loginDirectly,
    pesantrenInfo,
    santriList,
    theme,
    toggleTheme,
    showToast
  } = useApp();

  const [activeToken, setActiveToken] = useState(urlToken || '');
  const [waliConfirmState, setWaliConfirmState] = useState('confirm'); // 'verifying' | 'confirm' | 'launching' | 'cancelled'
  const [targetAccount, setTargetAccount] = useState(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [authMode, setAuthMode] = useState('pin'); // 'pin' for staff, 'password' for admin, 'direct' for wali
  const [inputPin, setInputPin] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waModalData, setWaModalData] = useState({
    recipientName: '',
    recipientRole: '',
    phoneNumber: '',
    initialMessage: '',
    title: ''
  });
  const pinInputRef = useRef(null);

  // Helper to extract clean token if user pastes a full URL or #token=xxx
  const parseTokenString = (str) => {
    if (!str) return '';
    const trimmed = str.trim();
    if (trimmed.includes('token=')) {
      const match = trimmed.match(/token=([a-zA-Z0-9_-]+)/);
      return match ? match[1] : trimmed;
    }
    return trimmed.replace(/^#/, '');
  };

  // Sync with URL changes
  useEffect(() => {
    const handleHash = () => {
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      const urlParams = new URLSearchParams(window.location.search);
      const tok = hashParams.get('token') || urlParams.get('token') || '';
      if (tok) {
        setActiveToken(prev => (prev === tok ? prev : tok));
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update target when activeToken or santriList changes
  useEffect(() => {
    let isCancelled = false;
    if (activeToken) {
      const clean = parseTokenString(activeToken);
      const local = resolveTargetFromToken(clean);
      if (local) {
        setTargetAccount(local);
        setInputPin('');
        setAdminPasswordInput('');
        setErrorMsg('');
        
        const expectedHash = `#token=${clean}`;
        if (window.location.hash !== expectedHash) {
          window.location.hash = `token=${clean}`;
        }

        // WALI SANTRI: TAHAN DENGAN HALAMAN KONFIRMASI MASUK
        if (local.type === 'wali') {
          const isApproved = Boolean(
            local.isApproved ?? (
              local.fingerprintStatus === 'APPROVED' || 
              local.bindingStatus === 'APPROVED' || 
              local.bindingStatus === 'LOCKED'
            )
          );
          if (isApproved) {
            setWaliConfirmState('verifying');
            const timer = setTimeout(() => {
              if (!isCancelled) setWaliConfirmState('confirm');
            }, 800);
            return () => clearTimeout(timer);
          }
          return;
        }

        if (local.role === 'admin') {
          setAuthMode('password'); // Admin password only
        } else {
          setAuthMode('pin'); // Petugas PIN only (tanpa biometrik)
        }
      } else {
        // Query remote Firestore if not found locally yet
        setIsVerifyingToken(true);
        resolveTargetFromTokenAsync(clean)
          .then((remote) => {
            if (!isCancelled) {
              setIsVerifyingToken(false);
              setTargetAccount(remote);
              setInputPin('');
              setAdminPasswordInput('');
              setErrorMsg('');
              if (remote) {
                const expectedHash = `#token=${clean}`;
                if (window.location.hash !== expectedHash) {
                  window.location.hash = `token=${clean}`;
                }

                // WALI SANTRI REMOTE: TAHAN DENGAN HALAMAN KONFIRMASI MASUK
                if (remote.type === 'wali') {
                  const isApproved = Boolean(
                    remote.isApproved ?? (
                      remote.fingerprintStatus === 'APPROVED' || 
                      remote.bindingStatus === 'APPROVED' || 
                      remote.bindingStatus === 'LOCKED'
                    )
                  );
                  if (isApproved) {
                    setWaliConfirmState('verifying');
                    const timer = setTimeout(() => {
                      if (!isCancelled) setWaliConfirmState('confirm');
                    }, 800);
                    return () => clearTimeout(timer);
                  }
                  return;
                }

                if (remote.role === 'admin') {
                  setAuthMode('password');
                } else {
                  setAuthMode('pin');
                }
              }
            }
          })
          .catch(() => {
            if (!isCancelled) setIsVerifyingToken(false);
          });
      }
    } else {
      setTargetAccount(null);
    }
    return () => { isCancelled = true; };
  }, [activeToken, resolveTargetFromToken, resolveTargetFromTokenAsync, santriList, loginDirectly]);

  // SUPER ADMIN PASSWORD LOGIN (Default: iftahadmin87)
  const handleAdminPasswordSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (!adminPasswordInput.trim()) {
      setErrorMsg('Silakan masukkan password Super Admin.');
      return;
    }
    const expected = targetAccount?.pin || targetAccount?.password || 'iftahadmin87';
    if (adminPasswordInput.trim() === expected || adminPasswordInput.trim() === 'iftahadmin87') {
      try {
        loginWithPin(targetAccount, targetAccount.pin || 'iftahadmin87');
        confetti({ particleCount: 75, spread: 65 });
      } catch (err) {
        setErrorMsg(err.message);
      }
    } else {
      playSound('error');
      setErrorMsg('Password Super Admin salah! Silakan coba lagi.');
      setAdminPasswordInput('');
    }
  }, [adminPasswordInput, targetAccount, loginWithPin]);

  // PIN Login for Staff / Wali
  const attemptPinLogin = useCallback((pinToTest) => {
    try {
      loginWithPin(targetAccount, pinToTest);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err) {
      setErrorMsg(err.message);
      setInputPin('');
      if (pinInputRef.current) pinInputRef.current.focus();
    }
  }, [targetAccount, loginWithPin]);

  // Handle PIN input digit
  const handlePinDigit = useCallback((digit) => {
    const maxLen = targetAccount?.pin?.length || 4;
    setInputPin(prev => {
      if (prev.length < maxLen) {
        playSound('beep');
        const next = prev + digit;
        if (targetAccount && next.length === maxLen) {
          setTimeout(() => attemptPinLogin(next), 50);
        }
        return next;
      }
      return prev;
    });
    setErrorMsg('');
  }, [targetAccount, attemptPinLogin]);

  const handlePinBackspace = useCallback(() => {
    setInputPin(prev => prev.slice(0, -1));
    setErrorMsg('');
    playSound('beep');
  }, []);

  const handleClearPin = useCallback(() => {
    setInputPin('');
    setErrorMsg('');
  }, []);

  
  // KONFIRMASI MASUK KE APLIKASI
  const handleConfirmEnterApp = useCallback(() => {
    if (!targetAccount) return;
    setWaliConfirmState('launching');
    playSound('success');
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
      loginDirectly(targetAccount);
    }, 500);
  }, [targetAccount, loginDirectly]);

  // BATALKAN & KELUAR APLIKASI / BROWSER
  const handleCancelAndExit = useCallback(() => {
    playSound('beep');
    setWaliConfirmState('cancelled');
    setActiveToken('');
    setTargetAccount(null);
    setUrlToken('');
    
    // Bersihkan hash dari URL browser
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {
        window.location.hash = '';
      }
      // Coba tutup tab / jendela browser
      try {
        window.close();
      } catch (e) {
        console.log('window.close prevented by browser security policy');
      }
    }
  }, [setUrlToken]);

  // Physical Keyboard Listener for Laptop / PC
  useEffect(() => {
    if (!targetAccount || authMode !== 'pin') return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' && e.target !== pinInputRef.current) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClearPin();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (inputPin.length > 0) {
          attemptPinLogin(inputPin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetAccount, authMode, inputPin, handlePinDigit, handlePinBackspace, handleClearPin, attemptPinLogin]);

  // Contact Admin via WhatsApp helper
  const handleContactAdminWA = () => {
    const adminPhone = pesantrenInfo.whatsappAdmin || '6282119836050';
    const childList = targetAccount?.children?.map(c => `${c.name} (${c.nis})`).join(', ') || targetAccount?.title || '';
    const msg = 
      `Assalamu'alaikum Warahmatullahi Wabarakatuh Admin Ma'had Imam Syafi'i Brebes.\n\n` +
      `Saya Wali Santri: *${targetAccount?.name || '-'}*\n` +
      `Santri: *${childList}*\n` +
      `Nomor Terdaftar: *${targetAccount?.phone || '-'}*\n\n` +
      `Telah mendaftar di portal Maisya-Saku dan sedang menunggu persetujuan/verifikasi admin agar link login resmi dapat dikirimkan ke WhatsApp saya. Jazakumullahu khairan.`;

    setWaModalData({
      recipientName: "Admin Ma'had Imam Syafi'i Brebes",
      recipientRole: "Verifikasi Pendaftaran Akun",
      phoneNumber: adminPhone,
      initialMessage: msg,
      title: "Hubungi Admin Ma'had via WhatsApp"
    });
    setWaModalOpen(true);
  };

  // JIKA USER MEMILIH BATAL / KELUAR DARI HALAMAN KONFIRMASI
  if (waliConfirmState === 'cancelled') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans relative overflow-hidden">
        <div className="absolute w-72 h-72 rounded-full bg-rose-500/10 blur-3xl -top-12 pointer-events-none" />
        <div className="max-w-md w-full bg-slate-850 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-rose-950/70 border-2 border-rose-500/60 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
            <LogOut className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold">
              Akses Dibatalkan
            </div>
            <h2 className="text-xl font-black text-white">
              Anda Tidak Masuk ke Aplikasi
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Sesi telah diakhiri dengan aman dan tautan login telah dilepas. Anda dapat menutup tab atau jendela browser ini.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300 text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Keamanan Akun Terjaga</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tidak ada data yang diakses atau diubah. Jika ingin masuk kembali, silakan klik kembali tautan resmi yang dikirimkan Admin Ma'had di WhatsApp Anda.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                try { window.close(); } catch (e) {}
              }}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Tutup Tab / Jendela Browser</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setWaliConfirmState('confirm');
                setActiveToken('');
                setTargetAccount(null);
                window.location.hash = '';
              }}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-sky-400 underline transition-colors cursor-pointer"
            >
              Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ANIMASI SAMBUTAN MENUJU APLIKASI SAAT LINK WHATSAPP DIKLIK
  if (activeToken && targetAccount && targetAccount.type === 'wali' && waliConfirmState === 'verifying') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans relative overflow-hidden">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin flex items-center justify-center" />
          <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center absolute top-5 left-5 animate-pulse">
            <Smartphone className="w-7 h-7 text-sky-400" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-950/80 border border-sky-700/60 text-sky-300 text-xs font-bold mb-3 shadow-lg shadow-sky-500/20">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
          <span>Tautan WhatsApp Terdeteksi</span>
        </div>
        <h3 className="text-lg font-black text-white">
          Menghubungkan ke Portal Maisya-Saku...
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          Memverifikasi identitas Wali Santri terdaftar dan menyiapkan konfirmasi akses...
        </p>
      </div>
    );
  }

  // ANIMASI TRANSISI MASUK KE DASHBOARD SAAT KLIK 'YA, MASUK'
  if (waliConfirmState === 'launching') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center animate-bounce mb-5 shadow-2xl shadow-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 animate-pulse" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold mb-3">
          <span>Konfirmasi Diterima</span>
        </div>
        <h3 className="text-xl font-black text-white">
          Membuka Portal Wali Santri...
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
          Selamat datang, Bapak/Ibu {targetAccount?.name}. Memuat data keuangan santri...
        </p>
      </div>
    );
  }

  // IF STILL VERIFYING TOKEN FROM FIRESTORE: RENDER LOADING SCREEN
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-3xl bg-sky-100 dark:bg-sky-950/80 border-2 border-sky-400 text-sky-600 dark:text-sky-400 flex items-center justify-center animate-bounce mb-4 shadow-xl shadow-sky-500/20">
          <ShieldCheck className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          Memverifikasi Tautan Akses Resmi...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
          Menghubungkan ke database Ma'had Imam Syafi'i Brebes untuk memeriksa status akun Anda...
        </p>
      </div>
    );
  }

  // IF NO TOKEN OR TOKEN INVALID: RENDER CLEAN LANDING PAGE
  if (!activeToken || !targetAccount) {
    return <LandingPage onSelectRole={(tok) => setActiveToken(tok)} />;
  }

  const isWali = targetAccount.type === 'wali';
  const isApproved = Boolean(
    targetAccount.isApproved ?? (
      targetAccount.fingerprintStatus === 'APPROVED' || 
      targetAccount.bindingStatus === 'APPROVED' || 
      targetAccount.bindingStatus === 'LOCKED'
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-sky-500 selection:text-white relative transition-colors font-sans">
      
      {/* Top Header & Theme Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <img 
            src="./logo-maisya.png" 
            alt="Logo Maisya" 
            className="w-10 h-10 object-contain shadow-sm"
          />
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              Maisya-Saku
            </div>
            <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
              Ma'had Imam Syafi'i Brebes
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-850 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
          title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>

      {/* Main Authentication Container */}
      <div className="max-w-md w-full mx-auto my-auto py-2">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl space-y-5 animate-in fade-in zoom-in-95 transition-colors">
          
          {/* Account Profile Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <InitialsAvatar
                name={targetAccount.name}
                src={targetAccount.avatar}
                className="w-12 h-12 text-sm"
                rounded="rounded-2xl"
              />
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                  {targetAccount.name}
                </div>
                <div className="text-xs text-sky-600 dark:text-sky-400 font-semibold mt-0.5 truncate">
                  {targetAccount.title}
                </div>
                {targetAccount.bindingLockCode && (
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    Gembok: {targetAccount.bindingLockCode}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveToken('');
                setTargetAccount(null);
                window.location.hash = '';
              }}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-rose-600 underline font-medium shrink-0 ml-2"
            >
              Keluar
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. WALI SANTRI LOGIN: TERVERIFIKASI & KONFIRMASI MASUK */}
          {/* ========================================================= */}
          {isWali && isApproved && (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Tautan WhatsApp Terverifikasi Resmi</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white pt-1">
                  Ahlan wa Sahlan, {targetAccount.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Tautan akses resmi Anda terdeteksi. Silakan konfirmasi apakah Anda ingin masuk ke aplikasi sekarang.
                </p>
              </div>

              {/* Data Wali & Santri Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-2.5 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Wali Santri:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{targetAccount.name}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">No. WhatsApp:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{targetAccount.phone || '-'}</span>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <div className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    Santri Terikat ({targetAccount.children?.length || 0}):
                  </div>
                  {targetAccount.children && targetAccount.children.length > 0 ? (
                    targetAccount.children.map((child, idx) => {
                      const hasBio = Boolean(
                        child.biometricRegistered || 
                        child.hasFingerprint || 
                        child.biometricVerified
                      );
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                              {child.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              NIS: {child.nis || '-'} • Kelas: {child.kelas || '-'}
                            </div>
                          </div>
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                            hasBio 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300'
                          }`}>
                            <Fingerprint className="w-3 h-3" />
                            <span>{hasBio ? 'Biometrik Aktif' : 'Belum Biometrik'}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-500 text-xs italic">
                      {targetAccount.title || 'Data santri terikat'}
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmation Prompt Box */}
              <div className="p-3.5 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 rounded-2xl text-center space-y-1">
                <div className="text-xs font-extrabold text-sky-900 dark:text-sky-300">
                  Konfirmasi: Mau Masuk ke Aplikasi Sekarang?
                </div>
                <p className="text-[11px] text-sky-700 dark:text-sky-400 leading-normal">
                  Tekan <strong>Ya</strong> untuk membuka dashboard saldo, mutasi, dan biometrik santri. Tekan <strong>Batalkan</strong> jika Anda tidak jadi masuk.
                </p>
              </div>

              {/* Two Confirmation Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Ya, Masuk */}
                <button
                  type="button"
                  onClick={handleConfirmEnterApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-5 h-5 animate-pulse" />
                  <span>Ya, Masuk ke Aplikasi Sekarang</span>
                </button>

                {/* 2. Tidak Jadi / Batalkan & Keluar */}
                <button
                  type="button"
                  onClick={handleCancelAndExit}
                  className="w-full bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/90 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-750 hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>✕ Tidak Jadi / Batalkan & Keluar</span>
                </button>
              </div>
            </div>
          )}

          {/* 1B. WALI SANTRI BELUM DISETUJUI ADMIN (MENUNGGU VERIFIKASI) */}
          {isWali && !isApproved && (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Sudah Mendaftar - Menunggu Verifikasi Admin</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white pt-1">
                  Menunggu Persetujuan Admin Ma'had
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Pendaftaran akun Bapak/Ibu <strong>{targetAccount.name}</strong> sudah tercatat. Namun tautan login resmi belum aktif karena sedang menunggu persetujuan dari Admin Ma'had.
                </p>
              </div>

              {/* Data Binding Preview */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Wali Santri:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{targetAccount.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Santri Terikat:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400 text-right truncate max-w-[200px]">
                    {targetAccount.children?.map(c => c.name).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. WhatsApp:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{targetAccount.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Login:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Menunggu Verifikasi Admin Ma'had
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs text-left leading-relaxed">
                ℹ️ <strong>Tautan Login Belum Dikirimkan:</strong> Admin Ma'had akan memverifikasi data Anda dan mengirimkan tautan login resmi langsung ke WhatsApp Anda (<span className="font-mono">{targetAccount.phone || '-'}</span>).
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleContactAdminWA}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-transform"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Hubungi Admin Ma'had via WhatsApp (082119836050)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveToken('');
                    setTargetAccount(null);
                    window.location.hash = '';
                  }}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:underline"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. SUPER ADMIN LOGIN (PASSWORD ONLY - DEFAULT: iftahadmin87) */}
          {/* ========================================================= */}
          {!isWali && targetAccount.role === 'admin' && (
            <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Login Khusus Super Admin (Password Only)</span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white pt-1">
                  Bendahara & Super Admin Ma'had
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Super Admin tidak menggunakan sensor biometrik. Silakan ketik password akun Anda.
                </p>
              </div>

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
                    className="w-full px-4 py-3.5 pr-11 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white shadow-sm"
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

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Masuk sebagai Super Admin</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* 3. PETUGAS LOGIN (PIN ONLY - TANPA BIOMETRIK) */}
          {/* ========================================================= */}
          {!isWali && targetAccount.role !== 'admin' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300 text-xs font-bold">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Login Petugas: {targetAccount.title}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Masukkan PIN 4-digit petugas untuk membuka kasir transaksi.
                </p>
              </div>

              <div className="text-center">
                <div className="text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Masukkan PIN Petugas:
                </div>

                {/* Hidden input to capture physical keyboard */}
                <input
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={targetAccount.pin?.length || 4}
                  value={inputPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setInputPin(val);
                    if (val.length === (targetAccount.pin?.length || 4)) {
                      attemptPinLogin(val);
                    }
                  }}
                  className="opacity-0 absolute -z-10 pointer-events-none"
                  autoFocus
                />

                {/* Visual PIN Dots Indicator */}
                <div 
                  onClick={() => pinInputRef.current && pinInputRef.current.focus()}
                  className="flex justify-center items-center gap-3 my-4 cursor-pointer"
                >
                  {Array.from({ length: targetAccount.pin?.length || 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        idx < inputPin.length
                          ? 'bg-sky-500 scale-125 shadow-sm shadow-sky-400/80'
                          : 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* On-screen Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinDigit(String(num))}
                    className="py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 active:scale-95 text-lg font-bold text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all select-none"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 active:scale-95 text-xs font-bold text-slate-500 dark:text-slate-400 rounded-2xl transition-all border border-slate-200 dark:border-slate-800"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 active:scale-95 text-lg font-bold text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all select-none"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinBackspace}
                  className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 active:scale-95 text-xs font-bold text-slate-500 dark:text-slate-400 rounded-2xl transition-all border border-slate-200 dark:border-slate-800"
                >
                  ⌫ Hapus
                </button>
              </div>

              <div className="text-[11px] text-center text-slate-400 pt-1">
                Gunakan 4-digit PIN resmi petugas Anda.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pb-2">
        {pesantrenInfo.name} • {pesantrenInfo.address}
      </div>

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
