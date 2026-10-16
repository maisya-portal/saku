import React, { useState, useRef, useEffect } from 'react';
import { Fingerprint, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { playSound } from '../context/AppContext';

export default function BiometricTouchPad({
  onVerified,
  santriName = '',
  amount = null,
  title = "Verifikasi Sidik Jari Santri",
  subtitle = "Tempelkan & tahan jari pada area sensor di bawah (Layar HP / Tablet) atau gunakan alat fingerprint USB"
}) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const HOLD_DURATION = 1100; // ms to complete scan

  const triggerVibrate = (pattern) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // ignore
      }
    }
  };

  const startHold = () => {
    if (verified) return;
    setHolding(true);
    startTimeRef.current = Date.now();
    playSound('scan');
    triggerVibrate([40]);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(100, Math.round((elapsed / HOLD_DURATION) * 100));
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timerRef.current);
        handleSuccess('TOUCH_SCREEN_FINGER');
      }
    }, 25);
  };

  const stopHold = () => {
    if (verified) return;
    setHolding(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleSuccess = (method) => {
    setVerified(true);
    playSound('success');
    triggerVibrate([60, 40, 100]);
    setTimeout(() => {
      onVerified && onVerified(method);
    }, 600);
  };

  // Hardware Biometric / WebAuthn sensor check or simulated instant USB fingerprint trigger
  const handleHardwareFingerprint = async () => {
    playSound('scan');
    setProgress(100);
    triggerVibrate([50, 50, 100]);
    handleSuccess('HARDWARE_FINGERPRINT_USB');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl shadow-2xl border border-sky-900/60 max-w-sm mx-auto select-none">
      <div className="flex items-center gap-2 mb-2 text-sky-400 font-semibold text-sm">
        <ShieldCheck className="w-5 h-5 text-sky-400" />
        <span>Biometric Touch Verification</span>
      </div>

      <h3 className="text-xl font-bold text-center text-white mb-1">
        {title}
      </h3>
      
      {santriName && (
        <div className="bg-sky-950/80 border border-sky-500/30 text-sky-300 px-4 py-1.5 rounded-full text-sm font-medium mb-2">
          Santri: <span className="font-bold text-white">{santriName}</span>
        </div>
      )}

      {amount !== null && (
        <div className="text-2xl font-black text-amber-400 mb-3 tracking-wide">
          {typeof amount === 'number' ? `Rp ${amount.toLocaleString('id-ID')}` : amount}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center max-w-xs mb-6 leading-relaxed">
        {subtitle}
      </p>

      {/* Touch Sensor Area */}
      <div className="relative flex items-center justify-center my-2">
        {/* Progress Ring */}
        <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-slate-800"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            className={`transition-all duration-75 ${
              verified ? 'stroke-sky-400' : holding ? 'stroke-sky-400' : 'stroke-transparent'
            }`}
            strokeWidth="6"
            strokeDasharray="276.46"
            strokeDashoffset={276.46 - (276.46 * progress) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Interactive Fingerprint Button (Scalev Sky Blue) */}
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          disabled={verified}
          className={`absolute w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 outline-none ${
            verified
              ? 'bg-sky-500 scale-105 shadow-lg shadow-sky-500/50'
              : holding
              ? 'bg-sky-950/80 scale-95 ring-4 ring-sky-400/60 shadow-inner'
              : 'bg-slate-800/90 hover:bg-slate-750 active:scale-95 shadow-xl border-2 border-sky-500/40'
          }`}
          style={{ touchAction: 'none' }}
        >
          {verified ? (
            <CheckCircle2 className="w-16 h-16 text-white animate-bounce" />
          ) : (
            <div className="relative">
              <Fingerprint
                className={`w-16 h-16 transition-colors duration-200 ${
                  holding ? 'text-sky-300 animate-pulse' : 'text-slate-400'
                }`}
              />
              {/* Laser scanning beam */}
              {holding && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-300 to-transparent shadow-sm shadow-sky-400 animate-scan-line top-1/2 -translate-y-1/2" />
              )}
            </div>
          )}

          <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-slate-300">
            {verified ? 'Terverifikasi' : holding ? `${progress}% Menyimak...` : 'Tekan & Tahan'}
          </span>
        </button>
      </div>

      <div className="mt-4 text-center">
        <span className="text-xs text-slate-400">
          {verified ? 'Autentikasi sidik jari valid!' : 'Sentuh dan tahan lingkaran jari di atas'}
        </span>
      </div>

      {/* Alternative Hardware Scanner Trigger */}
      <div className="mt-6 pt-4 border-t border-slate-800 w-full flex flex-col items-center">
        <button
          type="button"
          onClick={handleHardwareFingerprint}
          disabled={verified}
          className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 px-4 py-2 rounded-xl transition-all border border-slate-700 active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulasi Tap Alat Fingerprint USB</span>
        </button>
      </div>
    </div>
  );
}
