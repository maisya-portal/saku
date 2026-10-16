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
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { authSession, logout, toast, hideToast, pesantrenInfo } = useApp();
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity (Scalev Blue Style) */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-md shadow-sky-500/25 text-white shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                  Maisya-Saku
                </h1>
                <span className="bg-sky-100 text-sky-700 text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide border border-sky-200">
                  PORTAL CASHLESS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs sm:max-w-md mt-0.5">
                {pesantrenInfo.name} • Portal Keuangan Terenkripsi
              </p>
            </div>
          </div>

          {/* Right Action: Authenticated Profile & Session Lock */}
          <div className="flex items-center gap-2.5">
            {/* PWA Install Button */}
            {pwaPrompt && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="hidden sm:flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 font-bold px-3 py-2 rounded-xl text-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install PWA</span>
              </button>
            )}

            {/* Active User Session Pill (Scalev Avatar Pill Style) */}
            {authSession && (
              <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 p-1.5 pl-3 rounded-2xl border border-slate-200 transition-colors">
                {/* Scalev-like MP Badge */}
                <div className="w-7 h-7 rounded-xl bg-sky-500 text-white font-black text-[11px] flex items-center justify-center shadow-xs shrink-0">
                  {authSession.name ? authSession.name.slice(0, 2).toUpperCase() : 'MP'}
                </div>

                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[140px] leading-tight">
                    {authSession.name}
                  </div>
                  <div className="text-[10px] text-sky-600 font-semibold truncate max-w-[140px]">
                    {authSession.title}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-xs ml-1"
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
