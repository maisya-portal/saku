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
  ShieldCheck,
  KeyRound,
  Edit3,
  Trash2,
  Lock,
  RefreshCw,
  Sliders,
  Settings,
  Phone,
  Landmark
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import { 
  getSavedFirebaseConfig, 
  saveFirebaseConfig, 
  isDemoMode, 
  setDemoMode 
} from '../services/firebase';
import confetti from 'canvas-confetti';
import WhatsAppDispatchModal from './WhatsAppDispatchModal';

export default function RoleAdminBendahara() {
  const {
    pesantrenInfo,
    updatePesantrenInfo,
    santriList,
    setSantriList,
    addSantri,
    updateSantri,
    deleteSantri,
    roleAccounts,
    updateRoleAccount,
    transactions,
    topupRequests,
    approveTopup,
    rejectTopup,
    showToast
  } = useApp();

  // Active Tab
  const [activeAdminTab, setActiveAdminTab] = useState('roles'); // 'roles' | 'santri' | 'approvals' | 'settings' | 'reports' | 'firebase'

  // WhatsApp Dispatch Modal State
  const [whatsAppModal, setWhatsAppModal] = useState({
    isOpen: false,
    title: '',
    recipientName: '',
    initialPhone: '',
    defaultMessage: '',
    onSavePhone: null
  });

  // Modals state
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  const [selectedCardSantri, setSelectedCardSantri] = useState(null);
  const [editingSantri, setEditingSantri] = useState(null);
  const [isAddSantriOpen, setIsAddSantriOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // Search in Santri Tab
  const [santriSearch, setSantriSearch] = useState('');

  // Firebase Config Form State
  const [fbConfig, setFbConfig] = useState(getSavedFirebaseConfig());
  const [demoState, setDemoState] = useState(isDemoMode());

  // Filter topups
  const pendingTopups = topupRequests.filter(t => t.status === 'PENDING');
  const pastTopups = topupRequests.filter(t => t.status !== 'PENDING');

  // KPI Calculations
  const totalSantriBalance = santriList.reduce((sum, s) => sum + (s.balance || 0), 0);
  const totalDeposits = transactions.filter(t => t.type === 'DEPOSIT').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalKantin = transactions.filter(t => t.type === 'PURCHASE_KANTIN').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalLaundry = transactions.filter(t => t.type === 'LAUNDRY').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalTelpon = transactions.filter(t => t.type === 'TELPON').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalSPP = transactions.filter(t => t.type === 'SPP').reduce((sum, t) => sum + (t.amount || 0), 0);

  // Approve Top-Up
  const handleApprove = (id) => {
    approveTopup(id);
    confetti({ particleCount: 60, spread: 50 });
  };

  // Reject Top-Up
  const handleReject = (id) => {
    const reason = window.prompt('Masukkan alasan penolakan:', 'Dana transfer belum masuk ke rekening pesantren');
    if (reason) {
      rejectTopup(id, reason);
    }
  };

  // Generate WhatsApp Magic Link for Staff Roles (Opens editable modal)
  const handleSendRoleMagicLink = (roleAcc) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const magicUrl = `${baseUrl}#token=${roleAcc.token}`;

    const text = 
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. *${roleAcc.name}* (${roleAcc.title})\n` +
      `Berikut adalah *Tautan Masuk Aman (Magic Link)* Anda pada sistem Maisya-Saku Ma'had Imam Syafi'i Brebes:\n\n` +
      `🔗 ${magicUrl}\n\n` +
      `PIN Masuk Anda: *${roleAcc.pin}*\n` +
      `(Anda juga dapat masuk menggunakan sensor sidik jari pada layar HP/tablet).\n\n` +
      `Harap jaga kerahasiaan tautan dan PIN ini.`;

    setWhatsAppModal({
      isOpen: true,
      title: 'Kirim Magic Link ke Petugas',
      recipientName: `${roleAcc.name} (${roleAcc.title})`,
      initialPhone: roleAcc.phone || '',
      defaultMessage: text,
      onSavePhone: (newPhone) => {
        updateRoleAccount(roleAcc.id, { phone: newPhone });
      }
    });
  };

  // Generate WhatsApp Magic Link for Wali Santri (Opens editable modal)
  const handleSendWaliMagicLink = (santri) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const magicUrl = `${baseUrl}#token=${santri.parentToken}`;
    const siblings = santriList.filter(s => s.parentToken === santri.parentToken);
    const siblingsName = siblings.map(s => s.name).join(' & ');

    const text = 
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. Bapak/Ibu Wali Santri dari ananda:\n` +
      `*${siblingsName}*\n\n` +
      `Berikut adalah *Tautan Portal Keuangan Maisya-Saku* Ma'had Imam Syafi'i Brebes:\n\n` +
      `🔗 ${magicUrl}\n\n` +
      `PIN Masuk: *${santri.pin || '1234'}* (atau gunakan sidik jari HP/tablet)\n\n` +
      `Melalui tautan di atas Anda dapat memantau saldo realtime, mengatur batas jajan harian, transfer uang saku, dan melihat riwayat belanja santri.\n` +
      `Jazakumullahu khairan.`;

    setWhatsAppModal({
      isOpen: true,
      title: 'Kirim Magic Link ke Wali Santri',
      recipientName: `${santri.parentName} (Wali dari ${siblingsName})`,
      initialPhone: santri.parentPhone || '',
      defaultMessage: text,
      onSavePhone: (newPhone) => {
        updateSantri(santri.id, { parentPhone: newPhone });
      }
    });
  };

  // Filtered Santri
  const filteredSantri = santriList.filter(s => 
    s.name.toLowerCase().includes(santriSearch.toLowerCase()) ||
    s.nis.includes(santriSearch) ||
    s.class.toLowerCase().includes(santriSearch.toLowerCase()) ||
    s.parentName.toLowerCase().includes(santriSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold border border-emerald-500/30 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Super Administrator & Bendahara Pusat</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Pusat Kendali Sistem Maisya-Saku
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {pesantrenInfo.name} • Pengaturan Hak Akses Peran, Data Santri, & Konfigurasi Pesantren
          </p>
        </div>

        {/* Live / Demo Mode Badge */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-right self-start sm:self-center">
          <div className="text-[11px] text-emerald-300 font-semibold">Status Sistem:</div>
          <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
            <span className={`w-2.5 h-2.5 rounded-full ${demoState ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{demoState ? 'Lokal Sync Realtime' : 'Cloud Firestore Aktif'}</span>
          </div>
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
          <div className="text-[10px] text-slate-400 mt-0.5">Top-up Terverifikasi</div>
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
          onClick={() => setActiveAdminTab('roles')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'roles'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          🔐 Hak Akses Petugas & Magic Links ({roleAccounts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('santri')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'santri'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          👥 Database Santri & Smartcard ({santriList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${
            activeAdminTab === 'approvals'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>📥 Persetujuan Top-Up</span>
          {pendingTopups.length > 0 && (
            <span className="ml-2 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendingTopups.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'settings'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          ⚙️ Profil Pesantren & Rekening
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'reports'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          📊 Rekap Transaksi ({transactions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('firebase')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'firebase'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          ☁️ Firebase Cloud
        </button>
      </div>

      {/* TAB 1: MANAJEMEN ROLE PETUGAS & MAGIC LINKS */}
      {activeAdminTab === 'roles' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Pengaturan Hak Akses & Kredensial Setiap Role
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Aplikasi tidak memunculkan tombol login umum. Seluruh petugas masuk menggunakan <strong>Magic Link Resmi</strong> dan otorisasi <strong>PIN / Sidik Jari Layar Sentuh</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleAccounts.map((acc) => {
              const baseUrl = window.location.origin + window.location.pathname;
              const magicUrl = `${baseUrl}#token=${acc.token}`;

              return (
                <div key={acc.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-500/50 hover:shadow-md transition-all space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-300"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{acc.name}</h4>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {acc.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">{acc.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">WA: {acc.phone || '-'}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingRole(acc)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                      title="Ubah Kredensial / PIN"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Token & PIN Credentials */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">PIN Keamanan Petugas:</span>
                      <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded tracking-widest">
                        {acc.pin}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Token Magic Link:</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        #{acc.token}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 truncate pt-1 border-t border-slate-100 font-mono">
                      {magicUrl}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(magicUrl);
                        showToast(`Magic link untuk ${acc.name} disalin!`, 'info');
                      }}
                      className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 text-center"
                    >
                      Salin Link
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendRoleMagicLink(acc)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Kirim ke WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DATABASE SANTRI & SMARTCARD */}
      {activeAdminTab === 'santri' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Database Santri & Pengaturan Smartcard
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kelola data lengkap santri, hubungkan nomor kartu RFID, barcode, dan bagikan tautan wali santri
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddSantriOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-center shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Santri Baru</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={santriSearch}
              onChange={(e) => setSantriSearch(e.target.value)}
              placeholder="Cari santri berdasarkan Nama, NIS, Kelas, atau Nama Wali..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          {/* Santri Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama & Asrama</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Kelas & Halaqah</th>
                  <th className="py-3 px-4">Wali Santri (WhatsApp)</th>
                  <th className="py-3 px-4">Saldo Santri</th>
                  <th className="py-3 px-4">Limit Belanja</th>
                  <th className="py-3 px-4 text-right">Aksi & Smartcard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSantri.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
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
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{s.parentName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>{s.parentPhone}</span>
                        <button
                          type="button"
                          onClick={() => handleSendWaliMagicLink(s)}
                          className="text-emerald-700 hover:underline font-bold"
                          title="Kirim Magic Link ke Wali via WhatsApp"
                        >
                          (Kirim WA)
                        </button>
                      </div>
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
                        <span className="text-slate-400 text-[11px]">Bebas Limit</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCardSantri(s)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1"
                          title="Cetak Smartcard Fisik"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Smartcard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingSantri(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                          title="Edit Santri"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus santri "${s.name}"?`)) {
                              deleteSantri(s.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Santri"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PERSETUJUAN TOP-UP */}
      {activeAdminTab === 'approvals' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Antrean Konfirmasi Transfer Uang Saku Santri
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi bukti transfer dari wali santri dan setujui untuk mendebit saldo secara otomatis
              </p>
            </div>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              {pendingTopups.length} Menunggu Persetujuan
            </span>
          </div>

          {pendingTopups.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Semua konfirmasi transfer telah selesai diverifikasi. Tidak ada antrean baru.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingTopups.map((topup) => (
                <div key={topup.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedProofUrl(topup.proofImageUrl)}
                      className="relative group shrink-0"
                    >
                      <img
                        src={topup.proofImageUrl}
                        alt="Bukti Transfer"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-300 group-hover:opacity-80"
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
                        Tujuan: <strong>{topup.bankTarget}</strong> • Kode Unik: <strong>{topup.uniqueCode}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Diajukan: {formatDateTime(topup.createdAt)} {topup.note ? `• "${topup.note}"` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-semibold">Nominal Setoran</div>
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
      )}

      {/* TAB 4: PROFIL PESANTREN & REKENING RESMI */}
      {activeAdminTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Pengaturan Profil Ma'had & Rekening Resmi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Data rekening ini ditampilkan kepada seluruh wali santri saat melakukan pengisian saldo
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              updatePesantrenInfo({
                ...pesantrenInfo,
                name: form.get('name'),
                tagline: form.get('tagline'),
                address: form.get('address'),
                whatsappAdmin: form.get('whatsappAdmin')
              });
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pesantren:</label>
                <input
                  name="name"
                  defaultValue={pesantrenInfo.name}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Resmi Bendahara:</label>
                <input
                  name="whatsappAdmin"
                  defaultValue={pesantrenInfo.whatsappAdmin}
                  required
                  placeholder="6281234567890"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline Pesantren:</label>
              <input
                name="tagline"
                defaultValue={pesantrenInfo.tagline}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap:</label>
              <input
                name="address"
                defaultValue={pesantrenInfo.address}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md"
              >
                Simpan Profil Pesantren
              </button>
            </div>
          </form>

          {/* Bank Accounts List */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Daftar Rekening Bank Resmi:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pesantrenInfo.bankAccounts.map((acc, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-emerald-800 text-xs">{acc.bank}</div>
                  <div className="text-base font-mono font-bold text-slate-900 mt-1">{acc.accountNo}</div>
                  <div className="text-xs text-slate-500 mt-0.5">a/n {acc.accountHolder}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REKAP TRANSAKSI */}
      {activeAdminTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Rekap Transaksi Keuangan Keseluruhan
              </h3>
              <p className="text-xs text-slate-500">
                Log real-time seluruh perputaran uang saku, kantin, laundry, wartel, dan SPP
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

      {/* TAB 6: FIREBASE CLOUD */}
      {activeAdminTab === 'firebase' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Integrasi Cloud Backend Firebase & Mode Uji Coba
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Maisya-Saku mendukung mode zero-config local demo dan live Google Firebase Firestore.
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

      {/* MODAL 1: EDIT ROLE KREDENSIAL / PIN */}
      {editingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              updateRoleAccount(editingRole.id, {
                name: form.get('name'),
                title: form.get('title'),
                phone: form.get('phone'),
                pin: form.get('pin'),
                token: form.get('token')
              });
              setEditingRole(null);
            }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Ubah Kredensial: {editingRole.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Petugas:</label>
                <input
                  name="name"
                  defaultValue={editingRole.name}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan / Role Title:</label>
                <input
                  name="title"
                  defaultValue={editingRole.title}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Keamanan (6 Digit):</label>
                  <input
                    name="pin"
                    defaultValue={editingRole.pin}
                    required
                    maxLength={6}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold tracking-widest text-emerald-800 focus:bg-white focus:border-emerald-600 outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp:</label>
                  <input
                    name="phone"
                    defaultValue={editingRole.phone}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Token Magic Link Unik:</label>
                <div className="flex gap-2">
                  <input
                    name="token"
                    id="role-token-input"
                    defaultValue={editingRole.token}
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('role-token-input');
                      if (input) input.value = `${editingRole.role}-isb-${Math.floor(1000 + Math.random() * 9000)}`;
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Acak
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: ADD SANTRI FORM */}
      {isAddSantriOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              const nis = form.get('nis');
              const name = form.get('name');
              const parentPhone = form.get('parentPhone');
              const parentToken = form.get('parentToken') || `wali-${nis.slice(-4)}`;

              addSantri({
                id: `santri-${Date.now().toString().slice(-4)}`,
                nis,
                name,
                class: form.get('class'),
                halaqah: form.get('halaqah') || 'Ust. Pembina',
                room: form.get('room') || 'Asrama Santri',
                rfidTag: form.get('rfidTag') || `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
                barcode: form.get('barcode') || `ISB${nis}`,
                balance: Number(form.get('initialBalance')) || 0,
                parentName: form.get('parentName'),
                parentPhone,
                parentToken,
                spendingLimit: { type: 'daily', amount: 25000, active: true },
                spendingUsed: { daily: 0, weekly: 0, monthly: 0, lastResetDate: new Date().toISOString().split('T')[0] },
                pin: form.get('pin') || '1234',
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              });
              setIsAddSantriOpen(false);
            }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
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
                    placeholder="Nama santri..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-semibold"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Token Link Khusus Wali:</label>
                  <input
                    name="parentToken"
                    defaultValue={`wali-santri-${santriList.length + 1}`}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Kiosk / Wali (4-6 Digit):</label>
                  <input
                    name="pin"
                    defaultValue="1234"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Tag RFID Fisik:</label>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800 focus:bg-white focus:border-emerald-600 outline-none"
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

      {/* MODAL 3: EDIT SANTRI */}
      {editingSantri && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              updateSantri(editingSantri.id, {
                name: form.get('name'),
                nis: form.get('nis'),
                class: form.get('class'),
                room: form.get('room'),
                halaqah: form.get('halaqah'),
                parentName: form.get('parentName'),
                parentPhone: form.get('parentPhone'),
                parentToken: form.get('parentToken'),
                pin: form.get('pin'),
                rfidTag: form.get('rfidTag'),
                barcode: form.get('barcode'),
                balance: Number(form.get('balance'))
              });
              setEditingSantri(null);
            }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Edit Data Santri: {editingSantri.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSantri(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                  <input
                    name="name"
                    defaultValue={editingSantri.name}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS:</label>
                  <input
                    name="nis"
                    defaultValue={editingSantri.nis}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas:</label>
                  <input
                    name="class"
                    defaultValue={editingSantri.class}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kamar Asrama:</label>
                  <input
                    name="room"
                    defaultValue={editingSantri.room}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Wali Santri:</label>
                  <input
                    name="parentName"
                    defaultValue={editingSantri.parentName}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Wali:</label>
                  <input
                    name="parentPhone"
                    defaultValue={editingSantri.parentPhone}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Token Magic Link Wali:</label>
                  <input
                    name="parentToken"
                    defaultValue={editingSantri.parentToken}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Santri/Wali:</label>
                  <input
                    name="pin"
                    defaultValue={editingSantri.pin}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RFID Tag:</label>
                  <input
                    name="rfidTag"
                    defaultValue={editingSantri.rfidTag}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode:</label>
                  <input
                    name="barcode"
                    defaultValue={editingSantri.barcode}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saldo (Rp):</label>
                  <input
                    name="balance"
                    type="number"
                    defaultValue={editingSantri.balance}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSantri(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: FULL VIEW PROOF OF TRANSFER */}
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

      {/* MODAL 5: PRINTABLE SMARTCARD SANTRI */}
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

            {/* Smartcard Layout */}
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

              <div className="bg-white/95 p-2.5 rounded-xl text-slate-900 flex items-center justify-between mt-4">
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

      {/* MODAL 6: WHATSAPP DISPATCH MODAL */}
      <WhatsAppDispatchModal
        isOpen={whatsAppModal.isOpen}
        onClose={() => setWhatsAppModal({ ...whatsAppModal, isOpen: false })}
        title={whatsAppModal.title}
        recipientName={whatsAppModal.recipientName}
        initialPhone={whatsAppModal.initialPhone}
        defaultMessage={whatsAppModal.defaultMessage}
        onSavePhone={whatsAppModal.onSavePhone}
        showToast={showToast}
      />
    </div>
  );
}
