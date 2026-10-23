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
  Moon,
  Camera,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import AvatarEditorModal from './AvatarEditorModal';
import InitialsAvatar from './InitialsAvatar';

export default function Navbar() {
  const { authSession, logout, toast, hideToast, pesantrenInfo, theme, toggleTheme, updateSessionAvatar } = useApp();
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

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
        <div className="bg-[#0284c7] text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium flex items-center justify-between gap-2 sm:gap-3 shadow-inner w-full overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/60 flex items-center justify-center shrink-0 text-white font-bold text-[9px] sm:text-[10px]">
              i
            </div>
            <div className="truncate text-[11px] sm:text-xs">
              <span className="font-bold">Portal Keuangan Maisya-Saku</span>
              <span className="opacity-90 hidden sm:inline"> — Sistem Bebas Tunai Terintegrasi Ma'had Imam Syafi'i Brebes</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
              className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup banner"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand Identity (Scalev Blue Style) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="./logo-maisya.png"
              alt="Logo Ma'had Imam Syafi'i Brebes"
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-md shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">
                  Maisya-Saku
                </h1>
                <span className="hidden sm:inline-block bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide border border-sky-200 dark:border-sky-800 shrink-0">
                  PORTAL CASHLESS
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs sm:max-w-md mt-0.5 transition-colors">
                {pesantrenInfo.name} • Portal Keuangan Terenkripsi
              </p>
            </div>
          </div>

          {/* Right Action: Theme Switcher, Authenticated Profile & Session Lock */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* PWA Install Button */}
            {pwaPrompt && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="hidden sm:flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install PWA</span>
              </button>
            )}

            {/* THEME TOGGLE: LIGHT / DARK MODE */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all shadow-xs active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
              title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold hidden md:inline ml-1.5 text-slate-200">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold hidden md:inline ml-1.5 text-slate-700">Gelap</span>
                </>
              )}
            </button>

            {/* Active User Session Pill (Scalev Avatar Pill Style with Avatar Editor) */}
            {authSession && (
              <div className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-50 dark:bg-slate-800 p-1 sm:p-1.5 sm:pl-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors shrink-0">
                {/* Clickable Avatar with Camera icon */}
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="relative group cursor-pointer focus:outline-none shrink-0"
                  title="Klik untuk ganti foto avatar akun"
                >
                  <InitialsAvatar
                    name={authSession.name}
                    src={authSession.avatar}
                    className="w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-[11px]"
                    rounded="rounded-xl"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all border border-white">
                    <Camera className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  </span>
                </button>

                <div 
                  className="text-left hidden lg:block cursor-pointer"
                  onClick={() => setIsAvatarModalOpen(true)}
                  title="Klik untuk ganti foto avatar akun"
                >
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
                  className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 px-2.5 py-1.5 sm:px-3 rounded-xl border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
                  title="Keluar dari Akun / Sesi"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="text-xs font-bold">Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Avatar Editor Modal */}
      {authSession && (
        <AvatarEditorModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentAvatar={authSession.avatar}
          onSaveAvatar={updateSessionAvatar}
          title={`Ganti Avatar Akun: ${authSession.name}`}
        />
      )}
    </>
  );
}
