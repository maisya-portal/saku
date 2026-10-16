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
  Moon
} from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import BiometricTouchPad from './BiometricTouchPad';
import WaliLinkGenerator from './WaliLinkGenerator';
import { openWhatsAppDirect } from '../utils/whatsapp';
import confetti from 'canvas-confetti';

export default function AuthGate() {
  const { 
    urlToken, 
    setUrlToken, 
    resolveTargetFromToken, 
    loginWithPin, 
    loginWithBiometric, 
    requestFingerprintEnrollment,
    approveFingerprint,
    resetFingerprint,
    pesantrenInfo,
    santriList,
    theme,
    toggleTheme
  } = useApp();

  const [activeToken, setActiveToken] = useState(urlToken || '');
  const [targetAccount, setTargetAccount] = useState(null);
  const [authMode, setAuthMode] = useState('pin'); // 'pin' | 'biometric'
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
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
    if (activeToken) {
      const clean = parseTokenString(activeToken);
      const found = resolveTargetFromToken(clean);
      setTargetAccount(found);
      setInputPin('');
      setErrorMsg('');

      if (found) {
        window.location.hash = `token=${clean}`;
        if (found.type === 'wali') {
          setAuthMode('biometric');
        } else {
          setAuthMode('pin');
        }
      }
    } else {
      setTargetAccount(null);
    }
  }, [activeToken, resolveTargetFromToken, santriList]);

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
    const maxLen = targetAccount?.pin?.length || 6;
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
  const handleBiometricSuccess = (method) => {
    try {
      loginWithBiometric(targetAccount, method);
      confetti({ particleCount: 80, spread: 60 });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Biometric Registration (Enrollment step for newly registered wali)
  const handleFingerprintEnrollment = (method) => {
    if (!targetAccount) return;
    requestFingerprintEnrollment(targetAccount.token, method);
    confetti({ particleCount: 60, spread: 50 });
  };

  // Contact Admin Bendahara via WhatsApp for quick approval
  const handleContactAdminWA = () => {
    if (!pesantrenInfo.whatsappAdmin || !targetAccount) return;
    const msg = 
      `Assalamu'alaikum Warahmatullahi Wabarakatuh Bendahara Ma'had Imam Syafi'i Brebes.\n` +
      `Saya Bapak/Ibu *${targetAccount.name}* (${targetAccount.title}).\n` +
      `Telah berhasil mendaftarkan sidik jari biometrik pada sistem Maisya-Saku.\n` +
      `Mohon dibantu verifikasi & persetujuannya agar dapat masuk ke portal keuangan. Syukran jazakumullahu khairan.`;
    openWhatsAppDirect(pesantrenInfo.whatsappAdmin, msg);
  };

  // IF NO TOKEN OR TOKEN INVALID: RENDER WALI LINK GENERATOR DIRECTLY!
  if (!activeToken || !targetAccount) {
    return <WaliLinkGenerator />;
  }

  const isWali = targetAccount.type === 'wali';
  const fpStatus = isWali ? (targetAccount.fingerprintStatus || 'NOT_REGISTERED') : 'APPROVED';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-sky-500 selection:text-white relative transition-colors">
      {/* Theme Toggle Button (Top Right Corner) */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 shadow-md hover:bg-slate-100 dark:hover:bg-slate-850 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
          title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-slate-200">Tema Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline text-slate-700">Tema Gelap</span>
            </>
          )}
        </button>
      </div>

      {/* Top Header */}
      <div className="max-w-md w-full mx-auto text-center pt-3">
        <div className="inline-flex items-center gap-2 bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Gerbang Akses Terenkripsi Maisya-Saku</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
          {pesantrenInfo.name}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">
          Sistem Portal Keuangan Santri Bebas Uang Tunai (Cashless Pesantren)
        </p>
      </div>

      {/* Main Authentication Container */}
      <div className="max-w-md w-full mx-auto my-auto py-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl space-y-6 animate-in fade-in zoom-in-95 transition-colors">
          {/* Account Profile Badge */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <img
                src={targetAccount.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                alt={targetAccount.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-sky-500 shadow-md"
              />
              <div className="overflow-hidden">
                <div className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                  {targetAccount.name}
                </div>
                <div className="text-xs text-sky-600 dark:text-sky-400 font-semibold mt-0.5 truncate">
                  {targetAccount.title}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Token: {targetAccount.token}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveToken('');
                setTargetAccount(null);
                window.location.hash = '';
              }}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline font-medium shrink-0 ml-2"
            >
              Keluar
            </button>
          </div>

          {/* WALI SANTRI STATE 1: NOT REGISTERED (MUST ENROLL FINGERPRINT FIRST) */}
          {isWali && fpStatus === 'NOT_REGISTERED' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-500/40 rounded-2xl space-y-1.5 text-center">
                <div className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold text-xs">
                  <Fingerprint className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Tahap 1: Pendaftaran Sidik Jari Biometrik</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Demi keamanan saldo tabungan ananda, akses Maisya-Saku mewajibkan verifikasi sidik jari biometrik. Silakan rekam sidik jari Anda di bawah.
                </p>
              </div>

              <BiometricTouchPad
                santriName={targetAccount.name}
                title="Daftarkan Sidik Jari Anda"
                subtitle="Tempelkan & tahan jari pada area sensor di bawah layar HP/tablet hingga lingkaran penuh (100%)"
                onVerified={handleFingerprintEnrollment}
              />
            </div>
          )}

          {/* WALI SANTRI STATE 2: PENDING ADMIN APPROVAL */}
          {isWali && fpStatus === 'PENDING_APPROVAL' && (
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Menunggu Persetujuan Admin
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Sidik jari Anda telah berhasil direkam! Demi keamanan dana santri, permohonan akses Anda sedang dalam antrean verifikasi oleh <strong>Bendahara Ma'had Imam Syafi'i Brebes</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Status Verifikasi:</span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                    Menunggu Persetujuan
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Wali Santri:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{targetAccount.name}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Waktu Pengajuan:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    {targetAccount.fingerprintRegisteredAt 
                      ? new Date(targetAccount.fingerprintRegisteredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                      : 'Baru saja'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleContactAdminWA}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Hubungi Bendahara via WhatsApp</span>
                </button>

                {/* Developer Simulator for Instant Testing */}
                <button
                  type="button"
                  onClick={() => approveFingerprint(targetAccount.token)}
                  className="w-full bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 font-semibold py-2.5 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Simulasi Uji Coba: Langsung Setujui Sekarang</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Begitu disetujui, Anda cukup membuka kembali link login dari WhatsApp dan menempelkan sidik jari untuk langsung masuk.
              </p>
            </div>
          )}

          {/* WALI SANTRI STATE 3: REJECTED */}
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

          {/* NORMAL AUTHENTICATION FLOW: WHEN APPROVED OR STAFF ROLE */}
          {(!isWali || fpStatus === 'APPROVED') && (
            <>
              {/* Mode Selector (PIN vs Biometrik Touch) */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthMode('biometric')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'biometric'
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Sidik Jari Biometrik</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('pin')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'pin'
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Masuk dengan PIN</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* MODE A: BIOMETRIC TOUCH PAD (PRIMARY) */}
              {authMode === 'biometric' && (
                <div>
                  <BiometricTouchPad
                    santriName={targetAccount.name}
                    title="Verifikasi Sidik Jari Masuk"
                    subtitle="Tempelkan sidik jari pada lingkaran sensor di bawah layar HP/tablet atau gunakan sensor sidik jari fisik"
                    onVerified={handleBiometricSuccess}
                  />
                </div>
              )}

              {/* MODE B: NUMERIC PIN KEYPAD & KEYBOARD INPUT */}
              {authMode === 'pin' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Masukkan {targetAccount.pin?.length || 6}-digit PIN Keamanan:
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ketik langsung di keyboard laptop/PC atau sentuh tombol di bawah
                    </div>

                    {/* Hidden / Transparent input to capture keyboard */}
                    <input
                      ref={pinInputRef}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={targetAccount.pin?.length || 6}
                      value={inputPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setInputPin(val);
                        if (val.length === (targetAccount.pin?.length || 6)) {
                          attemptPinLogin(val);
                        }
                      }}
                      className="opacity-0 absolute -z-10 pointer-events-none"
                      autoFocus
                    />

                    {/* Visual PIN Dots Indicator (Scalev Blue) */}
                    <div 
                      onClick={() => pinInputRef.current && pinInputRef.current.focus()}
                      className="flex justify-center items-center gap-3 my-4 cursor-pointer"
                    >
                      {Array.from({ length: targetAccount.pin?.length || 6 }).map((_, idx) => (
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

                  {/* On-screen Keypad 0-9 (for Touchscreen Phones/Tablets) */}
                  <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
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
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pb-2">
        Maisya-Saku • Ma'had Imam Syafi'i Brebes • Dilindungi PIN & Biometrik Touchscreen
      </div>
    </div>
  );
}
