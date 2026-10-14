import React, { useState } from 'react';
import { 
  Shirt, 
  Scale, 
  CheckCircle, 
  Calendar, 
  Printer, 
  Tag, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  X
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import RfidBarcodeScanner from './RfidBarcodeScanner';
import BiometricTouchPad from './BiometricTouchPad';
import confetti from 'canvas-confetti';

export default function RolePetugasLaundry() {
  const {
    laundryServices,
    recordTransaction,
    checkSpendingLimit,
    showToast
  } = useApp();

  const [selectedService, setSelectedService] = useState(laundryServices[0]);
  const [qtyWeight, setQtyWeight] = useState('2.5'); // Kg or Pcs
  const [laundryNotes, setLaundryNotes] = useState('');

  // Checkout modal states
  const [step, setStep] = useState(null); // null | 'select_santri' | 'biometric' | 'receipt'
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedTx, setCompletedTx] = useState(null);

  const calculateSubtotal = () => {
    const qty = parseFloat(qtyWeight) || 0;
    return Math.round(qty * selectedService.price);
  };

  const totalPrice = calculateSubtotal();

  const handleStartProcess = () => {
    if (!qtyWeight || parseFloat(qtyWeight) <= 0) {
      showToast('Masukkan berat / jumlah pakaian yang valid', 'error');
      return;
    }
    setErrorMsg('');
    setSelectedSantri(null);
    setStep('select_santri');
  };

  const handleSantriSelect = (santri) => {
    setSelectedSantri(santri);
    setErrorMsg('');
    const check = checkSpendingLimit(santri, totalPrice);
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
        type: 'LAUNDRY',
        categoryLabel: 'Laundry Pesantren',
        amount: totalPrice,
        weightKg: selectedService.type === 'per_kg' ? parseFloat(qtyWeight) : null,
        note: `${selectedService.name} (${qtyWeight} ${selectedService.unit}) - ${laundryNotes || 'Selesai ' + selectedService.duration}`,
        cashierRole: 'Petugas Laundry',
        cashierName: 'Ummu Kasir Laundry',
        verificationMethod: method === 'TOUCH_SCREEN_FINGER' ? 'FINGERPRINT_TOUCH' : 'FINGERPRINT_USB'
      });

      confetti({ particleCount: 70, spread: 60 });
      setCompletedTx(tx);
      setStep('receipt');
      setLaundryNotes('');
    } catch (err) {
      setErrorMsg(err.message);
      setStep('select_santri');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
            <Shirt className="w-3.5 h-3.5" />
            <span>POS Petugas Laundry Pesantren</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Penerimaan & Pembayaran Laundry Santri
          </h2>
          <p className="text-xs text-slate-500">
            Potong saldo otomatis dengan RFID/Barcode dan verifikasi sidik jari santri
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Service Type Selector (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-sky-600" />
              <span>1. Pilih Jenis Layanan Laundry:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {laundryServices.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => setSelectedService(svc)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedService.id === svc.id
                      ? 'border-sky-600 bg-sky-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs mb-1">
                    {svc.name}
                  </div>
                  <div className="text-sky-700 font-black text-sm">
                    {formatRupiah(svc.price)} / {svc.unit}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Estimasi: {svc.duration}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Weight / Qty Input */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-600" />
              <span>2. Masukkan Berat / Jumlah ({selectedService.unit}):</span>
            </h3>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={qtyWeight}
                  onChange={(e) => setQtyWeight(e.target.value)}
                  className="w-full text-2xl font-black px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:border-sky-600 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  {selectedService.unit}
                </span>
              </div>

              {/* Quick weight buttons for Kg */}
              {selectedService.type === 'per_kg' && (
                <div className="flex gap-1.5">
                  {[2, 3, 5].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setQtyWeight(String(w))}
                      className="px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Khusus (Opsional):
              </label>
              <input
                type="text"
                value={laundryNotes}
                onChange={(e) => setLaundryNotes(e.target.value)}
                placeholder="Contoh: Jubah putih ada noda tinta, pisahkan sprei"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-sky-600"
              />
            </div>
          </div>
        </div>

        {/* Calculation & Checkout Summary (5 Cols) */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-4 space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Rincian Biaya Laundry
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Layanan:</span>
                <span className="font-bold text-slate-800 text-right">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarif per {selectedService.unit}:</span>
                <span className="font-semibold">{formatRupiah(selectedService.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Berat/Jumlah:</span>
                <span className="font-bold text-slate-800">{qtyWeight} {selectedService.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Pengerjaan:</span>
                <span className="font-semibold text-sky-700">{selectedService.duration}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">Total Bayar:</span>
                <span className="text-2xl font-black text-sky-700">{formatRupiah(totalPrice)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartProcess}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 text-sm mt-4"
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
                  Pilih Santri Pemilik Laundry
                </h3>
                <p className="text-xs text-slate-500">
                  Biaya Laundry: <span className="font-bold text-sky-700">{formatRupiah(totalPrice)}</span> ({qtyWeight} {selectedService.unit})
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
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                <span>Verifikasi Sidik Jari</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BIOMETRIC TOUCH PAD */}
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
              amount={totalPrice}
              title="Konfirmasi Pembayaran Laundry"
              subtitle="Santri menempelkan sidik jari pada layar atau alat scanner untuk mendebit saldo"
              onVerified={handleBiometricSuccess}
            />
          </div>
        </div>
      )}

      {/* MODAL 3: TIKET KLAIM LAUNDRY STRUK */}
      {step === 'receipt' && completedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
              <div className="font-black text-sky-800 text-base">LAUNDRY MA'HAD IMAM SYAFI'I</div>
              <div className="text-xs font-bold text-slate-700">TIKET KLAIM & STRUK RESMI</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {formatDateTime(completedTx.timestamp)} • No: {completedTx.id}
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl text-center">
              <div className="text-[10px] text-sky-700 font-bold uppercase tracking-wider">KODE AMBIL LAUNDRY</div>
              <div className="text-3xl font-black text-sky-900 tracking-widest my-1">
                #{completedTx.id.slice(-4)}
              </div>
              <div className="text-xs text-sky-800 font-semibold">
                Estimasi Ambil: {selectedService.duration}
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
                <span className="text-slate-500">Layanan:</span>
                <span className="font-semibold text-slate-800">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Berat/Qty:</span>
                <span className="font-bold">{qtyWeight} {selectedService.unit}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-bold">
                <span>Total Biaya:</span>
                <span className="text-sky-700">{formatRupiah(completedTx.amount)}</span>
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
                <span>Cetak Tiket</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(null);
                  setCompletedTx(null);
                }}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs"
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
