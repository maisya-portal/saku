import React from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import AuthGate from './components/AuthGate';
import RoleWaliSantri from './components/RoleWaliSantri';
import RolePetugasKantin from './components/RolePetugasKantin';
import RolePetugasLaundry from './components/RolePetugasLaundry';
import RolePetugasTelpon from './components/RolePetugasTelpon';
import RoleKasirSPP from './components/RoleKasirSPP';
import RoleKioskSantri from './components/RoleKioskSantri';
import RoleAdminBendahara from './components/RoleAdminBendahara';
import AutoUpdateWatcher from './components/AutoUpdateWatcher';
import AutoLockGuard from './components/AutoLockGuard';

function MainContent() {
  const { authSession, currentRole, pesantrenInfo } = useApp();

  // If session is locked / not authenticated, display secure AuthGate
  if (!authSession) {
    return <AuthGate />;
  }

  return (
    <AutoLockGuard>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
        {currentRole === 'admin' && <RoleAdminBendahara />}
        {currentRole === 'kantin' && <RolePetugasKantin />}
        {currentRole === 'laundry' && <RolePetugasLaundry />}
        {currentRole === 'wartel' && <RolePetugasTelpon />}
        {currentRole === 'spp' && <RoleKasirSPP />}
        {currentRole === 'kiosk' && <RoleKioskSantri />}
        {currentRole === 'wali' && <RoleWaliSantri />}
        {!['admin', 'kantin', 'laundry', 'wartel', 'spp', 'kiosk', 'wali'].includes(currentRole) && (
          <RolePetugasKantin />
        )}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            Maisya-Saku • {pesantrenInfo.name}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {pesantrenInfo.tagline} • {pesantrenInfo.address}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
            Mendukung PWA, RFID Reader USB, Barcode Scanner & Otorisasi Biometrik Touch Screen
          </div>
        </div>
      </footer>
      </div>
    </AutoLockGuard>
  );
}

function GlobalToast() {
  const { toast, hideToast } = useApp();
  if (!toast) return null;

  return (
    <div 
      onClick={hideToast}
      className="fixed bottom-5 right-5 z-[200] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-200 cursor-pointer group"
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
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
      <GlobalToast />
      <AutoUpdateWatcher />
    </AppProvider>
  );
}
