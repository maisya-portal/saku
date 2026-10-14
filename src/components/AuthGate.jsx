import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Fingerprint, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Users, 
  Building2, 
  ShoppingBag, 
  Shirt, 
  PhoneCall, 
  GraduationCap, 
  CreditCard,
  CheckCircle2,
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
    roleAccounts, 
    santriList,
    pesantrenInfo 
  } = useApp();

  const [activeToken, setActiveToken] = useState(urlToken || '');
  const [targetAccount, setTargetAccount] = useState(null);
  const [authMode, setAuthMode] = useState('pin'); // 'pin' | 'biometric'
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update target when activeToken changes
  useEffect(() => {
    if (activeToken) {
      const found = resolveTargetFromToken(activeToken);
      setTargetAccount(found);
      setInputPin('');
      setErrorMsg('');
    } else {
      setTargetAccount(null);
    }
  }, [activeToken, resolveTargetFromToken]);

  // Handle PIN input button click
  const handlePinDigit = (digit) => {
    if (inputPin.length < 6) {
      playSound('beep');
      const newPin = inputPin + digit;
      setInputPin(newPin);
      setErrorMsg('');

      // Auto submit if length matches target PIN
      if (targetAccount && newPin.length === targetAccount.pin.length) {
        attemptPinLogin(newPin);
      }
    }
  };

  const handlePinBackspace = () => {
    setInputPin(prev => prev.slice(0, -1));
    setErrorMsg('');
    playSound('beep');
  };

  const handleClearPin = () => {
    setInputPin('');
    setErrorMsg('');
  };

  const attemptPinLogin = (pinToTest) => {
    try {
      loginWithPin(targetAccount, pinToTest);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err) {
      setErrorMsg(err.message);
      setInputPin('');
    }
  };

  const handleBiometricSuccess = (method) => {
    try {
      loginWithBiometric(targetAccount, method);
      confetti({ particleCount: 80, spread: 60 });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Quick preset tokens for easy testing & demo
  const demoTokens = [
    { token: 'admin-isb-2026', label: 'Super Admin', role: 'admin', icon: Building2, color: 'text-slate-800 bg-slate-100' },
    { token: 'kantin-isb-2026', label: 'Petugas Kantin', role: 'kantin', icon: ShoppingBag, color: 'text-amber-700 bg-amber-50' },
    { token: 'laundry-isb-2026', label: 'Petugas Laundry', role: 'laundry', icon: Shirt, color: 'text-sky-700 bg-sky-50' },
    { token: 'wartel-isb-2026', label: 'Petugas Wartel', role: 'wartel', icon: PhoneCall, color: 'text-indigo-700 bg-indigo-50' },
    { token: 'spp-isb-2026', label: 'Kasir SPP', role: 'spp', icon: GraduationCap, color: 'text-purple-700 bg-purple-50' },
    { token: 'kiosk-isb-2026', label: 'Kiosk Mandiri', role: 'kiosk', icon: CreditCard, color: 'text-teal-700 bg-teal-50' },
    { token: 'wali-hendra', label: 'Wali Santri (2 Anak)', role: 'wali', icon: Users, color: 'text-emerald-700 bg-emerald-50' },
    { token: 'wali-fatih', label: 'Wali Santri (1 Anak)', role: 'wali', icon: Users, color: 'text-emerald-700 bg-emerald-50' }
  ];

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
                }}
                className="text-[11px] text-slate-400 hover:text-white underline font-medium"
              >
                Ganti Akun
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

            {/* MODE 1: NUMERIC PIN KEYPAD */}
            {authMode === 'pin' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-2">
                    Masukkan {targetAccount.pin?.length || 6}-digit PIN Keamanan Anda:
                  </div>

                  {/* PIN Dots */}
                  <div className="flex justify-center items-center gap-3 my-3">
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

                  <div className="text-[10px] text-slate-500">
                    PIN default demo akun ini: <strong className="text-emerald-400 font-mono">{targetAccount.pin}</strong>
                  </div>
                </div>

                {/* Keypad 0-9 */}
                <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePinDigit(String(num))}
                      className="py-3 bg-slate-750 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white rounded-2xl border border-slate-700 shadow-sm transition-all"
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
                    className="py-3 bg-slate-750 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white rounded-2xl border border-slate-700 shadow-sm transition-all"
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
          /* NO TARGET / IDLE GATE: WAITING FOR MAGIC LINK OR SELECT QUICK DEMO */
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-950 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Autentikasi Akses Khusus
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Setiap peran (Super Admin, Kasir Kantin, Laundry, Wartel, SPP, & Wali Santri) diamankan dengan <strong>Magic Link Resmi</strong> dari WhatsApp.
              </p>
            </div>

            {/* Manual Token Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Punya Token Magic Link? Masukkan di sini:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: admin-isb-2026 atau wali-hendra"
                  onChange={(e) => setActiveToken(e.target.value.trim())}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Fast Demo Switcher for Testing (No Manual Typing Needed!) */}
            <div className="pt-2 border-t border-slate-700 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Pilih Magic Link Cepat untuk Uji Coba:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {demoTokens.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.token}
                      type="button"
                      onClick={() => {
                        playSound('beep');
                        setActiveToken(item.token);
                        window.location.hash = `token=${item.token}`;
                      }}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500 text-left transition-all group flex items-center gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          #{item.token}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
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
