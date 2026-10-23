import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, 
  Clock, 
  Play, 
  Square, 
  UserCheck, 
  ShieldAlert, 
  Printer, 
  ArrowRight, 
  X,
  Volume2
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import RfidBarcodeScanner from './RfidBarcodeScanner';
import BiometricTouchPad from './BiometricTouchPad';
import confetti from 'canvas-confetti';

export default function RolePetugasTelpon() {
  const {
    wartelBooths,
    recordTransaction,
    checkSpendingLimit,
    showToast
  } = useApp();

  const [activeBooth, setActiveBooth] = useState(wartelBooths[0]);
  const [ratePerMinute, setRatePerMinute] = useState(1000);
  const [callDurationMinutes, setCallDurationMinutes] = useState('10');
  const [phoneTarget, setPhoneTarget] = useState('Umi / Abi di Rumah');

  // Interactive Live Call Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  // Modal checkout state
  const [step, setStep] = useState(null); // null | 'select_santri' | 'biometric' | 'receipt'
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedTx, setCompletedTx] = useState(null);

  // Timer controls
  const startTimer = () => {
    setTimerRunning(true);
    setTimerSeconds(0);
    playSound('beep');
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const mins = Math.max(1, Math.ceil(timerSeconds / 60));
    setCallDurationMinutes(String(mins));
    playSound('beep');
    showToast(`Panggilan selesai: ${mins} menit dicatat.`, 'info');
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const totalMinutes = parseInt(callDurationMinutes, 10) || 1;
  const totalCost = totalMinutes * ratePerMinute;

  const handleStartCheckout = () => {
    if (timerRunning) {
      stopTimer();
    }
    setErrorMsg('');
    setSelectedSantri(null);
    setStep('select_santri');
  };

  const handleSantriSelect = (santri) => {
    setSelectedSantri(santri);
    setErrorMsg('');

    if (santri.biometricStatus !== 'APPROVED' && !santri.biometricRegistered) {
      setErrorMsg(`TRANSAKSI DITOLAK! Biometrik ananda ${santri.name} belum terdaftar / belum terverifikasi. Transaksi wartel santri wajib menggunakan verifikasi biometrik.`);
      playSound('error');
      return;
    }

    const check = checkSpendingLimit(santri, totalCost);
    if (!check.allowed) {
      setErrorMsg(check.reason);
      playSound('error');
    } else {
      playSound('beep');
    }
  };

  const handleBiometricSuccess = async (method) => {
    try {
      const tx = await recordTransaction({
        santriId: selectedSantri.id,
        type: 'TELPON',
        categoryLabel: 'Wartel Penelponan Santri',
        amount: totalCost,
        durationMinutes: totalMinutes,
        note: `Telepon ${phoneTarget} (${totalMinutes} Menit) di ${activeBooth.name}`,
        cashierRole: 'Petugas Wartel',
        cashierName: 'Akhi Penjaga Wartel',
        verificationMethod: method === 'TOUCH_SCREEN_FINGER' ? 'FINGERPRINT_TOUCH' : 'FINGERPRINT_USB'
      });

      confetti({ particleCount: 70, spread: 60 });
      setCompletedTx(tx);
      setStep('receipt');
      setTimerSeconds(0);
    } catch (err) {
      setErrorMsg(err.message);
      setStep('select_santri');
    }
  };

  // Format seconds to mm:ss
  const formatTimerDisplay = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>POS Petugas Wartel / Penelponan Santri</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Layanan Komunikasi & Wartel Santri
          </h2>
          <p className="text-xs text-slate-500">
            Penghitungan otomatis pulsa telpon per menit dengan otorisasi sidik jari santri
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Booth & Live Timer (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          {/* Booth Picker */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700">Pilih Bilik Telepon:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {wartelBooths.map((booth) => (
                <button
                  key={booth.id}
                  type="button"
                  onClick={() => setActiveBooth(booth)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeBooth.id === booth.id
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-slate-800 text-xs">{booth.name.split(' (')[0]}</div>
                  <div className="text-[10px] text-slate-400 truncate">{booth.name.split(' (')[1]?.replace(')', '') || 'Bilik Utama'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Live Timer */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300">Stopwatch Panggilan Langsung</span>
              {timerRunning && (
                <span className="flex items-center gap-1.5 text-xs text-sky-400 font-bold bg-sky-950 px-2.5 py-1 rounded-full border border-sky-500/30">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span>Sedang Berbicara</span>
                </span>
              )}
            </div>

            <div className="text-5xl sm:text-6xl font-mono font-black text-center tracking-widest text-indigo-100 py-4">
              {formatTimerDisplay(timerSeconds)}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!timerRunning ? (
                <button
                  type="button"
                  onClick={startTimer}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Panggilan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopTimer}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Selesai Bicara & Hitung Biaya</span>
                </button>
              )}
            </div>
          </div>

          {/* Manual Input Minutes Option */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Durasi Panggilan (Menit):</label>
              <span className="text-[11px] text-slate-400">Tarif: {formatRupiah(ratePerMinute)} / menit</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={callDurationMinutes}
                onChange={(e) => setCallDurationMinutes(e.target.value)}
                className="w-24 text-xl font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center focus:bg-white focus:border-indigo-600 outline-none"
              />
              <span className="text-xs font-semibold text-slate-500">Menit</span>

              <div className="flex gap-1.5 ml-auto">
                {[5, 10, 15, 20].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCallDurationMinutes(String(m))}
                    className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tujuan Penelponan:
              </label>
              <input
                type="text"
                value={phoneTarget}
                onChange={(e) => setPhoneTarget(e.target.value)}
                placeholder="Contoh: Orang Tua di Rumah / Wali"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Total & Checkout Side (5 Cols) */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-4 space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Rincian Biaya Penelponan
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Bilik Wartel:</span>
                <span className="font-bold text-slate-800">{activeBooth.name.split(' (')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi Bicara:</span>
                <span className="font-bold text-indigo-700">{totalMinutes} Menit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarif per Menit:</span>
                <span className="font-semibold">{formatRupiah(ratePerMinute)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan:</span>
                <span className="font-semibold text-slate-700">{phoneTarget}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">Total Bayar:</span>
                <span className="text-2xl font-black text-indigo-700">{formatRupiah(totalCost)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartCheckout}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 text-sm mt-4"
            >
              <span>Tap Kartu Santri & Bayar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: SANTRI SELECTION */}
      {step === 'select_santri' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Pilih Santri Penelpon
                </h3>
                <p className="text-xs text-slate-500">
                  Biaya Wartel: <span className="font-bold text-indigo-700">{formatRupiah(totalCost)}</span> ({totalMinutes} Menit)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <RfidBarcodeScanner
              selectedSantri={selectedSantri}
              onSelectSantri={handleSantriSelect}
            />

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-bold">TRANSAKSI DITOLAK!</div>
                  <div className="mt-0.5">{errorMsg}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setStep('biometric')}
                disabled={!selectedSantri || !!errorMsg}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                <span>Verifikasi Sidik Jari</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BIOMETRIC TOUCH */}
      {step === 'biometric' && selectedSantri && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setStep('select_santri')}
              className="absolute -top-12 right-0 text-white/80 hover:text-white flex items-center gap-1 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <BiometricTouchPad
              santriName={`${selectedSantri.name} (${selectedSantri.class})`}
              amount={totalCost}
              title="Konfirmasi Pembayaran Telepon"
              subtitle="Santri menempelkan sidik jari untuk mengonfirmasi pemotongan saldo wartel"
              onVerified={handleBiometricSuccess}
            />
          </div>
        </div>
      )}

      {/* MODAL 3: RECEIPT */}
      {step === 'receipt' && completedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
              <div className="font-black text-indigo-900 text-base">WARTEL MA'HAD IMAM SYAFI'I</div>
              <div className="text-xs font-bold text-slate-700">BUKTI PANGGILAN SANTRI</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {formatDateTime(completedTx.timestamp)} • No: {completedTx.id}
              </div>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Santri:</span>
                <span className="font-bold text-slate-900">{completedTx.santriName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIS:</span>
                <span className="font-mono font-bold">{completedTx.santriNis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bilik:</span>
                <span className="font-semibold text-slate-800">{activeBooth.name.split(' (')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi:</span>
                <span className="font-bold text-indigo-700">{totalMinutes} Menit</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-bold">
                <span>Total Biaya:</span>
                <span className="text-indigo-800">{formatRupiah(completedTx.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Sisa Saldo:</span>
                <span className="font-bold text-slate-800">{formatRupiah(completedTx.currentBalance)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(null);
                  setCompletedTx(null);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
