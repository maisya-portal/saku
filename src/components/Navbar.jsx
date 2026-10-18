import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Download, 
  ShieldCheck, 
  Check, 
  Info, 
  AlertTriangle,
  X,
  CreditCard,
  Sparkles,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { authSession, logout, toast, hideToast, pesantrenInfo, theme, toggleTheme } = useApp();
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [showTopBanner, setShowTopBanner] = useState(true);

  // Capture PWA install event
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaPrompt(null);
    }
  };

  return (
    <>
      {/* SCALEV SIGNATURE TOP ANNOUNCEMENT BANNER */}
      {showTopBanner && (
        <div className="bg-[#0284c7] text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center shrink-0 text-white font-bold text-[10px]">
              i
            </div>
            <div className="truncate">
              <span className="font-bold">Portal Keuangan Santri Maisya-Saku</span>
              <span className="opacity-90 hidden sm:inline"> — Sistem Bebas Tunai Terintegrasi Ma'had Imam Syafi'i Brebes</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Step badges like Scalev */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px]">
              <span className="bg-sky-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-sky-200" />
                <span>Magic Link</span>
              </span>
              <span className="bg-white text-sky-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span>2</span>
                <span>Sidik Jari Biometrik</span>
              </span>
              <span className="bg-sky-700/60 px-2 py-0.5 rounded-full">
                3 Cashless
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowTopBanner(false)}
              className="text-white/70 hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors ml-1"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity (Scalev Blue Style) */}
          <div className="flex items-center gap-3">
            <img
              src="./logo-maisya.jpg"
              alt="Logo Ma'had Imam Syafi'i Brebes"
              className="w-11 h-11 rounded-2xl object-cover border border-sky-300 dark:border-sky-800 shadow-md shadow-sky-500/25 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none transition-colors">
                  Maisya-Saku
                </h1>
                <span className="bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide border border-sky-200 dark:border-sky-800">
                  PORTAL CASHLESS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs sm:max-w-md mt-0.5 transition-colors">
                {pesantrenInfo.name} • Portal Keuangan Terenkripsi
              </p>
            </div>
          </div>

          {/* Right Action: Theme Switcher, Authenticated Profile & Session Lock */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* PWA Install Button */}
            {pwaPrompt && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="hidden sm:flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold px-3 py-2 rounded-xl text-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install PWA</span>
              </button>
            )}

            {/* THEME TOGGLE: LIGHT / DARK MODE */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
              title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold hidden md:inline text-slate-200">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold hidden md:inline text-slate-700">Gelap</span>
                </>
              )}
            </button>

            {/* Active User Session Pill (Scalev Avatar Pill Style) */}
            {authSession && (
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 p-1.5 pl-3 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors">
                {/* Scalev-like MP Badge */}
                <div className="w-7 h-7 rounded-xl bg-sky-500 text-white font-black text-[11px] flex items-center justify-center shadow-xs shrink-0">
                  {authSession.name ? authSession.name.slice(0, 2).toUpperCase() : 'MP'}
                </div>

                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px] leading-tight transition-colors">
                    {authSession.name}
                  </div>
                  <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold truncate max-w-[130px] transition-colors">
                    {authSession.title}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-bold transition-all shadow-xs ml-1"
                  title="Kunci Sesi / Keluar"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Kunci Sesi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {toast && (
        <div 
          onClick={hideToast}
          className="fixed bottom-5 right-5 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-200 cursor-pointer group"
          title="Klik untuk menutup notifikasi"
        >
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 transition-transform group-hover:scale-102 ${
            toast.type === 'success'
              ? 'bg-sky-900 text-white border-sky-400/50 shadow-sky-950/40'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-500/50'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <Check className="w-5 h-5 text-sky-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-sky-400 shrink-0" />
              )}
              <div className="text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hideToast();
              }}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
