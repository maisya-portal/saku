import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ScanLine, 
  Fingerprint, 
  Clock, 
  CheckCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  Receipt,
  LogOut
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import RfidBarcodeScanner from './RfidBarcodeScanner';
import BiometricTouchPad from './BiometricTouchPad';

export default function RoleKioskSantri() {
  const { santriList, transactions } = useApp();

  const [activeSantri, setActiveSantri] = useState(null);
  const [authStep, setAuthStep] = useState('idle'); // 'idle' | 'fingerprint' | 'dashboard'
  const [pendingSantri, setPendingSantri] = useState(null);
  const [countdown, setCountdown] = useState(15);

  // Auto-timeout countdown when looking at balance
  useEffect(() => {
    let interval = null;
    if (authStep === 'dashboard' && activeSantri) {
      setCountdown(15);
      interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            handleLogout();
            return 15;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authStep, activeSantri]);

  const handleLogout = () => {
    setActiveSantri(null);
    setPendingSantri(null);
    setAuthStep('idle');
  };

  // Instant login via RFID or Barcode Tap
  const handleRfidOrBarcodeSelect = (santri) => {
    playSound('success');
    setActiveSantri(santri);
    setAuthStep('dashboard');
  };

  // Start Fingerprint login after picking name
  const handleStartFingerprintLogin = (santri) => {
    setPendingSantri(santri);
    setAuthStep('fingerprint');
  };

  const handleFingerprintSuccess = () => {
    setActiveSantri(pendingSantri);
    setAuthStep('dashboard');
  };

  const santriTransactions = activeSantri
    ? transactions.filter((t) => t.santriId === activeSantri.id).slice(0, 5)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* KIOSK IDLE SCREEN */}
      {authStep === 'idle' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
            <div className="relative z-10 max-w-xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Anjungan Mandiri Santri Ponpes Imam Syafi'i Brebes</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Cek Saldo & Informasi Keuangan Santri
              </h2>
              <p className="text-sm text-emerald-200/80 leading-relaxed">
                Tempelkan Kartu RFID Santri, Scan Barcode, atau pilih nama dan tempelkan sidik jari Anda di layar
              </p>
            </div>
          </div>

          {/* Scanner & Quick Tap Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-emerald-600" />
              <span>Opsi 1: Tap Kartu RFID atau Scan Barcode Kartu Santri</span>
            </h3>

            <RfidBarcodeScanner
              onSelectSantri={handleRfidOrBarcodeSelect}
              autoFocus={true}
            />
          </div>

          {/* Manual Fingerprint Login by Name */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-emerald-600" />
              <span>Opsi 2: Login Memakai Sidik Jari (Pilih Nama Anda Lalu Tempelkan Jari):</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {santriList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStartFingerprintLogin(s)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={s.avatar}
                      alt={s.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 group-hover:border-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 line-clamp-1">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-slate-500">{s.class}</div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                    <span>Verifikasi Sidik Jari</span>
                    <Fingerprint className="w-4 h-4 text-emerald-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BIOMETRIC FINGERPRINT TOUCH STEP */}
      {authStep === 'fingerprint' && pendingSantri && (
        <div className="bg-slate-900 rounded-3xl p-8 max-w-md mx-auto shadow-2xl border border-slate-800 relative">
          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Menu Utama</span>
          </button>

          <BiometricTouchPad
            santriName={`${pendingSantri.name} (${pendingSantri.class})`}
            title="Cek Saldo Mandiri"
            subtitle="Tempelkan sidik jari ananda pada layar atau alat sensor untuk membuka rincian saldo"
            onVerified={handleFingerprintSuccess}
          />
        </div>
      )}

      {/* SANTRI KIOSK DASHBOARD VIEW */}
      {authStep === 'dashboard' && activeSantri && (
        <div className="space-y-6">
          {/* Top Bar with Auto-Logout Countdown */}
          <div className="flex items-center justify-between bg-white px-6 py-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Layar akan otomatis tertutup demi privasi dalam: <strong className="text-slate-900 font-mono text-sm">{countdown}s</strong></span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Sekarang</span>
            </button>
          </div>

          {/* Profile & Saldo Card */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={activeSantri.avatar}
                  alt={activeSantri.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40 shadow-md"
                />
                <div>
                  <div className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1">
                    <CheckCircle className="w-3 h-3 text-emerald-200" />
                    <span>Terverifikasi</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">{activeSantri.name}</h3>
                  <div className="text-xs text-emerald-100 mt-0.5">
                    NIS: {activeSantri.nis} • {activeSantri.class}
                  </div>
                  <div className="text-xs text-emerald-200 mt-1">
                    {activeSantri.room} • {activeSantri.halaqah}
                  </div>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-right sm:min-w-64">
                <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                  Sisa Saldo Uang Saku
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                  {formatRupiah(activeSantri.balance)}
                </div>
              </div>
            </div>

            {/* Daily limit allowance info */}
            {activeSantri.spendingLimit?.active && (
              <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-400/20">
                  <div className="text-emerald-200 text-[11px]">Batas Dari Orang Tua:</div>
                  <div className="font-bold text-white mt-0.5">
                    {formatRupiah(activeSantri.spendingLimit.amount)} / {activeSantri.spendingLimit.type}
                  </div>
                </div>
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-400/20">
                  <div className="text-emerald-200 text-[11px]">Sudah Digunakan Hari Ini:</div>
                  <div className="font-bold text-amber-300 mt-0.5">
                    {formatRupiah(activeSantri.spendingUsed?.daily || 0)}
                  </div>
                </div>
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-400/20">
                  <div className="text-emerald-200 text-[11px]">Sisa Jajan Hari Ini:</div>
                  <div className="font-bold text-emerald-300 mt-0.5">
                    {formatRupiah(Math.max(0, activeSantri.spendingLimit.amount - (activeSantri.spendingUsed?.daily || 0)))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Last 5 Transactions */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>5 Riwayat Penggunaan Terakhir Ananda:</span>
            </h4>

            <div className="divide-y divide-slate-100">
              {santriTransactions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada riwayat transaksi.
                </div>
              ) : (
                santriTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {tx.categoryLabel || tx.type}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tx.note || '-'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(tx.timestamp)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-black ${
                        tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.type === 'DEPOSIT' ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Sisa: {formatRupiah(tx.currentBalance)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
