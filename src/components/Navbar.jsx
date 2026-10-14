import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Shirt, 
  PhoneCall, 
  GraduationCap, 
  CreditCard, 
  Building2, 
  ChevronDown, 
  Download, 
  Sparkles,
  ShieldCheck,
  Check,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { currentRole, setCurrentRole, activeParentToken, setActiveParentToken, toast, pesantrenInfo } = useApp();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
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

  const roles = [
    { id: 'wali', label: 'Wali Santri', desc: 'Kontrol uang saku, limit & transfer', icon: Users, color: 'text-emerald-700 bg-emerald-50' },
    { id: 'kantin', label: 'Petugas Kantin', desc: 'POS Kasir & Manajemen Barang', icon: ShoppingBag, color: 'text-amber-700 bg-amber-50' },
    { id: 'laundry', label: 'Petugas Laundry', desc: 'Penerimaan pakaian & tiket klaim', icon: Shirt, color: 'text-sky-700 bg-sky-50' },
    { id: 'wartel', label: 'Petugas Wartel', desc: 'Tarif telepon & timer bicara', icon: PhoneCall, color: 'text-indigo-700 bg-indigo-50' },
    { id: 'spp', label: 'Kasir SPP', desc: 'Tagihan bulanan & ekstrakurikuler', icon: GraduationCap, color: 'text-purple-700 bg-purple-50' },
    { id: 'kiosk', label: 'Kiosk Santri', desc: 'Anjungan cek saldo mandiri', icon: CreditCard, color: 'text-teal-700 bg-teal-50' },
    { id: 'admin', label: 'Bendahara Pesantren', desc: 'Verifikasi top-up & kartu RFID', icon: Building2, color: 'text-slate-800 bg-slate-100' },
  ];

  const activeRoleObj = roles.find(r => r.id === currentRole) || roles[0];

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
                  PWA 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs sm:max-w-md mt-0.5">
                Portal Sistem Keuangan Santri Ma'had Imam Syafi'i Brebes
              </p>
            </div>
          </div>

          {/* Right Action: Role Switcher & PWA Button */}
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

            {/* Role Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 transition-all"
              >
                <activeRoleObj.icon className="w-4 h-4 text-emerald-700" />
                <span className="hidden md:inline text-slate-500 font-normal">Role:</span>
                <span>{activeRoleObj.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    Ganti Akses Peran Aplikasi:
                  </div>
                  <div className="space-y-1">
                    {roles.map((r) => {
                      const Icon = r.icon;
                      const isCurrent = currentRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setCurrentRole(r.id);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                            isCurrent
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <div className="text-xs truncate">{r.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal truncate">{r.desc}</div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
