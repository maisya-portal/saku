import React, { useState } from 'react';
import { 
  Wallet, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Users, 
  Sliders, 
  Copy, 
  CheckCircle, 
  Send, 
  RefreshCw, 
  Receipt, 
  PhoneCall, 
  Utensils, 
  Shirt, 
  GraduationCap, 
  Info,
  Calendar,
  Lock,
  ChevronRight,
  Camera
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { openWhatsAppDirect } from '../utils/whatsapp';
import WhatsAppMessageModal from './WhatsAppMessageModal';
import AvatarEditorModal from './AvatarEditorModal';

export default function RoleWaliSantri() {
  const {
    pesantrenInfo,
    activeChildren,
    selectedChildId,
    setSelectedChildId,
    currentChild,
    transactions,
    topupRequests,
    submitTopupRequest,
    updateSpendingLimit,
    activeParentToken,
    showToast,
    updateSessionAvatar
  } = useApp();

  // Tab views within Wali Portal: 'overview' | 'topup' | 'limits' | 'history'
  const [activeTab, setActiveTab] = useState('overview');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // WhatsApp Message Modal State
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waModalData, setWaModalData] = useState({
    recipientName: '',
    recipientRole: '',
    phoneNumber: '',
    initialMessage: '',
    title: ''
  });

  // Transfer Category State: 'uang_saku' (auto Ustadz Firdhi) | 'spp' (auto Bapak Imawan)
  const [transferCategory, setTransferCategory] = useState('uang_saku');
  const [topupAmount, setTopupAmount] = useState('100000');
  const [topupProof, setTopupProof] = useState(null);
  const [topupNote, setTopupNote] = useState('');
  const [copiedAccount, setCopiedAccount] = useState('');
  const [submittingTopup, setSubmittingTopup] = useState(false);

  // Active Bank and WhatsApp Contact based on user selection
  const activeBank = transferCategory === 'spp'
    ? {
        bank: "Bank Syariah Indonesia (BSI)",
        accountNo: "6469965840",
        accountHolder: "Yayasan Pendidikan Imam Syafi'i Brebes",
        code: "451",
        label: "Rekening SPP & Pendidikan",
        purpose: "Pembayaran SPP Bulanan & Tagihan Pendidikan",
        contactName: "Bapak Imawan",
        contactWa: "62818275720",
        waRaw: "0818275720"
      }
    : {
        bank: "Bank Syariah Indonesia (BSI)",
        accountNo: "5221717173",
        accountHolder: "Ponpes Imam Syafii Brebes",
        code: "451",
        label: "Rekening Uang Saku Santri",
        purpose: "Jajan Kantin, Laundry, Wartel & Tarik Tunai",
        contactName: "Ustadz Firdhi",
        contactWa: "6281949682554",
        waRaw: "081949682554"
      };

  // Spending Limit Form State
  const [limitType, setLimitType] = useState(currentChild?.spendingLimit?.type || 'daily');
  const [limitAmount, setLimitAmount] = useState(currentChild?.spendingLimit?.amount || 20000);
  const [limitActive, setLimitActive] = useState(currentChild?.spendingLimit?.active ?? true);

  // Filter transactions for current selected child
  const childTransactions = transactions.filter(t => t.santriId === currentChild?.id);
  const childTopups = topupRequests.filter(t => t.santriId === currentChild?.id);

  // Copy account number
  const handleCopy = (accNo) => {
    navigator.clipboard.writeText(accNo);
    setCopiedAccount(accNo);
    showToast(`Nomor rekening ${accNo} berhasil disalin!`, 'info');
    setTimeout(() => setCopiedAccount(''), 3000);
  };

  // Handle proof upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTopupProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit topup
  const handleSubmitTopup = async (e) => {
    e.preventDefault();
    if (!currentChild) return;
    if (!topupAmount || Number(topupAmount) < 10000) {
      showToast('Nominal minimal transfer adalah Rp 10.000', 'error');
      return;
    }

    setSubmittingTopup(true);
    try {
      const req = await submitTopupRequest({
        santriId: currentChild.id,
        amount: Number(topupAmount),
        bankTarget: `${activeBank.bank} (${activeBank.accountNo})`,
        category: transferCategory,
        proofImageUrl: topupProof,
        note: topupNote
      });

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setActiveTab('overview');
      setTopupProof(null);
      setTopupNote('');

      // Create WhatsApp confirmation message targeted to specific officer
      const waMessage = transferCategory === 'spp'
        ? `Assalamu'alaikum Warahmatullahi Wabarakatuh Bapak Imawan (Bagian Keuangan SPP Ma'had Imam Syafi'i Brebes).\n\n` +
          `Saya Wali Santri dari ananda *${currentChild.name}* (NIS: ${currentChild.nis}).\n` +
          `Telah melakukan transfer *Pembayaran SPP / Pendidikan* sebesar *${formatRupiah(req.totalTransfer)}* ke Rekening SPP BSI *${activeBank.accountNo}* a.n. *${activeBank.accountHolder}*.\n` +
          `Kode Unik: *${req.uniqueCode}*\n` +
          `Catatan: ${topupNote || '-'}\n\n` +
          `Mohon dicatat dan dikonfirmasi pada sistem Maisya-Saku. Jazakumullahu khairan.`
        : `Assalamu'alaikum Warahmatullahi Wabarakatuh Ustadz Firdhi (Pengelola Uang Saku Ma'had Imam Syafi'i Brebes).\n\n` +
          `Saya Wali Santri dari ananda *${currentChild.name}* (NIS: ${currentChild.nis}).\n` +
          `Telah melakukan transfer *Uang Saku Santri* (Jajan/Laundry/Wartel/Tarik Tunai) sebesar *${formatRupiah(req.totalTransfer)}* ke Rekening Uang Saku BSI *${activeBank.accountNo}* a.n. *${activeBank.accountHolder}*.\n` +
          `Kode Unik: *${req.uniqueCode}*\n` +
          `Catatan: ${topupNote || '-'}\n\n` +
          `Mohon dibantu verifikasi saldo pada sistem Maisya-Saku. Jazakumullahu khairan.`;

      // Open preview and edit modal for WhatsApp confirmation
      setWaModalData({
        recipientName: activeBank.contactName,
        recipientRole: activeBank.label,
        phoneNumber: activeBank.contactWa,
        initialMessage: waMessage,
        title: `Konfirmasi ${transferCategory === 'spp' ? 'SPP' : 'Uang Saku'} (${activeBank.contactName})`
      });
      setWaModalOpen(true);

      showToast(`Permohonan tercatat! Silakan tinjau dan kirim via WhatsApp ${activeBank.contactName}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingTopup(false);
    }
  };

  // Save Spending Limit
  const handleSaveLimit = async () => {
    if (!currentChild) return;
    await updateSpendingLimit(currentChild.id, {
      type: limitType,
      amount: Number(limitAmount),
      active: limitActive
    });
    setActiveTab('overview');
  };

  // Render Category Icon for transactions
  const renderTxIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-5 h-5 text-sky-600" />;
      case 'PURCHASE_KANTIN':
        return <Utensils className="w-5 h-5 text-amber-600" />;
      case 'LAUNDRY':
        return <Shirt className="w-5 h-5 text-sky-600" />;
      case 'TELPON':
        return <PhoneCall className="w-5 h-5 text-indigo-600" />;
      case 'SPP':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      default:
        return <Receipt className="w-5 h-5 text-slate-600" />;
    }
  };

  if (!currentChild) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-800">Data Santri Tidak Ditemukan</h3>
        <p className="text-sm text-slate-500">Tautan unik wali santri tidak memiliki santri terdaftar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner / Welcome with Multi-Child Switcher */}
      <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Islamic arabesque decorative accent */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-xl" />
        <div className="absolute right-8 bottom-4 text-sky-200/10 text-9xl font-serif font-black select-none pointer-events-none">
          ISB
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-sky-100 mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Portal Keuangan Khusus Wali Santri</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ahlan wa Sahlan, {currentChild.parentName}
              </h2>
              <p className="text-sky-100/90 text-sm mt-1">
                {pesantrenInfo.name} • Akses Aman Terverifikasi
              </p>
            </div>

            {/* Live Data Badge */}
            <div className="flex items-center gap-2 self-start sm:self-center bg-sky-900/60 backdrop-blur-md border border-sky-400/30 px-3 py-1.5 rounded-2xl text-xs font-medium text-sky-200">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
              <span>Sinkronisasi Realtime</span>
            </div>
          </div>

          {/* Sibling Switcher: If parent has more than 1 child */}
          {activeChildren.length > 1 ? (
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 mb-6">
              <div className="text-xs font-semibold text-sky-100 mb-2 px-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-200" />
                <span>Pilih Ananda ({activeChildren.length} Santri Terdaftar Dalam 1 Akun Anda):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeChildren.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setSelectedChildId(child.id);
                      setLimitType(child.spendingLimit?.type || 'daily');
                      setLimitAmount(child.spendingLimit?.amount || 20000);
                      setLimitActive(child.spendingLimit?.active ?? true);
                      playSound('beep');
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      selectedChildId === child.id
                        ? 'bg-white text-sky-900 shadow-md font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white font-medium'
                    }`}
                  >
                    <img
                      src={child.avatar}
                      alt={child.name}
                      className="w-10 h-10 rounded-xl object-cover border border-sky-300/40"
                    />
                    <div className="overflow-hidden">
                      <div className="truncate text-sm">{child.name}</div>
                      <div className="text-xs opacity-90">{child.class} • Nomor ISB: <span className="font-mono font-bold">{child.nis}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/10 px-4 py-2.5 rounded-2xl text-xs text-sky-100 mb-6 border border-white/15">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="relative group cursor-pointer focus:outline-none shrink-0"
                  title="Klik untuk ganti foto avatar ananda"
                >
                  <img
                    src={currentChild.avatar || './logo-maisya.jpg'}
                    alt={currentChild.name}
                    className="w-10 h-10 rounded-xl object-cover border border-white/40 shadow-xs"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-85 group-hover:scale-110 transition-all border border-white">
                    <Camera className="w-2.5 h-2.5" />
                  </span>
                </button>
                <div>
                  <div className="font-bold text-white text-sm">{currentChild.name}</div>
                  <div className="opacity-90">{currentChild.class} • Nomor ISB: <strong className="font-mono text-white">{currentChild.nis}</strong></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-sky-200" />
                <span>Ganti Foto Avatar</span>
              </button>
            </div>
          )}

          {/* Main Balance Display */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-wider text-sky-200 uppercase">
                Saldo Uang Saku Digital Ananda
              </div>
              <div className="text-3xl sm:text-5xl font-black text-white mt-1 tracking-tight">
                {formatRupiah(currentChild.balance)}
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-sky-100">
                <span className="bg-sky-900/60 px-2.5 py-1 rounded-lg border border-sky-400/30">
                  {currentChild.room}
                </span>
                <span>Halaqah: {currentChild.halaqah}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('topup')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 dark:text-white font-bold px-5 py-3 rounded-2xl shadow-lg transition-transform active:scale-95"
              >
                <ArrowDownLeft className="w-5 h-5 text-slate-900 dark:text-white" />
                <span>+ Isi Saldo / Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('limits')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-3 rounded-2xl border border-white/30 backdrop-blur-md transition-all active:scale-95"
              >
                <Sliders className="w-5 h-5" />
                <span>Atur Limit Jajan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Ringkasan & Jajan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('topup')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'topup'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Kirim Bukti Transfer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('limits')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'limits'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Kontrol Pembatasan Jajan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Riwayat Semua Transaksi ({childTransactions.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & LIVE SPENDING WATCH */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Spending Limit Status Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Kontrol Batas Belanja Oleh Wali Santri</h4>
                  <p className="text-xs text-slate-500">
                    Sistem otomatis menolak transaksi jika melebihi aturan yang Anda tetapkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('limits')}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 self-start sm:self-center"
              >
                Ubah Pengaturan ⚙️
              </button>
            </div>

            {currentChild.spendingLimit?.active ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Aturan Pembatasan</div>
                  <div className="text-sm font-bold text-slate-800 uppercase mt-0.5">
                    Maks. {formatRupiah(currentChild.spendingLimit.amount)} / {currentChild.spendingLimit.type === 'daily' ? 'Hari' : currentChild.spendingLimit.type === 'weekly' ? 'Pekan' : 'Bulan'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Terpakai Hari Ini</div>
                  <div className="text-sm font-bold text-amber-700 mt-0.5">
                    {formatRupiah(currentChild.spendingUsed?.daily || 0)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Sisa Jatah Belanja Hari Ini</div>
                  <div className="text-sm font-bold text-sky-700 mt-0.5">
                    {formatRupiah(Math.max(0, currentChild.spendingLimit.amount - (currentChild.spendingUsed?.daily || 0)))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs flex items-center justify-between">
                <span>Santri bebas belanja tanpa batasan nominal harian/pekanan.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('limits')}
                  className="font-bold underline text-amber-800"
                >
                  Aktifkan Batasan Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Pending Top-Up Alerts (Realtime Notification for Parents) */}
          {childTopups.some(t => t.status === 'PENDING') && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-400/40 rounded-3xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-amber-600 animate-spin mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-sm">
                    Konfirmasi Transfer Anda Sedang Diverifikasi Bendahara
                  </h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Sistem mendeteksi setoran uang saku baru. Begitu Bendahara menekan persetujuan, saldo ananda akan otomatis bertambah detik itu juga.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {childTopups.filter(t => t.status === 'PENDING').map(t => (
                      <div key={t.id} className="bg-white px-3 py-1.5 rounded-xl border border-amber-300 font-semibold text-slate-800">
                        {formatRupiah(t.amount)} ({t.bankTarget}) • Kode: {t.uniqueCode}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approved Top-Up Celebrations */}
          {childTopups.some(t => t.status === 'APPROVED') && (
            <div className="bg-sky-50 border border-sky-200 rounded-3xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-sky-600" />
                <span className="text-xs font-semibold text-sky-900">
                  Transfer terbaru Anda telah diverifikasi & masuk ke saldo santri!
                </span>
              </div>
              <span className="text-xs text-sky-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-sky-200">
                Saldo Updated
              </span>
            </div>
          )}

          {/* Recent Spending Activities (Itemized) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Aktivitas Penggunaan Uang Santri Terbaru</span>
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {childTransactions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada transaksi uang saku untuk santri ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {childTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                        {renderTxIcon(tx.type)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {tx.categoryLabel || tx.type}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tx.note || (tx.items?.map(it => `${it.name} (${it.qty}x)`).join(', ') || '-')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(tx.timestamp)} • Verifikasi: {tx.verificationMethod}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        tx.type === 'DEPOSIT' ? 'text-sky-600' : 'text-slate-900 dark:text-white'
                      }`}>
                        {tx.type === 'DEPOSIT' ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Sisa: {formatRupiah(tx.currentBalance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSFER SALDO UANG SAKU & PEMBAYARAN SPP */}
      {activeTab === 'topup' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Rekening Resmi Ma'had Imam Syafi'i Brebes</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Transfer Dana untuk Ananda: {currentChild.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih peruntukan transfer Anda di bawah. Rekening tujuan dan nomor konfirmasi WhatsApp pengurus akan otomatis disesuaikan.
            </p>
          </div>

          {/* 1. Category Switcher (Uang Saku vs SPP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTransferCategory('uang_saku')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                transferCategory === 'uang_saku'
                  ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                  transferCategory === 'uang_saku'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  1. Uang Saku Santri
                </span>
                {transferCategory === 'uang_saku' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse" />
                )}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                Jajan, Laundry, Wartel & Tarik Tunai
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Konfirmasi Otomatis: <strong>Ustadz Firdhi</strong>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTransferCategory('spp')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                transferCategory === 'spp'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                  transferCategory === 'spp'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  2. SPP & Tagihan Pendidikan
                </span>
                {transferCategory === 'spp' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                )}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                SPP Bulanan, Syahriyah & Sarpras
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Konfirmasi Otomatis: <strong>Bapak Imawan</strong>
              </div>
            </button>
          </div>

          {/* 2. Official Bank Account Card (Auto Updated) */}
          <div className={`p-5 rounded-3xl border-2 transition-all ${
            transferCategory === 'spp'
              ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
              : 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {activeBank.bank} (Kode: {activeBank.code})
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  transferCategory === 'spp' ? 'bg-purple-600 text-white' : 'bg-sky-600 text-white'
                }`}>
                  {activeBank.label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(activeBank.accountNo)}
                className="text-xs text-slate-700 dark:text-slate-200 hover:text-sky-600 flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs self-start sm:self-auto"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedAccount === activeBank.accountNo ? 'Tersalin!' : 'Salin Nomor Rekening'}</span>
              </button>
            </div>

            <div className={`text-2xl sm:text-3xl font-mono font-black tracking-wider select-all my-1 ${
              transferCategory === 'spp' ? 'text-purple-700 dark:text-purple-300' : 'text-sky-700 dark:text-sky-300'
            }`}>
              {activeBank.accountNo}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Atas Nama: <strong className="text-slate-900 dark:text-white">{activeBank.accountHolder}</strong>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Kontak Konfirmasi WhatsApp:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {activeBank.contactName} ({activeBank.waRaw})
              </strong>
            </div>
          </div>

          {/* 3. Nominal Fast Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Pilih Nominal {transferCategory === 'spp' ? 'Pembayaran SPP' : 'Uang Saku'}:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(transferCategory === 'spp' 
                ? [250000, 350000, 500000, 750000]
                : [50000, 100000, 200000, 500000]
              ).map((nominal) => (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => setTopupAmount(String(nominal))}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    topupAmount === String(nominal)
                      ? (transferCategory === 'spp' ? 'bg-purple-600 text-white border-purple-700 shadow-sm' : 'bg-sky-600 text-white border-sky-700 shadow-sm')
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {formatRupiah(nominal)}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="10000"
                step="5000"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="Atau masukkan nominal custom..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
              />
            </div>
          </div>

          {/* 4. Proof of Transfer Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Unggah Foto / Tangkapan Layar Bukti Transfer:
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {topupProof ? (
                <div className="flex flex-col items-center">
                  <img
                    src={topupProof}
                    alt="Bukti Transfer"
                    className="max-h-48 rounded-xl object-contain border border-slate-300 dark:border-slate-700 mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => setTopupProof(null)}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Ganti Foto Bukti
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block py-4">
                  <ArrowUpRight className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-400 block">
                    Pilih File Foto Bukti Transfer
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Struk ATM, m-Banking (BSI Mobile / bank lain), atau QRIS
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* 5. Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Transfer (Opsional):
            </label>
            <input
              type="text"
              value={topupNote}
              onChange={(e) => setTopupNote(e.target.value)}
              placeholder={transferCategory === 'spp' ? "Contoh: SPP Bulan Oktober 2026" : "Contoh: Uang saku jajan pekan ke-3 & laundry"}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
            />
          </div>

          {/* 6. Submit Button Routed Specifically */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmitTopup}
              disabled={submittingTopup}
              className={`w-full text-white font-bold py-3.5 rounded-2xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm ${
                transferCategory === 'spp'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {transferCategory === 'spp'
                  ? `Kirim Konfirmasi SPP ke WhatsApp ${activeBank.contactName} (${activeBank.waRaw})`
                  : `Kirim Konfirmasi Uang Saku ke WhatsApp ${activeBank.contactName} (${activeBank.waRaw})`}
              </span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Sistem akan otomatis membuka WhatsApp resmi penanggung jawab dan mencatat antrean verifikasi di portal.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: SPENDING LIMIT CONTROLLER */}
      {activeTab === 'limits' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Proteksi Keuangan Santri</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Pengaturan Pembatasan Jajan: {currentChild.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Orang tua memiliki kontrol penuh. Saat santri bertransaksi di kantin, laundry, atau lainnya, sistem akan mengecek limit ini. Jika melewati batas, transaksi langsung DITOLAK.
            </p>
          </div>

          {/* Active Limit Switch */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-slate-800">
                Aktifkan Batasan Belanja
              </div>
              <div className="text-xs text-slate-500">
                Matikan jika ingin ananda bisa belanja tanpa batas nominal
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={limitActive}
                onChange={(e) => setLimitActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {limitActive && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Periode Batasan:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'daily', label: 'Batas Per Hari', sub: 'Reset tiap pukul 00:00' },
                    { id: 'weekly', label: 'Batas Per Pekan', sub: 'Reset tiap Senin' },
                    { id: 'monthly', label: 'Batas Per Bulan', sub: 'Reset awal bulan' }
                  ].map((period) => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setLimitType(period.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        limitType === period.id
                          ? 'border-sky-600 bg-sky-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`text-xs font-bold ${
                        limitType === period.id ? 'text-sky-900' : 'text-slate-800'
                      }`}>
                        {period.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {period.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Nominal Maksimal Jajan ({limitType === 'daily' ? 'Per Hari' : limitType === 'weekly' ? 'Per Pekan' : 'Per Bulan'}):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {(limitType === 'daily'
                    ? [15000, 20000, 25000, 35000]
                    : limitType === 'weekly'
                    ? [75000, 100000, 150000, 200000]
                    : [300000, 450000, 600000, 800000]
                  ).map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setLimitAmount(nom)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        Number(limitAmount) === nom
                          ? 'bg-sky-600 text-white border-sky-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {formatRupiah(nom)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="Masukkan batas nominal custom..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveLimit}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-transform active:scale-98 text-sm"
            >
              Simpan Pengaturan Batasan
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: FULL TRANSACTION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Riwayat Transaksi: {currentChild.name}
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">
              Total {childTransactions.length} Transaksi
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {childTransactions.map((tx) => (
              <div key={tx.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {renderTxIcon(tx.type)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {tx.categoryLabel || tx.type}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {tx.note || (tx.items?.map(it => `${it.name} (${it.qty}x)`).join(', ') || '-')}
                    </div>
                    {tx.items && tx.items.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {tx.items.map((it, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md">
                            {it.name} • {it.qty}x ({formatRupiah(it.price)})
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 mt-1">
                      {formatDateTime(tx.timestamp)} • Petugas: {tx.cashierName} • Verifikasi: {tx.verificationMethod}
                    </div>
                  </div>
                </div>
                <div className="text-right sm:self-center pl-12 sm:pl-0">
                  <div className={`text-base font-black ${
                    tx.type === 'DEPOSIT' ? 'text-sky-600' : 'text-slate-900 dark:text-white'
                  }`}>
                    {tx.type === 'DEPOSIT' ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                  </div>
                  <div className="text-xs text-slate-400">
                    Saldo Akhir: {formatRupiah(tx.currentBalance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Message Confirmation Modal */}
      <WhatsAppMessageModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        recipientName={waModalData.recipientName}
        recipientRole={waModalData.recipientRole}
        phoneNumber={waModalData.phoneNumber}
        initialMessage={waModalData.initialMessage}
        title={waModalData.title}
      />

      {/* Avatar Editor Modal for Wali Santri */}
      <AvatarEditorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={currentChild?.avatar}
        onSaveAvatar={updateSessionAvatar}
        title={`Ganti Foto Profil: ${currentChild?.name || 'Santri'}`}
      />
    </div>
  );
}
