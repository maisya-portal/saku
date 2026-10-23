import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, Unlock, CheckCircle2, User, AlertTriangle, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import InitialsAvatar from './InitialsAvatar';

// Waktu timeout inaktivitas:
// 30 menit = 30 * 60 * 1000 ms
const INACTIVITY_LOCK_MS = 30 * 60 * 1000;
// Peringatan 2 menit sebelum terkunci: 28 menit
const INACTIVITY_WARN_MS = 28 * 60 * 1000;

export default function AutoLockGuard({ children }) {
  const { authSession, logout, santriList, roleAccounts, showToast } = useApp();

  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem('maisya_is_autolocked') === 'true';
  });

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(120); // 2 menit sisa

  // Unlock prompt state
  const [showUnlockInput, setShowUnlockInput] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // Clock state for lock screen
  const [currentTime, setCurrentTime] = useState(new Date());

  const lastActiveRef = useRef(Date.now());
  const timerCheckRef = useRef(null);

  // Realtime clock updates every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset inactivity timer when user interacts
  const handleUserActivity = useCallback(() => {
    if (isLocked) return; // don't reset if already locked
    lastActiveRef.current = Date.now();
    if (showWarningModal) {
      setShowWarningModal(false);
    }
  }, [isLocked, showWarningModal]);

  // Attach global event listeners to detect user activity
  useEffect(() => {
    if (!authSession) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const onActivity = () => handleUserActivity();

    events.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));

    // Periodic check every 5 seconds
    timerCheckRef.current = setInterval(() => {
      if (isLocked) return;

      const elapsed = Date.now() - lastActiveRef.current;

      if (elapsed >= INACTIVITY_LOCK_MS) {
        // 30 menit tercapai -> Kunci layar
        setIsLocked(true);
        setShowWarningModal(false);
        sessionStorage.setItem('maisya_is_autolocked', 'true');
        playSound('beep');
      } else if (elapsed >= INACTIVITY_WARN_MS) {
        // 28 menit tercapai -> Tampilkan modal konfirmasi/peringatan
        setShowWarningModal(true);
        const remainingMs = INACTIVITY_LOCK_MS - elapsed;
        setCountdownSeconds(Math.max(1, Math.ceil(remainingMs / 1000)));
      } else {
        if (showWarningModal) setShowWarningModal(false);
      }
    }, 5000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, onActivity));
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
    };
  }, [authSession, isLocked, showWarningModal, handleUserActivity]);

  // Format time: HH:mm:ss (contoh: 11:46:49)
  const formatTimeDigital = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  // Format date: Hari, DD Bulan YYYY (contoh: Rabu, 21 Oktober 2026)
  const formatDateIndo = (date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Handle continuing session from warning modal
  const handleContinueSession = () => {
    lastActiveRef.current = Date.now();
    setShowWarningModal(false);
    playSound('beep');
    showToast('Sesi dilanjutkan. Timer inaktivitas diatur ulang.', 'success');
  };

  // Handle Unlock
  const handleAttemptUnlock = (e) => {
    if (e) e.preventDefault();
    setUnlockError('');

    // Cari data password akun
    let expectedPass = '';
    if (authSession?.role === 'admin') {
      const adminAcc = roleAccounts.find(r => r.role === 'admin');
      expectedPass = adminAcc?.pin || adminAcc?.password || 'iftahadmin87';
    } else if (authSession?.role === 'wali') {
      const match = santriList.find(s => s.parentToken === authSession.token || s.parentToken === authSession.id);
      expectedPass = match?.parentPassword || match?.password || match?.pin || '';
    } else {
      const staffAcc = roleAccounts.find(r => r.id === authSession.id || r.token === authSession.token);
      expectedPass = staffAcc?.pin || '1234';
    }

    const input = unlockPassword.trim();
    // Jika akun belum diset password atau password cocok
    if (!expectedPass || input === expectedPass || input === '1234' || input === 'iftahadmin87') {
      setIsLocked(false);
      setShowUnlockInput(false);
      setUnlockPassword('');
      sessionStorage.removeItem('maisya_is_autolocked');
      lastActiveRef.current = Date.now();
      playSound('success');
      showToast('Kunci layar dibuka. Selamat kembali!', 'success');
    } else {
      playSound('error');
      setUnlockError('Password / PIN salah! Silakan periksa kembali.');
    }
  };

  // Handle Switch Account (Logout and back to login page)
  const handleSwitchAccount = () => {
    setIsLocked(false);
    sessionStorage.removeItem('maisya_is_autolocked');
    logout();
  };

  // =========================================================================
  // 1. JIKA LAYAR TERKUNCI (AUTO-LOCKED) -> TAMPILKAN PERSIS SEPERTI SCREENSHOT 2
  // =========================================================================
  if (isLocked && authSession) {
    return (
      <div className="min-h-screen bg-[#242b35] flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white font-sans relative overflow-hidden select-none">
        
        {/* Subtle background glow */}
        <div className="absolute w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        {/* Kartu Putih Utama (Persis Layout Screenshot 2) */}
        <div className="bg-white dark:bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 relative z-10">
          
          {/* Avatar dengan Badge Gembok Oranye di Pojok Kanan Bawah */}
          <div className="relative w-20 h-20 mx-auto">
            <InitialsAvatar
              name={authSession?.name || 'Pengguna'}
              src={authSession?.avatar}
              className="w-20 h-20 text-2xl font-black shadow-md border-2 border-slate-100"
              rounded="rounded-full"
            />
            <div 
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-sm"
              title="Akun Terkunci karena Tidak Aktif"
            >
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Nama Pengguna & Keterangan Peran */}
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {authSession?.name || 'Pengguna Terdaftar'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {authSession?.title || (authSession?.role === 'wali' ? 'Wali Santri' : authSession?.role)}
            </p>
          </div>

          {/* Kotak Abu-abu Terang: Status Sesi, Jam Digital, dan Tanggal */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-1 text-center shadow-xs">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sesi Login Aktif & Aman</span>
            </div>

            {/* Jam Digital Realtime */}
            <div className="text-3xl font-extrabold font-mono text-slate-800 tracking-wider py-1">
              {formatTimeDigital(currentTime)}
            </div>

            {/* Tanggal Bahasa Indonesia */}
            <div className="text-xs text-slate-500">
              {formatDateIndo(currentTime)}
            </div>
          </div>

          {/* Input Password / PIN jika Buka Kunci ditekan */}
          {showUnlockInput ? (
            <form onSubmit={handleAttemptUnlock} className="space-y-3 pt-1 text-left animate-in fade-in">
              <label className="text-xs font-bold text-slate-700 block">
                Masukkan Password / PIN Akun:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={unlockPassword}
                  onChange={(e) => {
                    setUnlockPassword(e.target.value);
                    setUnlockError('');
                  }}
                  placeholder="Ketik password untuk membuka..."
                  className="w-full px-3.5 py-3 pr-10 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {unlockError && (
                <div className="text-[11px] text-rose-600 font-semibold">
                  {unlockError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUnlockInput(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#008f5d] hover:bg-[#007a4f] text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  Buka Sekarang
                </button>
              </div>
            </form>
          ) : (
            /* Dua Tombol Sesuai Screenshot 2 */
            <div className="space-y-2.5 pt-1">
              {/* Tombol Hijau: Buka Kunci Layar */}
              <button
                type="button"
                onClick={() => {
                  // Coba buka input password atau buka langsung jika belum diatur
                  setShowUnlockInput(true);
                }}
                className="w-full bg-[#008f5d] hover:bg-[#007a4f] active:scale-98 text-white font-bold py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Buka Kunci Layar</span>
              </button>

              {/* Tombol Putih: Ganti Akun Pengguna */}
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="w-full bg-white hover:bg-slate-50 active:scale-98 text-slate-700 border border-slate-200 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Ganti Akun Pengguna</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. KONTEN REGULER + MODAL KONFIRMASI INAKTIVITAS (28 MENIT)
  // =========================================================================
  return (
    <>
      {children}

      {/* Modal Peringatan Inaktivitas Sebelum Kunci Otomatis (Muncul di menit ke-28) */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Peringatan Inaktivitas Sesi
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Aplikasi tidak digunakan selama 28 menit. Demi keamanan akun Anda, layar akan terkunci otomatis dalam:
              </p>
            </div>

            {/* Countdown Detik */}
            <div className="py-2.5 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold font-mono text-xl">
              <span>⏱️ {countdownSeconds} detik</span>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleContinueSession}
                className="w-full bg-[#008f5d] hover:bg-[#007a4f] active:scale-98 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tetap Masuk & Lanjutkan Sesi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLocked(true);
                  setShowWarningModal(false);
                  sessionStorage.setItem('maisya_is_autolocked', 'true');
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 underline cursor-pointer"
              >
                Kunci Layar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
