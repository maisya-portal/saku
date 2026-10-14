import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  LogOut, 
  Download, 
  ShieldCheck, 
  Check, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { authSession, logout, toast, pesantrenInfo } = useApp();
  const [pwaPrompt, setPwaPrompt] = useState(null);

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center shadow-md shadow-emerald-700/20 text-white shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                  Maisya-Saku
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wide">
                  SECURE PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs sm:max-w-md mt-0.5">
                Portal Sistem Keuangan Santri Ma'had Imam Syafi'i Brebes
              </p>
            </div>
          </div>

          {/* Right Action: Authenticated Profile & Session Lock (No Public Role Switcher) */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button */}
            {pwaPrompt && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-2 rounded-xl text-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install PWA</span>
              </button>
            )}

            {/* Active User Session Pill */}
            {authSession && (
              <div className="flex items-center gap-3 bg-slate-100 p-1.5 pl-3 rounded-2xl border border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                    {authSession.name}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold truncate max-w-[150px]">
                    {authSession.title}
                  </div>
                </div>

                <img
                  src={authSession.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                  alt={authSession.name}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-300"
                />

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-xs"
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
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-500/50'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-500/50'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
