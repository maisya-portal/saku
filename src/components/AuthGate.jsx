import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Lock, 
  Fingerprint, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Clock,
  CheckCircle2, 
  RotateCcw, 
  MessageSquare, 
  Sparkles, 
  ExternalLink, 
  ChevronRight, 
  ShieldAlert, 
  Sun, 
  Moon,
  Smartphone,
  Phone,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import BiometricTouchPad from './BiometricTouchPad';
import LandingPage from './LandingPage';
import WhatsAppMessageModal from './WhatsAppMessageModal';
import confetti from 'canvas-confetti';

export default function AuthGate() {
  const { 
    urlToken, 
    setUrlToken, 
    resolveTargetFromToken,
    resolveTargetFromTokenAsync,
    loginWithPin, 
    loginWithBiometric, 
    requestFingerprintEnrollment,
    approveFingerprint,
    approveStaffBiometric,
    resetFingerprint,
    pesantrenInfo,
    santriList,
    theme,
    toggleTheme,
    showToast
  } = useApp();

  const [activeToken, setActiveToken] = useState(urlToken || '');
  const [targetAccount, setTargetAccount] = useState(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [authMode, setAuthMode] = useState('biometric'); // Focus strictly on biometric!
  const [inputPin, setInputPin] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [failedFingerprintAttempts, setFailedFingerprintAttempts] = useState(0);
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
      const tok = hashParams.get('token') || '';
      setActiveToken(tok);
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
        setFailedFingerprintAttempts(0);
        window.location.hash = `token=${clean}`;

        // AUTO-LOGIN: Jika wali santri sudah terverifikasi biometriknya, langsung masuk ke aplikasi!
        if (local.type === 'wali' && local.fingerprintStatus === 'APPROVED') {
          loginWithBiometric(local, 'VERIFIED_LINK_DIRECT_LOGIN');
          return;
        }

        if (local.role === 'admin') {
          setAuthMode('password'); // Admin khusus password tanpa biometrik
        } else {
          setAuthMode('biometric');
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
              setFailedFingerprintAttempts(0);
              if (remote) {
                window.location.hash = `token=${clean}`;

                // AUTO-LOGIN: Jika wali santri remote sudah disetujui, langsung masuk ke aplikasi!
                if (remote.type === 'wali' && remote.fingerprintStatus === 'APPROVED') {
                  loginWithBiometric(remote, 'VERIFIED_LINK_DIRECT_LOGIN');
                  return;
                }

                if (remote.role === 'admin') {
                  setAuthMode('password');
                } else {
                  setAuthMode('biometric');
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
  }, [activeToken, resolveTargetFromToken, resolveTargetFromTokenAsync, santriList, loginWithBiometric]);

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
      setErrorMsg('Password Super Admin Salah! (Gunakan password default: iftahadmin87)');
      setAdminPasswordInput('');
    }
  }, [adminPasswordInput, targetAccount, loginWithPin]);

  // PIN Login
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

  // Biometric Login (Verification successful)
  const handleBiometricSuccess = (method, scannedCode) => {
    try {
      // Validate unique fingerprint code if present
      if (targetAccount.fingerprintCode && scannedCode && scannedCode !== targetAccount.fingerprintCode) {
        handleBiometricFailure('Kode sidik jari tidak sesuai dengan data biometrik yang didaftarkan ke admin!');
        return;
      }
      loginWithBiometric(targetAccount, method);
      confetti({ particleCount: 80, spread: 60 });
    } catch (err) {
      handleBiometricFailure(err.message);
    }
  };

  // Biometric Verification Failure Tracker
  const handleBiometricFailure = (customMsg = 'Verifikasi sidik jari gagal. Pastikan jari bersih dan menempel tepat pada sensor.') => {
    playSound('error');
    setFailedFingerprintAttempts(prev => {
      const next = prev + 1;
      if (next >= 3) {
        setErrorMsg(`Gagal memverifikasi sidik jari (${next}x). Pilihan PIN Darurat sekarang dibuka di bawah!`);
      } else {
        setErrorMsg(`${customMsg} (Gagal ${next}/3 kali percobaan)`);
      }
      return next;
    });
  };

  // Biometric Registration (Enrollment step for newly registered wali)
  const handleFingerprintEnrollment = (method, generatedCode) => {
    if (!targetAccount) return;
    const fpCode = requestFingerprintEnrollment(targetAccount.token, method, generatedCode);
    confetti({ particleCount: 60, spread: 50 });
    showToast(`Sidik jari berhasil direkam dengan kode: ${fpCode}. Menunggu persetujuan Admin Ma'had.`, 'success');
  };

  // Contact Admin via WhatsApp for quick approval (Link wa.me/6282119836050)
  const handleContactAdminWA = () => {
    const adminPhone = pesantrenInfo.whatsappAdmin || '6282119836050';
    const isRole = targetAccount?.type === 'role';
    const childList = targetAccount?.children?.map(c => `${c.name} (${c.nis})`).join(', ') || targetAccount?.title || '';
    const msg = isRole
      ? `Assalamu'alaikum Warahmatullahi Wabarakatuh Admin Ma'had Imam Syafi'i Brebes.\n\n` +
        `Saya Petugas: *${targetAccount?.name || '-'}* (${targetAccount?.title || '-'})\n` +
        `Kode Sidik Jari: *${targetAccount?.fingerprintCode || '-'}*\n\n` +
        `Telah melakukan pendaftaran biometrik petugas pada sistem Maisya-Saku.\n` +
        `Mohon dibantu verifikasi & persetujuannya di Panel Super Admin. Jazakumullahu khairan.`
      : `Assalamu'alaikum Warahmatullahi Wabarakatuh Admin Ma'had Imam Syafi'i Brebes.\n\n` +
        `Saya Wali Santri: *${targetAccount?.name || '-'}*\n` +
        `Santri Terikat: *${childList}*\n` +
        `Kode Gembok Database: *${targetAccount?.bindingLockCode || '-'}*\n` +
        `Kode Sidik Jari: *${targetAccount?.fingerprintCode || '-'}*\n` +
        `PIN Masuk Otomatis: *${targetAccount?.pin || '-'}*\n\n` +
        `Telah berhasil merekam pendaftaran sidik jari biometrik pada sistem Maisya-Saku.\n` +
        `Mohon dibantu verifikasi & persetujuannya agar tautan login sidik jari dapat aktif. Jazakumullahu khairan.`;

    setWaModalData({
      recipientName: "Admin Ma'had Imam Syafi'i Brebes",
      recipientRole: "Verifikasi Pendaftaran & Gembok Akun",
      phoneNumber: adminPhone,
      initialMessage: msg,
      title: "Pratinjau Pesan Konfirmasi ke Admin Ma'had"
    });
    setWaModalOpen(true);
  };

  // IF STILL VERIFYING TOKEN FROM FIRESTORE: RENDER LOADING SCREEN
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-3xl bg-sky-100 dark:bg-sky-950/80 border-2 border-sky-400 text-sky-600 dark:text-sky-400 flex items-center justify-center animate-bounce mb-4 shadow-xl shadow-sky-500/20">
          <Fingerprint className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          Memverifikasi Tautan Akses Resmi...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
          Menghubungkan ke database Ma'had Imam Syafi'i Brebes untuk membuka pendaftaran sidik jari Anda
        </p>
      </div>
    );
  }

  // IF NO TOKEN OR TOKEN INVALID: RENDER COMPREHENSIVE LANDING PAGE
  if (!activeToken || !targetAccount) {
    return <LandingPage onSelectRole={(tok) => setActiveToken(tok)} />;
  }

  const isWali = targetAccount.type === 'wali';
  const fpStatus = isWali ? (targetAccount.fingerprintStatus || 'NOT_REGISTERED') : 'APPROVED';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-sky-500 selection:text-white relative transition-colors font-sans">
      
      {/* Top Header & Theme Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <img 
            src="./logo-maisya.jpg" 
            alt="Logo Maisya" 
            className="w-10 h-10 rounded-2xl object-cover border border-sky-300 dark:border-sky-800 shadow-sm"
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
              <img
                src={targetAccount.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                alt={targetAccount.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-sky-500 shadow-md shrink-0"
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

          {/* ========================================================= */}
          {/* STATE 1: NOT REGISTERED (HALAMAN KHUSUS PENDAFTARAN BERSIH) */}
          {/* ========================================================= */}
          {isWali && fpStatus === 'NOT_REGISTERED' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
                  <Fingerprint className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Halaman Khusus: Pendaftaran Sidik Jari</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white pt-2">
                  Daftarkan Sidik Jari Anda
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Demi perlindungan saldo santri dan kepatuhan anti-ganda, rekam sidik jari Anda langsung pada layar sentuh di bawah.
                </p>
              </div>

              {/* Data Binding Preview */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-1.5">
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
                  <span className="text-slate-500">PIN Masuk Otomatis:</span>
                  <span className="font-mono font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.2 rounded">
                    {targetAccount.pin} (Disimpan untuk darurat)
                  </span>
                </div>
              </div>

              {/* Clean Biometric Touch Sensor */}
              <BiometricTouchPad
                santriName={targetAccount.name}
                title="Rekam Sidik Jari Fisik"
                subtitle="Sentuh & tahan lingkaran sensor pada layar sentuh HP/tablet Anda hingga penuh 100%"
                isEnrollment={true}
                onVerified={handleFingerprintEnrollment}
              />

              <div className="text-[11px] text-center text-slate-400 pt-1">
                Catatan: Kursor mouse laptop tidak dapat digunakan. Sensor hanya menerima sentuhan jari fisik.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STATE 2: PENDING APPROVAL (STATUS BERSIH MENUNGGU PERSETUJUAN ADMIN) */}
          {/* ========================================================= */}
          {isWali && fpStatus === 'PENDING_APPROVAL' && (
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                  Status: Menunggu Persetujuan Admin
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white pt-2">
                  Menunggu Persetujuan Admin Ma'had
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Pendaftaran sidik jari Anda telah berhasil disimpan di database. Demi keamanan dana santri, tautan login sidik jari baru dapat dibuka setelah <strong>Admin Ma'had</strong> menyetujui akun ini.
                </p>
              </div>

              {/* Identification Locking Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Wali Santri:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{targetAccount.name}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Nomor WhatsApp:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{targetAccount.phone || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Santri Terikat:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400 truncate max-w-[200px] text-right">
                    {targetAccount.children?.map(c => `${c.name} (${c.nis})`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Kode Gembok Pengikat:</span>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {targetAccount.bindingLockCode || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Kode Sidik Jari Unik:</span>
                  <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                    {targetAccount.fingerprintCode || 'Terekam di Layar'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>PIN Masuk Otomatis:</span>
                  <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                    {targetAccount.pin}
                  </span>
                </div>
              </div>

              {/* Contact Admin WA Button (wa.me/6282119836050) */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleContactAdminWA}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-transform active:scale-98"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Hubungi Admin Ma'had via WhatsApp (082119836050)</span>
                </button>

                {/* Instant Simulator for Testing Environment */}
                <button
                  type="button"
                  onClick={() => {
                    approveFingerprint(targetAccount.token);
                    confetti({ particleCount: 70, spread: 60 });
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 font-semibold py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Simulasi Pengujian: Setujui Sekarang & Buka Login</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                🔒 Tautan login sidik jari dinonaktifkan sementara hingga admin menyetujui. Setelah disetujui, halaman login biometrik akan otomatis terbuka.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STATE 3: REJECTED */}
          {/* ========================================================= */}
          {isWali && fpStatus === 'REJECTED' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Pendaftaran Sidik Jari Ditolak
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">
                  Mohon maaf, permohonan verifikasi biometrik tidak dapat disetujui oleh admin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => resetFingerprint(targetAccount.token)}
                className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Daftar Ulang Sidik Jari</span>
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* STATE 4: APPROVED, STAFF ROLE, OR SUPER ADMIN LOGIN */}
          {/* ========================================================= */}
          {(!isWali || fpStatus === 'APPROVED') && (
            <>
              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* A. SUPER ADMIN LOGIN (PASSWORD ONLY - NO SENSOR BIOMETRIK) */}
              {targetAccount.role === 'admin' ? (
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Password Super Admin:</span>
                      <span className="text-[11px] font-normal text-slate-400">Default: <strong className="font-mono text-emerald-600 dark:text-emerald-400">iftahadmin87</strong></span>
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        placeholder="Ketik password iftahadmin87..."
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

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Masuk sebagai Super Admin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdminPasswordInput('iftahadmin87');
                        setErrorMsg('');
                      }}
                      className="w-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold py-2 px-3 rounded-xl text-xs transition-colors"
                    >
                      Gunakan Password Default (iftahadmin87)
                    </button>
                  </div>
                </form>
              ) : targetAccount.type === 'role' && targetAccount.biometricStatus === 'PENDING_APPROVAL' ? (
                /* B. PETUGAS WAITING FOR APPROVAL */
                <div className="space-y-4 text-center py-2">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                      Status Petugas: Menunggu Persetujuan Admin
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white pt-2">
                      Sidik Jari Petugas Sedang Diverifikasi
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                      Data pendaftaran biometrik Anda telah terekam. Silakan konfirmasi ke Super Admin Ma'had agar sidik jari disetujui dan dapat digunakan untuk login bertransaksi.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Nama Petugas:</span>
                      <span className="text-slate-900 dark:text-white font-bold">{targetAccount.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Unit / Posisi:</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">{targetAccount.title}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Kode Sidik Jari:</span>
                      <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {targetAccount.fingerprintCode || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleContactAdminWA}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-transform active:scale-98"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Hubungi Admin Ma'had via WhatsApp (082119836050)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        approveStaffBiometric(targetAccount.token);
                        confetti({ particleCount: 70, spread: 60 });
                      }}
                      className="w-full bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 font-semibold py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Simulasi Pengujian: Setujui Sekarang & Buka Login Petugas</span>
                    </button>
                  </div>
                </div>
              ) : targetAccount.type === 'role' ? (
                /* C. PETUGAS APPROVED: MANDATORY BIOMETRIC LOGIN ONLY */
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300 text-xs font-bold">
                      <Fingerprint className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Login Biometrik Petugas ({targetAccount.title})</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Wajib menempelkan jari fisik pada sensor layar HP/tablet. Tidak dapat diklik dengan mouse.
                    </p>
                  </div>

                  <BiometricTouchPad
                    santriName={targetAccount.name}
                    title={`Verifikasi Sidik Jari ${targetAccount.title}`}
                    subtitle="Tempelkan sidik jari pada sensor di bawah hingga penuh 100%"
                    expectedFingerprintCode={targetAccount.fingerprintCode}
                    onVerified={handleBiometricSuccess}
                  />
                </div>
              ) : (
                /* D. WALI SANTRI LOGIN (AUTO-DIRECT / PURE BIOMETRIC WITH 3x EMERGENCY PIN) */
                <div className="space-y-4">
                  {/* DIRECT ACCESS BANNER FOR VERIFIED WALI */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-600/50 rounded-2xl text-center space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Akun & Sidik Jari Terverifikasi Resmi</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Selamat datang Wali Santri <strong>{targetAccount.name}</strong>. Tautan Anda telah terverifikasi oleh Admin Ma'had.
                    </p>
                    <button
                      type="button"
                      onClick={() => loginWithBiometric(targetAccount, 'VERIFIED_LINK_DIRECT_LOGIN')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Masuk Langsung ke Portal Pengelolaan Uang Santri</span>
                    </button>
                  </div>

                  {/* FINGERPRINT TOUCHPAD OPTION */}
                  {authMode === 'biometric' && (
                    <div className="space-y-4 pt-1">
                      <BiometricTouchPad
                        santriName={targetAccount.name}
                        title="Atau Pindai Sidik Jari Masuk"
                        subtitle="Tempelkan sidik jari fisik pada sensor layar sentuh"
                        expectedFingerprintCode={targetAccount.fingerprintCode}
                        onVerified={handleBiometricSuccess}
                      />

                      {/* Failure simulator/test button if user has scanner trouble */}
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => handleBiometricFailure('Sidik jari tidak cocok dengan data terdaftar')}
                          className="text-[11px] text-slate-400 hover:text-rose-500 hover:underline transition-colors"
                        >
                          Kendala Sidik Jari? (Simulasi Gagal: {failedFingerprintAttempts}/3)
                        </button>
                      </div>

                      {/* EMERGENCY PIN FALLBACK (SHOWN ONLY IF 3+ FAILURES AS REQUESTED) */}
                      {failedFingerprintAttempts >= 3 && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-600/50 rounded-2xl text-center space-y-2.5 animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Sidik Jari Gagal 3 Kali Berturut-turut</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            Fitur darurat telah aktif. Anda dapat menggunakan PIN 4-digit yang telah dibuat saat pendaftaran untuk masuk ke portal.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('pin');
                              setErrorMsg('');
                            }}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                          >
                            <KeyRound className="w-4 h-4" />
                            <span>Masuk dengan PIN Darurat Wali</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* EMERGENCY NUMERIC PIN MODE (FOR WALI AFTER 3 FAILED ATTEMPTS) */}
                  {authMode === 'pin' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Masukkan {targetAccount.pin?.length || 4}-digit PIN Keamanan:
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Gunakan PIN darurat yang dibuat otomatis saat registrasi
                        </div>

                        {/* Hidden input to capture keyboard */}
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

                      {/* Back to Biometric button */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('biometric');
                            setErrorMsg('');
                          }}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center justify-center gap-1 mx-auto"
                        >
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>Kembali ke Sensor Sidik Jari</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pb-2">
        {pesantrenInfo.name} • {pesantrenInfo.address} • WhatsApp: {pesantrenInfo.phone}
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
