import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Lock, 
  Fingerprint, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import BiometricTouchPad from './BiometricTouchPad';
import confetti from 'canvas-confetti';

export default function AuthGate() {
  const { 
    urlToken, 
    setUrlToken, 
    resolveTargetFromToken, 
    loginWithPin, 
    loginWithBiometric, 
    pesantrenInfo 
  } = useApp();

  const [activeToken, setActiveToken] = useState(urlToken || '');
  const [tokenInput, setTokenInput] = useState('');
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

  // Update target when activeToken changes
  useEffect(() => {
    if (activeToken) {
      const clean = parseTokenString(activeToken);
      const found = resolveTargetFromToken(clean);
      setTargetAccount(found);
      setInputPin('');
      setErrorMsg('');
      if (found) {
        window.location.hash = `token=${clean}`;
      }
    } else {
      setTargetAccount(null);
    }
  }, [activeToken, resolveTargetFromToken]);

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
      // Don't intercept if user is typing in another input
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

  // Keep focus on PIN input on desktop
  useEffect(() => {
    if (targetAccount && authMode === 'pin' && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [targetAccount, authMode]);

  const handleBiometricSuccess = (method) => {
    try {
      loginWithBiometric(targetAccount, method);
      confetti({ particleCount: 80, spread: 60 });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Submit token from manual input on initial page
  const handleTokenSubmit = (e) => {
    e.preventDefault();
    const clean = parseTokenString(tokenInput);
    if (!clean) {
      setErrorMsg('Silakan masukkan token atau tautan yang valid.');
      return;
    }
    const found = resolveTargetFromToken(clean);
    if (!found) {
      playSound('error');
      setErrorMsg(`Token "${clean}" tidak terdaftar dalam sistem.`);
      return;
    }
    playSound('beep');
    setActiveToken(clean);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto text-center pt-4">
        <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Gerbang Akses Terenkripsi Maisya-Saku</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {pesantrenInfo.name}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Sistem Portal Keuangan Santri Bebas Uang Tunai (Cashless Pesantren)
        </p>
      </div>

      {/* Main Authentication Container */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        {targetAccount ? (
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            {/* Account Profile Badge */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={targetAccount.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                  alt={targetAccount.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/50"
                />
                <div>
                  <div className="text-sm font-black text-white leading-tight">
                    {targetAccount.name}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-0.5">
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
                  setTokenInput('');
                  window.location.hash = '';
                }}
                className="text-[11px] text-slate-400 hover:text-white underline font-medium"
              >
                Ganti Token
              </button>
            </div>

            {/* Mode Selector (PIN vs Biometrik Touch) */}
            <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700">
              <button
                type="button"
                onClick={() => setAuthMode('pin')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'pin'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Masuk dengan PIN</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('biometric')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'biometric'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Sidik Jari Biometrik</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* MODE 1: NUMERIC PIN KEYPAD & KEYBOARD INPUT */}
            {authMode === 'pin' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-xs text-slate-300 font-medium mb-1">
                    Masukkan {targetAccount.pin?.length || 6}-digit PIN Keamanan:
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ketik langsung di keyboard laptop/PC atau sentuh tombol di bawah
                  </div>

                  {/* Hidden / Transparent input to capture laptop keyboard and mobile keyboards */}
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

                  {/* Visual PIN Dots Indicator */}
                  <div 
                    onClick={() => pinInputRef.current && pinInputRef.current.focus()}
                    className="flex justify-center items-center gap-3 my-4 cursor-pointer"
                  >
                    {Array.from({ length: targetAccount.pin?.length || 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all duration-150 ${
                          idx < inputPin.length
                            ? 'bg-emerald-400 scale-125 shadow-sm shadow-emerald-400/80'
                            : 'bg-slate-700 border border-slate-600'
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
                      className="py-3 bg-slate-750 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white rounded-2xl border border-slate-700 shadow-sm transition-all select-none"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="py-3 bg-slate-800 hover:bg-slate-750 active:scale-95 text-xs font-bold text-slate-400 rounded-2xl transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinDigit('0')}
                    className="py-3 bg-slate-750 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white rounded-2xl border border-slate-700 shadow-sm transition-all select-none"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handlePinBackspace}
                    className="py-3 bg-slate-800 hover:bg-slate-750 active:scale-95 text-xs font-bold text-slate-400 rounded-2xl transition-all"
                  >
                    ⌫ Hapus
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: BIOMETRIC TOUCH PAD */}
            {authMode === 'biometric' && (
              <div>
                <BiometricTouchPad
                  santriName={targetAccount.name}
                  title="Otorisasi Biometrik"
                  subtitle="Tempelkan sidik jari pada lingkaran sensor di bawah layar HP/tablet atau gunakan pemindai sidik jari fisik"
                  onVerified={handleBiometricSuccess}
                />
              </div>
            )}
          </div>
        ) : (
          /* INITIAL PAGE: ONLY TOKEN INPUT AS REQUESTED BY USER */
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-950 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Autentikasi Magic Link
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Silakan masukkan Token atau tempelkan Tautan Unik (Magic Link) resmi dari WhatsApp untuk mengakses portal keuangan santri.
              </p>
            </div>

            {/* Error Message if Token Invalid */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Token Input Form */}
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Token atau Tautan Magic Link:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Contoh: admin-isb-2026 atau tempel tautan WA..."
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl text-xs font-mono text-emerald-300 outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!tokenInput.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 text-xs"
              >
                <span>Lanjutkan Akses Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 pb-2">
        Maisya-Saku • Ma'had Imam Syafi'i Brebes • Dilindungi PIN & Biometrik Touchscreen
      </div>
    </div>
  );
}
