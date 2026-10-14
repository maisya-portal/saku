import React, { useState } from 'react';
import { 
  Building2, 
  Check, 
  X, 
  Eye, 
  Users, 
  CreditCard, 
  QrCode, 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  Database, 
  Plus, 
  Printer, 
  Download, 
  Share2, 
  Search,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import { 
  getSavedFirebaseConfig, 
  saveFirebaseConfig, 
  isDemoMode, 
  setDemoMode 
} from '../services/firebase';
import confetti from 'canvas-confetti';

export default function RoleAdminBendahara() {
  const {
    pesantrenInfo,
    santriList,
    setSantriList,
    transactions,
    topupRequests,
    approveTopup,
    rejectTopup,
    showToast
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState('approvals'); // 'approvals' | 'santri' | 'magic_links' | 'reports' | 'firebase'
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  const [selectedCardSantri, setSelectedCardSantri] = useState(null);

  // New Santri Modal
  const [isAddSantriOpen, setIsAddSantriOpen] = useState(false);

  // Firebase Config Form State
  const [fbConfig, setFbConfig] = useState(getSavedFirebaseConfig());
  const [demoState, setDemoState] = useState(isDemoMode());

  // Filter pending topups
  const pendingTopups = topupRequests.filter(t => t.status === 'PENDING');
  const pastTopups = topupRequests.filter(t => t.status !== 'PENDING');

  // KPI Calculations
  const totalSantriBalance = santriList.reduce((sum, s) => sum + (s.balance || 0), 0);
  const totalDeposits = transactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalKantin = transactions
    .filter(t => t.type === 'PURCHASE_KANTIN')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalLaundry = transactions
    .filter(t => t.type === 'LAUNDRY')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalTelpon = transactions
    .filter(t => t.type === 'TELPON')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalSPP = transactions
    .filter(t => t.type === 'SPP')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Approve Top-Up
  const handleApprove = (id) => {
    approveTopup(id);
    confetti({ particleCount: 60, spread: 50 });
  };

  // Reject Top-Up
  const handleReject = (id) => {
    const reason = window.prompt('Masukkan alasan penolakan (misal: Bukti transfer tidak terbaca / dana belum masuk):', 'Dana belum masuk ke rekening pesantren');
    if (reason) {
      rejectTopup(id, reason);
    }
  };

  // Generate WhatsApp Magic Link
  const handleSendMagicLink = (santri) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const magicUrl = `${baseUrl}#token=${santri.parentToken}`;
    
    // Find all children of this parent
    const siblings = santriList.filter(s => s.parentToken === santri.parentToken);
    const siblingsName = siblings.map(s => s.name).join(' & ');

    const text = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. Bapak/Ibu Wali Santri dari ananda:\n` +
      `*${siblingsName}*\n\n` +
      `Berikut adalah *Tautan Login Khusus Portal Keuangan Maisya-Saku* Ma'had Imam Syafi'i Brebes:\n\n` +
      `🔗 ${magicUrl}\n\n` +
      `Melalui tautan di atas Bapak/Ibu dapat:\n` +
      `1. Memantau saldo uang saku ananda secara realtime per detik.\n` +
      `2. Mengatur batas maksimal belanja jajan ananda (Harian/Pekanan).\n` +
      `3. Mengirimkan bukti transfer setoran uang saku.\n` +
      `4. Melihat rincian belanja kantin, laundry, dan telepon santri.\n\n` +
      `Jazakumullahu khairan katsiran.`
    );

    const waPhone = santri.parentPhone.replace(/[^0-9]/g, '');
    const formattedPhone = waPhone.startsWith('0') ? '62' + waPhone.slice(1) : waPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  // Handle Add Santri
  const handleAddSantriSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nis = formData.get('nis');
    const name = formData.get('name');
    const className = formData.get('class');
    const parentName = formData.get('parentName');
    const parentPhone = formData.get('parentPhone');
    const parentToken = formData.get('parentToken') || `wali-${nis.slice(-4)}`;

    const newSantri = {
      id: `santri-${Date.now().toString().slice(-4)}`,
      nis,
      name,
      class: className,
      halaqah: formData.get('halaqah') || 'Ust. Pembina',
      room: formData.get('room') || 'Asrama Santri',
      rfidTag: formData.get('rfidTag') || `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
      barcode: formData.get('barcode') || `ISB${nis}`,
      balance: Number(formData.get('initialBalance')) || 0,
      parentName,
      parentPhone,
      parentToken,
      spendingLimit: {
        type: 'daily',
        amount: 25000,
        active: true
      },
      spendingUsed: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        lastResetDate: new Date().toISOString().split('T')[0]
      },
      pin: '1234',
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    };

    const updated = [...santriList, newSantri];
    setSantriList(updated);
    showToast(`Santri "${name}" berhasil ditambahkan!`, 'success');
    setIsAddSantriOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dashboard Administrator & Bendahara Pesantren</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Pusat Pengelolaan Keuangan Santri
          </h2>
          <p className="text-xs text-slate-500">
            {pesantrenInfo.name} • Verifikasi Setoran, Smartcard RFID & Integrasi WhatsApp
          </p>
        </div>

        {/* Demo Mode or Live Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            demoState
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${demoState ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{demoState ? 'Mode Uji Coba (Lokal Realtime)' : 'Firebase Cloud Terhubung'}</span>
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Total Saldo Santri</div>
          <div className="text-base font-black text-emerald-700 mt-1">{formatRupiah(totalSantriBalance)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{santriList.length} Santri Aktif</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Total Setoran Masuk</div>
          <div className="text-base font-black text-slate-900 mt-1">{formatRupiah(totalDeposits)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Top-up Wali Santri</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Omset Kantin</div>
          <div className="text-base font-black text-amber-700 mt-1">{formatRupiah(totalKantin)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Belanja santri</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Omset Laundry</div>
          <div className="text-base font-black text-sky-700 mt-1">{formatRupiah(totalLaundry)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Jasa cuci santri</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Omset Wartel</div>
          <div className="text-base font-black text-indigo-700 mt-1">{formatRupiah(totalTelpon)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Telepon santri</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">SPP & Tagihan</div>
          <div className="text-base font-black text-purple-700 mt-1">{formatRupiah(totalSPP)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Syahriyah lunas</div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveAdminTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${
            activeAdminTab === 'approvals'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>Persetujuan Top-Up</span>
          {pendingTopups.length > 0 && (
            <span className="ml-2 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendingTopups.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('santri')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'santri'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Data Santri & Cetak Smartcard
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('magic_links')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'magic_links'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Link WhatsApp Wali Santri
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'reports'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Laporan Rekap Transaksi ({transactions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('firebase')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'firebase'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Pengaturan Firebase Cloud
        </button>
      </div>

      {/* TAB 1: TOP-UP APPROVALS */}
      {activeAdminTab === 'approvals' && (
        <div className="space-y-6">
          {/* Pending Approvals */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Antrean Konfirmasi Transfer Uang Saku
                </h3>
                <p className="text-xs text-slate-500">
                  Wali santri telah mengirim bukti transfer. Tekan "Setujui" untuk menambahkan saldo secara instan.
                </p>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                {pendingTopups.length} Menunggu Verifikasi
              </span>
            </div>

            {pendingTopups.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Tidak ada antrean top-up yang menunggu verifikasi saat ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingTopups.map((topup) => (
                  <div key={topup.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Image Thumbnail with zoom click */}
                      <button
                        type="button"
                        onClick={() => setSelectedProofUrl(topup.proofImageUrl)}
                        className="relative group shrink-0"
                      >
                        <img
                          src={topup.proofImageUrl}
                          alt="Bukti"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-300 group-hover:opacity-80 transition-opacity"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                          <Eye className="w-4 h-4" />
                        </span>
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{topup.santriName}</h4>
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded">
                            NIS: {topup.santriNis}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Wali: <strong className="text-slate-800">{topup.parentName}</strong> ({topup.parentPhone})
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Bank Tujuan: <strong>{topup.bankTarget}</strong> • Kode Unik: <strong>{topup.uniqueCode}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Dikirim pada: {formatDateTime(topup.createdAt)} {topup.note ? `• Catatan: "${topup.note}"` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold">Nominal Masuk</div>
                        <div className="text-lg font-black text-emerald-700">
                          {formatRupiah(topup.amount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReject(topup.id)}
                          className="p-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                          title="Tolak Setoran"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(topup.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Setujui Setoran</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Topups Log */}
          {pastTopups.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Riwayat Verifikasi Top-Up Terakhir</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {pastTopups.slice(0, 5).map(t => (
                  <div key={t.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">{t.santriName}</span>
                      <span className="text-slate-400 ml-2">{formatDateTime(t.approvedAt || t.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-700">{formatRupiah(t.amount)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SANTRI DATA & SMARTCARD RFID PRINTER */}
      {activeAdminTab === 'santri' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Database Santri & Kartu Digital RFID/Barcode
              </h3>
              <p className="text-xs text-slate-500">
                Kelola data identitas santri, nomor RFID fisik, barcode kartu, dan cetak kartu santri pintar
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddSantriOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Santri Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Kelas / Halaqah</th>
                  <th className="py-3 px-4">Kartu RFID / Barcode</th>
                  <th className="py-3 px-4">Saldo</th>
                  <th className="py-3 px-4">Batas Belanja</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santriList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={s.avatar}
                          alt={s.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[11px] text-slate-400">{s.room}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.nis}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{s.class}</div>
                      <div className="text-[11px] text-slate-400">{s.halaqah}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-emerald-700 font-semibold">{s.rfidTag}</div>
                      <div className="text-slate-400">{s.barcode}</div>
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                      {formatRupiah(s.balance)}
                    </td>
                    <td className="py-3 px-4">
                      {s.spendingLimit?.active ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {formatRupiah(s.spendingLimit.amount)} / {s.spendingLimit.type}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Tanpa Batas</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCardSantri(s)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ml-auto"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Cetak Smartcard</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MAGIC LINKS FOR WALI SANTRI */}
      {activeAdminTab === 'magic_links' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Generator Tautan Login Unik WhatsApp Wali Santri
            </h3>
            <p className="text-xs text-slate-500">
              Orang tua tidak perlu menghafal kata sandi. Kirim tautan unik ke nomor WhatsApp orang tua untuk membuka portal ananda secara otomatis. 1 Link bisa memuat lebih dari 1 anak jika bersaudara kandung!
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {santriList.map((s) => {
              const baseUrl = window.location.origin + window.location.pathname;
              const link = `${baseUrl}#token=${s.parentToken}`;
              return (
                <div key={s.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{s.parentName}</span>
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Wali dari: {s.name} ({s.class})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      No. WhatsApp: <strong>{s.parentPhone}</strong> • Token Unik: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{s.parentToken}</code>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono mt-1 truncate max-w-md">
                      {link}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(link);
                        showToast('Tautan login disalin!', 'info');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      Salin Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMagicLink(s)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Kirim ke WhatsApp Wali</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTION REPORTS & CSV EXPORT */}
      {activeAdminTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Rekap Transaksi Keuangan Keseluruhan
              </h3>
              <p className="text-xs text-slate-500">
                Log real-time seluruh perputaran uang saku, belanja kantin, laundry, wartel, dan SPP
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const header = "ID,Tanggal,Santri,NIS,Kategori,Nominal,Saldo_Akhir,Petugas,Otorisasi\n";
                const rows = transactions.map(t => 
                  `"${t.id}","${t.timestamp}","${t.santriName}","${t.santriNis}","${t.categoryLabel || t.type}","${t.amount}","${t.currentBalance}","${t.cashierName}","${t.verificationMethod}"`
                ).join("\n");
                const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Laporan_Maisya_Saku_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor ke CSV / Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider sticky top-0 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Santri</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Saldo Akhir</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatDateTime(t.timestamp)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.santriName} ({t.santriNis})</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.categoryLabel || t.type}</td>
                    <td className={`py-2.5 px-3 font-bold ${t.type === 'DEPOSIT' ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {t.type === 'DEPOSIT' ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{formatRupiah(t.currentBalance)}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{t.verificationMethod}</td>
                    <td className="py-2.5 px-3 text-slate-500">{t.cashierName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FIREBASE CLOUD SETUP */}
      {activeAdminTab === 'firebase' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Integrasi Cloud Backend Firebase & Mode Uji Coba
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Maisya-Saku mendukung mode zero-config local demo dan live Google Firebase Firestore. Anda dapat memasukkan konfigurasi Firebase di bawah ini untuk sinkronisasi cloud real-time antar perangkat dan database terpusat.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-slate-800">
                Status Mode: {demoState ? 'Mode Demo / Offline Sync' : 'Live Firebase Firestore'}
              </div>
              <div className="text-xs text-slate-500">
                {demoState ? 'Data tersimpan di penyimpanan lokal browser & sinkron antar-tab secara instan.' : 'Terhubung langsung ke Firestore cloud database.'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDemoMode(!demoState);
                setDemoState(!demoState);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              {demoState ? 'Beralih ke Live Firebase' : 'Beralih ke Mode Demo'}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveFirebaseConfig(fbConfig);
              showToast('Konfigurasi Firebase berhasil disimpan!', 'success');
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">API Key:</label>
                <input
                  type="text"
                  value={fbConfig.apiKey || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project ID:</label>
                <input
                  type="text"
                  value={fbConfig.projectId || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                  placeholder="maisya-saku-xxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Auth Domain:</label>
                <input
                  type="text"
                  value={fbConfig.authDomain || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                  placeholder="maisya-saku-xxxx.firebaseapp.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Storage Bucket:</label>
                <input
                  type="text"
                  value={fbConfig.storageBucket || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, storageBucket: e.target.value })}
                  placeholder="maisya-saku-xxxx.appspot.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md"
              >
                Simpan & Muat Ulang Firebase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PROOF OF TRANSFER FULL VIEWER */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">Foto Bukti Transfer Wali Santri</span>
              <button
                type="button"
                onClick={() => setSelectedProofUrl(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedProofUrl}
              alt="Bukti Transfer"
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-200"
            />
            <div className="text-right">
              <button
                type="button"
                onClick={() => setSelectedProofUrl(null)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE SMARTCARD SANTRI */}
      {selectedCardSantri && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-800">Pratinjau Kartu Pintar Santri (Smartcard)</span>
              <button
                type="button"
                onClick={() => setSelectedCardSantri(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smartcard Physical Design */}
            <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden border-2 border-amber-300/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">MA'HAD IMAM SYAFI'I BREBES</div>
                  <div className="text-sm font-black tracking-wide">MAISYA-SAKU SMARTCARD</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-300 text-xs font-serif font-black">
                  ISB
                </div>
              </div>

              <div className="flex items-center gap-4 my-3">
                <img
                  src={selectedCardSantri.avatar}
                  alt={selectedCardSantri.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 shadow-md"
                />
                <div>
                  <div className="text-base font-black leading-tight text-white">{selectedCardSantri.name}</div>
                  <div className="text-xs text-emerald-200 font-mono mt-0.5">NIS: {selectedCardSantri.nis}</div>
                  <div className="text-xs text-emerald-100">{selectedCardSantri.class}</div>
                  <div className="text-[11px] text-emerald-300">{selectedCardSantri.room}</div>
                </div>
              </div>

              {/* Barcode & NFC Simulation Graphic */}
              <div className="bg-white/90 p-2.5 rounded-xl text-slate-900 flex items-center justify-between mt-4">
                <div>
                  <div className="font-mono font-black text-xs tracking-widest">{selectedCardSantri.barcode}</div>
                  <div className="text-[9px] text-slate-500 font-sans">RFID: {selectedCardSantri.rfidTag}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                  <CreditCard className="w-4 h-4" />
                  <span>CASHLESS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kartu Fisik</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCardSantri(null)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SANTRI FORM */}
      {isAddSantriOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSantriSubmit}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Pendaftaran Santri Baru Maisya-Saku
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSantriOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Induk Santri (NIS):</label>
                  <input
                    name="nis"
                    defaultValue={`20240100${santriList.length + 1}`}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri:</label>
                  <input
                    name="name"
                    required
                    placeholder="Contoh: Bilal bin Rabah"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas & Jenjang:</label>
                  <input
                    name="class"
                    defaultValue="Kelas 7A - Tahfizh"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kamar Asrama:</label>
                  <input
                    name="room"
                    defaultValue="Kamar Abu Bakar 01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Wali Santri:</label>
                  <input
                    name="parentName"
                    required
                    placeholder="Bpk / Ibu..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp Wali:</label>
                  <input
                    name="parentPhone"
                    defaultValue="081234567899"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tag RFID Fisik (Kartu):</label>
                  <input
                    name="rfidTag"
                    defaultValue={`RFID-${Math.floor(100000 + Math.random() * 900000)}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saldo Awal (Rp):</label>
                  <input
                    name="initialBalance"
                    type="number"
                    defaultValue="100000"
                    step="5000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddSantriOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Daftarkan Santri
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
