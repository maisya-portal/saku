import React from 'react';
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

function MainContent() {
  const { authSession, currentRole, pesantrenInfo } = useApp();

  // If session is locked / not authenticated, display secure AuthGate
  if (!authSession) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'admin' && <RoleAdminBendahara />}
        {currentRole === 'kantin' && <RolePetugasKantin />}
        {currentRole === 'laundry' && <RolePetugasLaundry />}
        {currentRole === 'wartel' && <RolePetugasTelpon />}
        {currentRole === 'spp' && <RoleKasirSPP />}
        {currentRole === 'kiosk' && <RoleKioskSantri />}
        {currentRole === 'wali' && <RoleWaliSantri />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <div className="font-semibold text-slate-700">
            Maisya-Saku • {pesantrenInfo.name}
          </div>
          <div className="text-[11px] text-slate-400">
            {pesantrenInfo.tagline} • {pesantrenInfo.address}
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            Mendukung PWA, RFID Reader USB, Barcode Scanner & Otorisasi Biometrik Touch Screen
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
