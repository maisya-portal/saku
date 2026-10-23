import React, { useState } from 'react';
import { 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  FileText, 
  Printer, 
  ShieldCheck, 
  ArrowRight, 
  X,
  CreditCard
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import RfidBarcodeScanner from './RfidBarcodeScanner';
import BiometricTouchPad from './BiometricTouchPad';
import confetti from 'canvas-confetti';

export default function RoleKasirSPP() {
  const {
    sppBills,
    santriList,
    paySppBill,
    showToast
  } = useApp();

  const [selectedSantri, setSelectedSantri] = useState(santriList[0]);
  const [activeBill, setActiveBill] = useState(null);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);

  // Bills for selected santri
  const santriBills = sppBills.filter(b => b.santriNis === selectedSantri?.nis);

  const handleStartPayment = (bill) => {
    if (selectedSantri.biometricStatus !== 'APPROVED' || !selectedSantri.biometricCode) {
      showToast(`Pembayaran ditolak: Biometrik ${selectedSantri.name} belum terdaftar/terverifikasi!`, 'error');
      playSound('error');
      return;
    }

    if (selectedSantri.balance < bill.amount) {
      showToast(`Saldo santri (${formatRupiah(selectedSantri.balance)}) tidak cukup untuk membayar ${bill.title} (${formatRupiah(bill.amount)})`, 'error');
      playSound('error');
      return;
    }
    setActiveBill(bill);
    setIsBiometricOpen(true);
  };

  const handleBiometricVerified = async () => {
    try {
      await paySppBill(activeBill.id, selectedSantri.id, 'Kasir Keuangan Pesantren');
      confetti({ particleCount: 75, spread: 60 });
      setCompletedPayment({
        bill: activeBill,
        santri: selectedSantri,
        date: new Date().toISOString()
      });
      setIsBiometricOpen(false);
      setActiveBill(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Kasir SPP & Pembiayaan Santri Ma'had</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Pembayaran SPP & Ekstrakurikuler
          </h2>
          <p className="text-xs text-slate-500">
            Santri dapat melunasi SPP dan kegiatan dari saldo digital tanpa memegang uang tunai
          </p>
        </div>
      </div>

      {/* Santri Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          Pilih / Tap Kartu Santri:
        </h3>
        <RfidBarcodeScanner
          selectedSantri={selectedSantri}
          onSelectSantri={(s) => {
            setSelectedSantri(s);
            playSound('beep');
          }}
        />
      </div>

      {/* Bills Checklist Table */}
      {selectedSantri && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Daftar Tagihan: {selectedSantri.name}
              </h3>
              <p className="text-xs text-slate-500">
                NIS: {selectedSantri.nis} • {selectedSantri.class} • Saldo Saat Ini: <strong className="text-sky-700">{formatRupiah(selectedSantri.balance)}</strong>
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {santriBills.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada data tagihan untuk santri ini.
              </div>
            ) : (
              santriBills.map((bill) => (
                <div key={bill.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{bill.title}</h4>
                      {bill.status === 'PAID' ? (
                        <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>LUNAS</span>
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>BELUM LUNAS</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Periode: {bill.monthYear} {bill.dueDate ? `• Jatuh tempo: ${bill.dueDate}` : ''}
                    </div>
                    {bill.paidAt && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Dilunasi pada: {formatDateTime(bill.paidAt)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">
                        {formatRupiah(bill.amount)}
                      </div>
                    </div>

                    {bill.status === 'UNPAID' ? (
                      <button
                        type="button"
                        onClick={() => handleStartPayment(bill)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar Dari Saldo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedPayment({
                            bill,
                            santri: selectedSantri,
                            date: bill.paidAt
                          });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Kuitansi</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BIOMETRIC TOUCH MODAL */}
      {isBiometricOpen && activeBill && selectedSantri && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setIsBiometricOpen(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white flex items-center gap-1 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>

            <BiometricTouchPad
              santriName={`${selectedSantri.name} (${selectedSantri.class})`}
              amount={activeBill.amount}
              title={`Otorisasi Pembayaran: ${activeBill.title}`}
              subtitle="Santri menempelkan jari pada sensor untuk memproses pelunasan SPP langsung dari saldo akun"
              onVerified={handleBiometricVerified}
            />
          </div>
        </div>
      )}

      {/* OFFICIAL KUITANSI SPP MODAL */}
      {completedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center border-b-2 border-slate-200 pb-3">
              <div className="text-xs tracking-wider text-slate-500 font-bold uppercase">KUITANSI RESMI PEMBAYARAN</div>
              <div className="font-black text-sky-800 text-lg mt-0.5">MA'HAD IMAM SYAFI'I BREBES</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Tanggal: {formatDateTime(completedPayment.date)}
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900">Status Pembayaran:</span>
              <span className="bg-sky-600 text-white font-black text-xs px-3 py-1 rounded-full">
                LUNAS (SAH)
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Santri:</span>
                <span className="font-bold text-slate-900">{completedPayment.santri.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIS:</span>
                <span className="font-mono font-bold">{completedPayment.santri.nis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kelas / Halaqah:</span>
                <span className="font-semibold">{completedPayment.santri.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan Tagihan:</span>
                <span className="font-bold text-slate-800">{completedPayment.bill.title}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
                <span>Jumlah Yang Dibayar:</span>
                <span className="text-sky-700">{formatRupiah(completedPayment.bill.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Metode Pembayaran:</span>
                <span className="font-semibold text-slate-800">Saldo Digital Maisya-Saku (Biometric Verified)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedPayment(null)}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
