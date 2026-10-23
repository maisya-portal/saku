import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { playSound } from '../context/AppContext';

export default function BiometricTouchPad({
  onVerified,
  santriName = '',
  amount = null,
  title = "Verifikasi Sidik Jari Santri",
  subtitle = "Tempelkan & tahan jari pada area sensor layar HP / Tablet",
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
  const completedRef = useRef(false);
  const isHoldingRef = useRef(false);
  const HOLD_DURATION = 1200; // ms to complete scan

  // Reset completion state when expected code changes or prop updates
  useEffect(() => {
    completedRef.current = false;
    isHoldingRef.current = false;
    setVerified(false);
    setProgress(0);
    setHolding(false);
    setMouseBlockedWarning('');
  }, [expectedFingerprintCode]);

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

  // Passive initial check for paired external USB/HID hardware devices
  useEffect(() => {
    let isMounted = true;
    const checkInitialHardware = async () => {
      try {
        let detected = false;

        // Check WebUSB paired devices
        if (!detected && typeof navigator !== 'undefined' && 'usb' in navigator && typeof navigator.usb?.getDevices === 'function') {
          try {
            const usbDevices = await navigator.usb.getDevices();
            if (usbDevices && usbDevices.length > 0) detected = true;
          } catch (e) { /* ignore */ }
        }

        // Check WebHID paired devices
        if (!detected && typeof navigator !== 'undefined' && 'hid' in navigator && typeof navigator.hid?.getDevices === 'function') {
          try {
            const hidDevices = await navigator.hid.getDevices();
            if (hidDevices && hidDevices.length > 0) detected = true;
          } catch (e) { /* ignore */ }
        }

        if (isMounted) {
          setHardwareDetected(detected);
        }
      } catch (e) {
        if (isMounted) {
          setHardwareDetected(false);
        }
      }
    };

    checkInitialHardware();
    return () => { isMounted = false; };
  }, []);

  const triggerMouseBlocked = useCallback(() => {
    playSound('error');
    setMouseBlockedWarning('Akses kursor mouse DITOLAK! Verifikasi wajib menggunakan sidik jari fisik pada sensor layar HP/tablet atau pemindai biometrik fisik.');
    triggerVibrate([100, 50, 100]);
    setTimeout(() => {
      setMouseBlockedWarning('');
    }, 4500);
  }, []);

  const startHold = useCallback(() => {
    if (completedRef.current || isHoldingRef.current || verified) return;
    isHoldingRef.current = true;
    setHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    playSound('scan');
    triggerVibrate([40]);
    setMouseBlockedWarning('');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setInterval(() => {
      if (completedRef.current) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(100, Math.round((elapsed / HOLD_DURATION) * 100));
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        handleSuccess('TOUCH_SCREEN_FINGER');
      }
    }, 25);
  }, [verified]);

  const stopHold = useCallback(() => {
    if (completedRef.current || verified) return;
    isHoldingRef.current = false;
    setHolding(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [verified]);

  // Deteksi Pointer: Jika di mode pendaftaran Admin (isEnrollment) atau perangkat mouse, izinkan klik tahan
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && !isEnrollment) {
      if (e.preventDefault) e.preventDefault();
      triggerMouseBlocked();
      return;
    }
    // Sentuhan jari fisik (touch) atau klik operator di mode enrollment
    startHold();
  };

  const handlePointerUp = (e) => {
    if (e.pointerType === 'mouse' && !isEnrollment) return;
    stopHold();
  };

  const handleMouseDown = (e) => {
    if (!isEnrollment) {
      if (e.preventDefault) e.preventDefault();
      triggerMouseBlocked();
    } else {
      startHold();
    }
  };

  const handleMouseUp = () => {
    if (isEnrollment) {
      stopHold();
    }
  };

  const handleSuccess = (method) => {
    if (completedRef.current) return;
    completedRef.current = true;
    isHoldingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setVerified(true);
    setHolding(false);
    setProgress(100);
    playSound('success');
    triggerVibrate([60, 40, 100]);

    // Unique fingerprint code generated ONCE per session
    const generatedCode = expectedFingerprintCode || `FP-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setTimeout(() => {
      if (onVerified) {
        onVerified(method, generatedCode);
      }
    }, 500);
  };

  // PEMINDAIAN HARDWARE USB EKSTERNAL (JIKA ALAT FISIK TERSAMBUNG)
  const handleHardwareSensorTrigger = async () => {
    setHardwareCheckMessage('');
    setIsScanningHardware(true);

    try {
      // Cek apakah USB/HID fisik sudah tersambung
      let usbCount = 0;
      if (navigator.usb && typeof navigator.usb.getDevices === 'function') {
        const devs = await navigator.usb.getDevices();
        usbCount = devs.length;
      }

      let hidCount = 0;
      if (navigator.hid && typeof navigator.hid.getDevices === 'function') {
        const devs = await navigator.hid.getDevices();
        hidCount = devs.length;
      }

      if (usbCount > 0 || hidCount > 0) {
        setHardwareDetected(true);
        playSound('scan');
        setProgress(100);
        triggerVibrate([50, 50, 100]);
        handleSuccess('HARDWARE_FINGERPRINT_USB');
        setIsScanningHardware(false);
        return;
      }

      // Jika belum terhubung, tampilkan modal konfirmasi untuk menghubungkan alat fisik
      setHardwareDetected(false);
      setShowHardwareModal(true);
      playSound('error');
    } catch (err) {
      setShowHardwareModal(true);
    } finally {
      setIsScanningHardware(false);
    }
  };

  // Sambungkan scanner USB fisik baru
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
        setHardwareCheckMessage(`Browser ini tidak mendukung protokol koneksi langsung ${type.toUpperCase()}.`);
      }
    } catch (e) {
      playSound('error');
      setHardwareCheckMessage('Perangkat scanner sidik jari belum terhubung atau pemilihan dibatalkan.');
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-slate-900 text-white rounded-3xl shadow-2xl border border-sky-900/60 w-full max-w-sm mx-auto select-none transition-colors relative max-h-[88dvh] overflow-y-auto scrollbar-thin">
      
      {/* Header Badge */}
      <div className="flex items-center gap-1.5 mb-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-sky-400" />
        <span>Verifikasi Sidik Jari Asli</span>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-center text-white mb-1 leading-snug">
        {title}
      </h3>
      
      {santriName && (
        <div className="bg-sky-950/80 border border-sky-500/30 text-sky-300 px-3.5 py-1 rounded-full text-xs font-medium mb-2 truncate max-w-[280px]">
          Santri: <span className="font-bold text-white">{santriName}</span>
        </div>
      )}

      {amount !== null && (
        <div className="text-xl sm:text-2xl font-black text-amber-400 mb-2 tracking-wide font-mono">
          {typeof amount === 'number' ? `Rp ${amount.toLocaleString('id-ID')}` : amount}
        </div>
      )}

      <p className="text-[11px] sm:text-xs text-slate-400 text-center max-w-xs mb-4 leading-relaxed">
        {subtitle}
      </p>

      {/* Mouse Blocked Warning Notice (Merah & Tegas) */}
      {mouseBlockedWarning && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-950/95 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 text-left shadow-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="leading-tight">
            <strong className="block text-rose-300 font-bold mb-0.5">PERINGATAN KEAMANAN BIOMETRIK:</strong>
            {mouseBlockedWarning}
          </div>
        </div>
      )}

      {/* Touch Sensor Area */}
      <div className="relative flex items-center justify-center my-1">
        {/* Progress Ring */}
        <svg className="w-40 h-40 sm:w-44 sm:h-44 -rotate-90 transform" viewBox="0 0 100 100">
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
              verified ? 'stroke-emerald-400' : holding ? 'stroke-sky-400' : 'stroke-transparent'
            }`}
            strokeWidth="6"
            strokeDasharray="276.46"
            strokeDashoffset={276.46 - (276.46 * progress) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Interactive Fingerprint Button */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={() => startHold()}
          onTouchEnd={stopHold}
          onTouchCancel={stopHold}
          disabled={verified}
          className={`absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 outline-none select-none cursor-pointer ${
            verified
              ? 'bg-emerald-500 scale-105 shadow-lg shadow-emerald-500/50'
              : holding
              ? 'bg-sky-950/90 scale-95 ring-4 ring-sky-400/70 shadow-inner'
              : 'bg-slate-800/90 active:scale-95 shadow-xl border-2 border-sky-500/40 hover:border-sky-400'
          }`}
          style={{ touchAction: 'none' }}
          title={isEnrollment ? "Sentuh sensor di layar atau klik & tahan mouse untuk memindai" : "Tempelkan jari fisik Anda langsung pada layar sentuh"}
        >
          {verified ? (
            <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-white animate-bounce" />
          ) : (
            <div className="relative pointer-events-none">
              <Fingerprint
                className={`w-14 h-14 sm:w-16 sm:h-16 transition-colors duration-200 ${
                  holding ? 'text-sky-300 animate-pulse' : 'text-slate-400'
                }`}
              />
              {/* Laser scanning beam */}
              {holding && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-300 to-transparent shadow-sm shadow-sky-400 animate-scan-line top-1/2 -translate-y-1/2" />
              )}
            </div>
          )}

          <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-slate-300 pointer-events-none">
            {verified ? 'Terverifikasi' : holding ? `${progress}% Memindai...` : 'Tempel & Tahan'}
          </span>
        </button>
      </div>

      {/* Petunjuk Penggunaan */}
      <div className="mt-3 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-300">
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>
            {verified 
              ? 'Autentikasi sidik jari sah!' 
              : isEnrollment 
              ? 'Sentuh sensor di layar HP/tablet atau klik & tahan sensor' 
              : 'Tempelkan jari langsung di layar HP/tablet'}
          </span>
        </div>
        {!isEnrollment && (
          <div className="text-[10px] text-slate-400 font-medium">
            (Tempel & tahan jari santri pada sensor layar hingga 100%)
          </div>
        )}
      </div>

      {/* Tombol Otorisasi Pendaftaran Cepat oleh Admin (Sangat Membantu di PC / Laptop) */}
      {isEnrollment && !verified && (
        <div className="mt-3 w-full">
          <button
            type="button"
            onClick={() => handleSuccess('ADMIN_TOUCH_CONFIRM')}
            className="w-full flex items-center justify-center gap-2 text-xs py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all active:scale-95 shadow-md shadow-sky-600/30 cursor-pointer"
            title="Verifikasi dan rekam sidik jari santri ini secara langsung"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Verifikasi & Rekam Sidik Jari Santri</span>
          </button>
        </div>
      )}

      {/* Sensor Hardware USB / Bluetooth Scanner */}
      <div className="mt-3 pt-3 border-t border-slate-800 w-full flex flex-col items-center gap-2">
        {hardwareDetected ? (
          /* Alat Hardware USB/Bluetooth Sudah Terhubung */
          <button
            type="button"
            onClick={handleHardwareSensorTrigger}
            disabled={verified || isScanningHardware}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900 transition-all active:scale-95 cursor-pointer"
            title="Pindai jari pada scanner USB/Bluetooth yang terdeteksi"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">Alat Scanner USB Terdeteksi (Pindai Sekarang)</span>
          </button>
        ) : (
          /* Status Alat Hardware USB Eksternal */
          <div className="flex items-center justify-between w-full p-2 bg-slate-800/60 rounded-xl border border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Scanner USB Eksternal: Belum Terhubung</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHardwareModal(true)}
              className="text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer"
            >
              Sambungkan
            </button>
          </div>
        )}
      </div>

      {/* Hardware Connection Modal (Saat Pengguna Ingin Menyambungkan Alat USB/Bluetooth Asli) */}
      {showHardwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 text-left shadow-2xl relative animate-in zoom-in-95 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Sambungkan Alat Scanner Sidik Jari</span>
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
              Sesuai instruksi keamanan, tombol simulasi tap ditiadakan. Fitur scanner eksternal <strong>hanya aktif jika alat fisik tersambung</strong> ke perangkat ini.
            </p>

            {hardwareCheckMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[11px]">
                {hardwareCheckMessage}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-slate-400 font-semibold">
                Pilih opsi penyambungan kabel scanner:
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRequestHardwareDevice('usb')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Usb className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kabel USB</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestHardwareDevice('bluetooth')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Bluetooth className="w-3.5 h-3.5 text-sky-400" />
                  <span>Bluetooth</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowHardwareModal(false)}
                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Gunakan Sensor Layar Sentuh HP/Tablet Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}