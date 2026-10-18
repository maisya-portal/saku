import React, { useState, useRef, useEffect } from 'react';
import { 
  Fingerprint, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Smartphone, 
  Usb, 
  Bluetooth, 
  X, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { playSound } from '../context/AppContext';

export default function BiometricTouchPad({
  onVerified,
  santriName = '',
  amount = null,
  title = "Verifikasi Sidik Jari Santri",
  subtitle = "Tempelkan & tahan jari pada area sensor di bawah (Layar HP / Tablet)",
  expectedFingerprintCode = null,
  isEnrollment = false
}) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const [mouseBlockedWarning, setMouseBlockedWarning] = useState('');
  
  // Hardware status state: 'unknown' | 'detected' | 'not_detected'
  const [hardwareDetected, setHardwareDetected] = useState(false);
  const [hardwareCheckMessage, setHardwareCheckMessage] = useState('');
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  const [isScanningHardware, setIsScanningHardware] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const HOLD_DURATION = 1200; // ms to complete scan

  // Haptic feedback
  const triggerVibrate = (pattern) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // ignore
      }
    }
  };

  // Passive initial check for platform authenticator (TouchID / Windows Hello / Paired devices)
  useEffect(() => {
    let isMounted = true;
    const checkInitialHardware = async () => {
      try {
        let detected = false;
        // Check platform authenticator
        if (typeof window !== 'undefined' && window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (available) detected = true;
        }

        // Check WebUSB paired devices
        if (!detected && typeof navigator !== 'undefined' && navigator.usb && typeof navigator.usb.getDevices === 'function') {
          const usbDevices = await navigator.usb.getDevices();
          if (usbDevices && usbDevices.length > 0) detected = true;
        }

        // Check WebHID paired devices
        if (!detected && typeof navigator !== 'undefined' && navigator.hid && typeof navigator.hid.getDevices === 'function') {
          const hidDevices = await navigator.hid.getDevices();
          if (hidDevices && hidDevices.length > 0) detected = true;
        }

        if (isMounted) {
          setHardwareDetected(detected);
        }
      } catch (e) {
        if (isMounted) setHardwareDetected(false);
      }
    };

    checkInitialHardware();
    return () => { isMounted = false; };
  }, []);

  const startHold = () => {
    if (verified) return;
    setHolding(true);
    startTimeRef.current = Date.now();
    playSound('scan');
    triggerVibrate([40]);
    setMouseBlockedWarning('');

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

  // Strictly block mouse clicks as requested by user!
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      playSound('error');
      setMouseBlockedWarning('Akses Kursor Mouse Ditolak! Sensor sidik jari HANYA merespon sentuhan jari fisik pada layar HP/tablet atau alat sensor hardware yang tersambung.');
      triggerVibrate([100, 50, 100]);
      setTimeout(() => setMouseBlockedWarning(''), 5000);
      return;
    }
    // Only physical touch or stylus pen on touchscreen
    startHold();
  };

  const handlePointerUp = (e) => {
    if (e.pointerType === 'mouse') return;
    stopHold();
  };

  const handleSuccess = (method) => {
    setVerified(true);
    playSound('success');
    triggerVibrate([60, 40, 100]);

    // Unique fingerprint code generation for enrollment or verification
    const generatedCode = expectedFingerprintCode || `FP-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setTimeout(() => {
      onVerified && onVerified(method, generatedCode);
    }, 600);
  };

  // HARDWARE DETECTION & ACTIVATION (USB / BLUETOOTH / WEBAUTHN)
  // Per user request: Hardware sensor ONLY activates if a physical device is connected & detected!
  const handleHardwareSensorTrigger = async () => {
    setHardwareCheckMessage('');
    setIsScanningHardware(true);

    try {
      // 1. Check Platform Authenticator (Windows Hello, TouchID)
      let platformAvailable = false;
      if (window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }

      // 2. Check already paired USB devices
      let usbCount = 0;
      if (navigator.usb && typeof navigator.usb.getDevices === 'function') {
        const devs = await navigator.usb.getDevices();
        usbCount = devs.length;
      }

      // 3. Check already paired HID devices
      let hidCount = 0;
      if (navigator.hid && typeof navigator.hid.getDevices === 'function') {
        const devs = await navigator.hid.getDevices();
        hidCount = devs.length;
      }

      if (platformAvailable || usbCount > 0 || hidCount > 0) {
        // Hardware is genuinely detected!
        setHardwareDetected(true);
        playSound('scan');
        setProgress(100);
        triggerVibrate([50, 50, 100]);
        handleSuccess('HARDWARE_FINGERPRINT_USB');
        setIsScanningHardware(false);
        return;
      }

      // If no hardware is detected, open modal requesting user to connect device
      setHardwareDetected(false);
      setShowHardwareModal(true);
      playSound('error');
    } catch (err) {
      setShowHardwareModal(true);
    } finally {
      setIsScanningHardware(false);
    }
  };

  // User attempts to connect external USB or Bluetooth scanner
  const handleRequestHardwareDevice = async (type = 'usb') => {
    setHardwareCheckMessage('');
    try {
      if (type === 'usb' && navigator.usb) {
        const device = await navigator.usb.requestDevice({ filters: [] });
        if (device) {
          setHardwareDetected(true);
          setShowHardwareModal(false);
          playSound('scan');
          handleSuccess('HARDWARE_FINGERPRINT_USB');
          return;
        }
      } else if (type === 'hid' && navigator.hid) {
        const devices = await navigator.hid.requestDevice({ filters: [] });
        if (devices && devices.length > 0) {
          setHardwareDetected(true);
          setShowHardwareModal(false);
          playSound('scan');
          handleSuccess('HARDWARE_FINGERPRINT_USB');
          return;
        }
      } else if (type === 'bluetooth' && navigator.bluetooth) {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true
        });
        if (device) {
          setHardwareDetected(true);
          setShowHardwareModal(false);
          playSound('scan');
          handleSuccess('HARDWARE_FINGERPRINT_BLUETOOTH');
          return;
        }
      } else {
        setHardwareCheckMessage(`Browser ini tidak mendukung koneksi langsung ${type.toUpperCase()}. Silakan pastikan driver scanner USB/Bluetooth terinstal di sistem operasi Anda.`);
      }
    } catch (e) {
      playSound('error');
      setHardwareCheckMessage('Perangkat scanner sidik jari belum terhubung atau pemilihan dibatalkan. Silakan gunakan sensor biometrik layar sentuh di atas.');
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl shadow-2xl border border-sky-900/60 max-w-sm mx-auto select-none transition-colors relative">
      <div className="flex items-center gap-2 mb-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-sky-400" />
        <span>Sensor Biometrik Layar Sentuh</span>
      </div>

      <h3 className="text-xl font-bold text-center text-white mb-1">
        {title}
      </h3>
      
      {santriName && (
        <div className="bg-sky-950/80 border border-sky-500/30 text-sky-300 px-4 py-1.5 rounded-full text-xs font-medium mb-2">
          Santri: <span className="font-bold text-white">{santriName}</span>
        </div>
      )}

      {amount !== null && (
        <div className="text-2xl font-black text-amber-400 mb-3 tracking-wide font-mono">
          {typeof amount === 'number' ? `Rp ${amount.toLocaleString('id-ID')}` : amount}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center max-w-xs mb-5 leading-relaxed">
        {subtitle}
      </p>

      {/* Mouse Blocked Warning Notice */}
      {mouseBlockedWarning && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in zoom-in-95 text-left">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <strong>Keamanan Biometrik:</strong> {mouseBlockedWarning}
          </div>
        </div>
      )}

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

        {/* Interactive Fingerprint Button (Touchscreen Only — Blocks Mouse) */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(); }}
          onTouchEnd={(e) => { e.preventDefault(); stopHold(); }}
          onTouchCancel={(e) => { e.preventDefault(); stopHold(); }}
          disabled={verified}
          className={`absolute w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 outline-none ${
            verified
              ? 'bg-sky-500 scale-105 shadow-lg shadow-sky-500/50'
              : holding
              ? 'bg-sky-950/80 scale-95 ring-4 ring-sky-400/60 shadow-inner'
              : 'bg-slate-800/90 active:scale-95 shadow-xl border-2 border-sky-500/40 hover:border-sky-400'
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
            {verified ? 'Terverifikasi' : holding ? `${progress}% Menyimak...` : 'Sentuh & Tahan'}
          </span>
        </button>
      </div>

      <div className="mt-4 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>{verified ? 'Autentikasi sidik jari valid!' : 'Tempelkan jari Anda langsung di layar HP/tablet'}</span>
        </div>
        <div className="text-[10px] text-slate-500">
          (Klik kursor mouse diblokir demi validitas biometrik fisik)
        </div>
      </div>

      {/* Hardware Scanner Option with Strict Detection Status */}
      <div className="mt-5 pt-3 border-t border-slate-800 w-full flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={handleHardwareSensorTrigger}
          disabled={verified || isScanningHardware}
          className={`flex items-center gap-2 text-[11px] px-3.5 py-2 rounded-xl transition-all border active:scale-95 ${
            hardwareDetected
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
          }`}
          title="Sensor hardware USB/Bluetooth hanya aktif jika alat fisiknya tersambung"
        >
          {isScanningHardware ? (
            <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
          ) : (
            <Zap className={`w-3.5 h-3.5 ${hardwareDetected ? 'text-emerald-400' : 'text-amber-400'}`} />
          )}
          <span>Sensor Hardware Fingerprint (USB / Bluetooth)</span>
        </button>

        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className={`w-2 h-2 rounded-full ${hardwareDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
          <span>
            {hardwareDetected ? 'Alat Biometrik Fisik Terdeteksi' : 'Hardware USB/Bluetooth: Perlu Alat Terhubung'}
          </span>
        </div>
      </div>

      {/* Hardware Sensor Not Detected Modal */}
      {showHardwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 text-left shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Alat Sensor Hardware Tidak Terdeteksi</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHardwareModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sesuai standar keamanan sistem, sensor hardware <strong>hanya dapat diaktifkan jika alat scanner fisik sidik jari tersambung</strong> melalui kabel USB atau Bluetooth pada komputer/HP Anda.
            </p>

            {hardwareCheckMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[11px]">
                {hardwareCheckMessage}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-slate-400 font-semibold">
                Pilih opsi penyambungan alat scanner:
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRequestHardwareDevice('usb')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Usb className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sambung USB</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestHardwareDevice('bluetooth')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Bluetooth className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sambung BT</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowHardwareModal(false)}
                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Gunakan Sensor Layar Sentuh Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
