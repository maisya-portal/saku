import React, { useState, useMemo } from 'react';
import { 
  EyeOff,
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
  Landmark,
  Fingerprint,
  Clock,
  RotateCcw,
  CheckCircle,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  UserPlus,
  UserX,
  Camera,
  Briefcase,
  LayoutGrid,
  Table as TableIcon,
  Copy,
  AlertCircle,
  Info
} from 'lucide-react';
import { useApp, formatRupiah, formatDateTime, playSound } from '../context/AppContext';
import { openWhatsAppDirect, formatPhoneNumber } from '../utils/whatsapp';
import { 
  getSavedFirebaseConfig, 
  saveFirebaseConfig, 
  isDemoMode, 
  setDemoMode 
} from '../services/firebase';
import confetti from 'canvas-confetti';
import WhatsAppDispatchModal from './WhatsAppDispatchModal';
import PetugasBiometricRegisterModal from './PetugasBiometricRegisterModal';
import AvatarEditorModal from './AvatarEditorModal';
import BiometricTouchPad from './BiometricTouchPad';
import InitialsAvatar from './InitialsAvatar';

export default function RoleAdminBendahara() {
  const {
    pesantrenInfo,
    updatePesantrenInfo,
    santriList,
    setSantriList,
    addSantri,
    updateSantri,
    deleteSantri,
    deleteTransaction,
    editTransaction,
    roleAccounts,
    updateRoleAccount,
    addRoleAccount,
    deleteRoleAccount,
    transactions,
    topupRequests,
    approveTopup,
    rejectTopup,
    deleteTopupRequest,
    editTopupRequest,
    purgeOrphanTopups,
    approveFingerprint,
    approveAllPendingFingerprints,
    rejectFingerprint,
    resetFingerprint,
    deleteWaliAccount,
    rejectWaliAccount,
    registerWaliSantri,
    updateWaliAccount,
    registerSantriBiometric,
    updateSantriBiometric,
    resetSantriBiometric,
    approveStaffBiometric,
    rejectStaffBiometric,
    updateAdminPassword,
    updateSessionAvatar,
    showToast
  } = useApp();

  // Active Tab: 'roles' | 'wali' | 'santri' | 'biometric' | 'approvals' | 'settings' | 'reports' | 'firebase'
  const [activeAdminTab, setActiveAdminTab] = useState('roles');
  
  // Role / User Petugas States
  const [roleViewMode, setRoleViewMode] = useState('table'); // 'table' | 'cards'
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);

  // Wali Santri Tab States
  const [waliViewMode, setWaliViewMode] = useState('table'); // 'table' | 'cards'
  const [waliFilter, setWaliFilter] = useState('all'); // 'all' | 'unapproved' | 'pending' | 'approved' | 'rejected'
  const [waliSearch, setWaliSearch] = useState('');
  const [isAddWaliOpen, setIsAddWaliOpen] = useState(false);
  const [newWaliChildren, setNewWaliChildren] = useState([
    { name: '', isb: '', class: 'Santri Baru', room: 'Asrama Santri' }
  ]);
  const [editingWali, setEditingWali] = useState(null);

  // Santri Biometric Tab States
  const [biometricViewMode, setBiometricViewMode] = useState('table'); // 'table' | 'cards'
  const [santriBiometricFilter, setSantriBiometricFilter] = useState('all'); // 'all' | 'unregistered' | 'registered' | 'with_wali' | 'without_wali'
  const [biometricSearch, setBiometricSearch] = useState('');
  const [editingBiometricSantri, setEditingBiometricSantri] = useState(null);
  const [deletingBiometricSantri, setDeletingBiometricSantri] = useState(null);

  // Top-Up Approval Tab States (Terikat Wali, Edit & Hapus Antrean)
  const [topupFilter, setTopupFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'orphan'
  const [topupSearch, setTopupSearch] = useState('');
  const [editingTopup, setEditingTopup] = useState(null);
  const [deletingTopup, setDeletingTopup] = useState(null);

  const [biometricFilter, setBiometricFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [biometricSubTab, setBiometricSubTab] = useState('wali'); // 'wali' | 'staff'

  // Modals for Petugas Biometric & Avatar
  const [isStaffRegisterModalOpen, setIsStaffRegisterModalOpen] = useState(false);
  const [avatarModalState, setAvatarModalState] = useState({
    isOpen: false,
    targetId: null,
    targetType: null, // 'santri' | 'role'
    currentAvatar: ''
  });
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [isChangingAdminPass, setIsChangingAdminPass] = useState(false);

  // Grouped Wali Santri for Biometric Verification
  const waliBiometricList = useMemo(() => {
    const map = new Map();
    santriList.forEach(s => {
      if (!s.parentToken) return;
      if (!map.has(s.parentToken)) {
        map.set(s.parentToken, {
          parentToken: s.parentToken,
          parentName: s.parentName || 'Wali Santri',
          parentPhone: s.parentPhone || '',
          bindingLockCode: s.bindingLockCode || `BIND-ISB-${s.parentToken.toUpperCase()}`,
          bindingStatus: s.bindingStatus || (s.fingerprintStatus === 'APPROVED' ? 'LOCKED' : 'PENDING_APPROVAL'),
          isLocked: s.isLocked ?? (s.fingerprintStatus === 'APPROVED'),
          fingerprintCode: s.fingerprintCode || null,
          pin: s.pin || '1234',
          fingerprintStatus: s.fingerprintStatus || 'NOT_REGISTERED',
          fingerprintRegisteredAt: s.fingerprintRegisteredAt || null,
          fingerprintApprovedAt: s.fingerprintApprovedAt || null,
          fingerprintApprovalNote: s.fingerprintApprovalNote || null,
          children: []
        });
      }
      map.get(s.parentToken).children.push(s);
    });
    return Array.from(map.values());
  }, [santriList]);

  const pendingBiometricCount = waliBiometricList.filter(w => w.fingerprintStatus === 'PENDING_APPROVAL').length;
  const unapprovedWaliCount = waliBiometricList.filter(w => w.fingerprintStatus !== 'APPROVED').length;
  const rejectedWaliCount = waliBiometricList.filter(w => w.fingerprintStatus === 'REJECTED').length;
  const staffAccounts = useMemo(() => roleAccounts.filter(r => r.role !== 'admin'), [roleAccounts]);
  const pendingStaffCount = staffAccounts.filter(s => s.biometricStatus === 'PENDING_APPROVAL').length;

  // WhatsApp Dispatch Modal State
  const [whatsAppModal, setWhatsAppModal] = useState({
    isOpen: false,
    title: '',
    recipientName: '',
    initialPhone: '',
    defaultMessage: '',
    onSavePhone: null
  });

  // Transaction CRUD States
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [showAddSantriPass, setShowAddSantriPass] = useState(false);

  // Biometric & Submission States
  const [selectedSantriForBiometric, setSelectedSantriForBiometric] = useState(null);
  const [rejectingWali, setRejectingWali] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Data wali santri / santri tidak sesuai catatan');
  const [deletingWali, setDeletingWali] = useState(null);

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

  // Top-Up Lists & Status Filtering
  const pendingTopups = useMemo(() => topupRequests.filter(t => t.status === 'PENDING'), [topupRequests]);
  const approvedTopups = useMemo(() => topupRequests.filter(t => t.status === 'APPROVED'), [topupRequests]);
  const rejectedTopups = useMemo(() => topupRequests.filter(t => t.status === 'REJECTED'), [topupRequests]);
  const pastTopups = useMemo(() => topupRequests.filter(t => t.status !== 'PENDING'), [topupRequests]);

  // Antrean Yatim (Akun wali atau santrinya sudah terhapus dari sistem)
  const orphanTopups = useMemo(() => {
    const validSantriIds = new Set(santriList.map(s => s.id));
    const validSantriNis = new Set(santriList.map(s => s.nis).filter(Boolean));
    const validParentTokens = new Set(santriList.map(s => s.parentToken).filter(Boolean));

    return topupRequests.filter(t => {
      const matchId = t.santriId && validSantriIds.has(t.santriId);
      const matchNis = t.santriNis && validSantriNis.has(t.santriNis);
      const matchParent = t.parentToken && validParentTokens.has(t.parentToken);
      return !matchId && !matchNis && !matchParent;
    });
  }, [topupRequests, santriList]);

  // Antrean Terfilter Berdasarkan Tab Filter & Search
  const filteredTopups = useMemo(() => {
    let list = topupRequests;
    if (topupFilter === 'pending') list = pendingTopups;
    else if (topupFilter === 'approved') list = approvedTopups;
    else if (topupFilter === 'rejected') list = rejectedTopups;
    else if (topupFilter === 'orphan') list = orphanTopups;

    if (!topupSearch || !topupSearch.trim()) return list;
    const term = topupSearch.toLowerCase().trim();
    return list.filter(t => 
      (t.santriName || '').toLowerCase().includes(term) ||
      (t.santriNis || '').toLowerCase().includes(term) ||
      (t.parentName || '').toLowerCase().includes(term) ||
      (t.parentPhone || '').includes(term) ||
      (t.bankTarget || '').toLowerCase().includes(term) ||
      String(t.uniqueCode || '').includes(term) ||
      String(t.amount || '').includes(term)
    );
  }, [topupRequests, topupFilter, topupSearch, pendingTopups, approvedTopups, rejectedTopups, orphanTopups]);

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
    setWhatsAppModal({
      isOpen: true,
      title: 'Kirim Magic Link ke Petugas',
      recipientName: `${roleAcc.name} (${roleAcc.title})`,
      initialPhone: roleAcc.phone || '',
      token: roleAcc.token,
      pin: roleAcc.pin,
      isRole: true,
      onSavePhone: (newPhone) => {
        updateRoleAccount(roleAcc.id, { phone: newPhone });
      }
    });
  };

  // Generate WhatsApp Magic Link for Wali Santri (Opens editable modal)
  const handleSendWaliMagicLink = (santri) => {
    const siblings = santriList.filter(s => s.parentToken === santri.parentToken);
    const siblingsName = siblings.map(s => s.name).join(' & ');

    setWhatsAppModal({
      isOpen: true,
      title: 'Kirim Magic Link ke Wali Santri',
      recipientName: `${santri.parentName} (Wali dari ${siblingsName})`,
      initialPhone: santri.parentPhone || '',
      token: santri.parentToken,
      pin: santri.pin || '1234',
      isRole: false,
      onSavePhone: (newPhone) => {
        updateSantri(santri.id, { parentPhone: newPhone });
      }
    });
  };

  const filteredSantri = santriList.filter(s => {
    if (!s) return false;
    const term = (santriSearch || '').toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.nis || '').includes(term) ||
      (s.class || '').toLowerCase().includes(term) ||
      (s.parentName || '').toLowerCase().includes(term)
    );
  });

  // Filtered Wali Santri for Wali Tab
  const filteredWaliList = useMemo(() => {
    return waliBiometricList.filter(w => {
      if (waliFilter === 'unapproved' && w.fingerprintStatus === 'APPROVED') return false;
      if (waliFilter === 'pending' && w.fingerprintStatus !== 'PENDING_APPROVAL') return false;
      if (waliFilter === 'approved' && w.fingerprintStatus !== 'APPROVED') return false;
      if (waliFilter === 'rejected' && w.fingerprintStatus !== 'REJECTED') return false;

      if (waliSearch) {
        const term = waliSearch.toLowerCase();
        const matchParent = (w.parentName || '').toLowerCase().includes(term);
        const matchPhone = (w.parentPhone || '').includes(term);
        const matchToken = (w.parentToken || '').toLowerCase().includes(term);
        const matchChild = w.children.some(c => 
          (c.name || '').toLowerCase().includes(term) ||
          (c.nis || '').toLowerCase().includes(term) ||
          (c.class || '').toLowerCase().includes(term)
        );
        return matchParent || matchPhone || matchToken || matchChild;
      }
      return true;
    });
  }, [waliBiometricList, waliFilter, waliSearch]);

  // Filtered Santri for Dedicated Biometric Tab
  const filteredBiometricSantri = useMemo(() => {
    return santriList.filter(s => {
      const isRegistered = s.biometricStatus === 'APPROVED' || s.biometricRegistered;
      const hasWali = Boolean(s.parentToken);

      if (santriBiometricFilter === 'unregistered' && isRegistered) return false;
      if (santriBiometricFilter === 'registered' && !isRegistered) return false;
      if (santriBiometricFilter === 'with_wali' && !hasWali) return false;
      if (santriBiometricFilter === 'without_wali' && hasWali) return false;

      if (biometricSearch) {
        const term = biometricSearch.toLowerCase();
        const matchName = (s.name || '').toLowerCase().includes(term);
        const matchNis = (s.nis || '').includes(term);
        const matchClass = (s.class || '').toLowerCase().includes(term);
        const matchParent = (s.parentName || '').toLowerCase().includes(term);
        const matchFp = (s.biometricCode || s.fingerprintCode || '').toLowerCase().includes(term);
        return matchName || matchNis || matchClass || matchParent || matchFp;
      }
      return true;
    });
  }, [santriList, santriBiometricFilter, biometricSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 px-3.5 py-1 rounded-full text-xs font-bold border border-sky-500/30 mb-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
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
          <div className="text-[11px] text-sky-300 font-semibold">Status Sistem:</div>
          <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
            <span className={`w-2.5 h-2.5 rounded-full ${demoState ? 'bg-amber-400' : 'bg-sky-400 animate-pulse'}`} />
            <span>{demoState ? 'Lokal Sync Realtime' : 'Cloud Firestore Aktif'}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Total Saldo Santri</div>
          <div className="text-base font-black text-sky-700 mt-1">{formatRupiah(totalSantriBalance)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{santriList.length} Santri Aktif</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Total Setoran Masuk</div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-1">{formatRupiah(totalDeposits)}</div>
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
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'roles'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>🔐 Hak Akses Petugas</span>
          <span className="bg-sky-500/30 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            {roleAccounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('wali')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'wali'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Akun Wali Santri</span>
          <span className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {waliBiometricList.length}
          </span>
          {unapprovedWaliCount > 0 && (
            <span className="ml-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {unapprovedWaliCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('santri')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'santri'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          👥 Database Santri & Smartcard ({santriList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('biometric')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'biometric'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Biometrik Santri</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {santriList.filter(s => s.biometricStatus === 'APPROVED' || s.biometricRegistered).length}/{santriList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'approvals'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>📥 Persetujuan Top-Up</span>
          {pendingTopups.length > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendingTopups.length}
            </span>
          )}
          {orphanTopups.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full" title={`${orphanTopups.length} antrean akun terhapus`}>
              {orphanTopups.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeAdminTab === 'settings'
              ? 'bg-sky-700 text-white shadow-sm'
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
              ? 'bg-sky-700 text-white shadow-sm'
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
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          ☁️ Firebase Cloud
        </button>
      </div>

      {/* TAB 1: MANAJEMEN ROLE PETUGAS & MAGIC LINKS */}
      {activeAdminTab === 'roles' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pengaturan Hak Akses & Kredensial Setiap Role
                </h3>
                <span className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {roleAccounts.length} Akun Petugas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aplikasi tidak memunculkan tombol login umum. Seluruh petugas masuk menggunakan <strong>Magic Link Resmi</strong> dan otorisasi <strong>PIN / Sidik Jari Layar Sentuh</strong>.
              </p>
            </div>

            {/* Controls: View Mode & Tambah User Petugas */}
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
              {/* Toggle View Mode: Tabel vs Kartu */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRoleViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    roleViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Tampilkan dalam bentuk Tabel"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    roleViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Tampilkan dalam bentuk Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
              </div>

              {/* Tombol Tambah User Petugas Baru */}
              <button
                type="button"
                onClick={() => setIsAddRoleOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah User Petugas</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: TABEL PETUGAS */}
          {roleViewMode === 'table' && (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nama Petugas</th>
                    <th className="py-3 px-4">Role & Jabatan</th>
                    <th className="py-3 px-4">Kontak WhatsApp</th>
                    <th className="py-3 px-4">Kredensial & Biometrik</th>
                    <th className="py-3 px-4">Token & Magic Link</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {roleAccounts.map((acc) => {
                    const baseUrl = window.location.origin + window.location.pathname;
                    const magicUrl = `${baseUrl}#token=${acc.token}`;
                    const isSuperAdmin = acc.role === 'admin';
                    const isProtected = isSuperAdmin && (acc.id === 'role-admin' || roleAccounts.filter(r => r.role === 'admin').length <= 1);

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative group shrink-0">
                              <InitialsAvatar
                                name={acc.name}
                                src={acc.avatar}
                                className="w-10 h-10 text-xs"
                                rounded="rounded-xl"
                              />
                              <button
                                type="button"
                                onClick={() => setAvatarModalState({
                                  isOpen: true,
                                  targetId: acc.id,
                                  targetType: 'role',
                                  currentAvatar: acc.avatar
                                })}
                                className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 rounded-full text-slate-600 hover:text-sky-600 shadow-xs"
                                title="Ganti Foto Avatar"
                              >
                                <Camera className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{acc.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {acc.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-block ${
                              acc.role === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            }`}>
                              {acc.role}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingRole(acc)}
                              className="text-slate-400 hover:text-sky-600 p-0.5 rounded cursor-pointer"
                              title="Edit Role & Jabatan ini"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{acc.title}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {acc.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span>{acc.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleSendRoleMagicLink(acc)}
                                className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold underline cursor-pointer"
                                title="Kirim Magic Link via WhatsApp"
                              >
                                (Kirim WA)
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belum diisi</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {isSuperAdmin ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-bold">Password:</span>
                                <span className="font-mono font-black text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800 text-[11px]">
                                  {acc.pin || acc.password || 'iftahadmin87'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">🛡️ Super Admin login password</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500">PIN:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                  {acc.pin}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  acc.biometricStatus === 'APPROVED'
                                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {acc.biometricStatus === 'APPROVED' ? '✓ Biometrik Aktif' : 'Menunggu'}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                  {acc.fingerprintCode || `FP-STAFF-${acc.role.toUpperCase()}`}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 inline-block mb-1">
                            #{acc.token}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px] font-mono">
                            {magicUrl}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(magicUrl);
                                showToast(`Magic link untuk ${acc.name} disalin!`, 'info');
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Salin Magic Link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendRoleMagicLink(acc)}
                              className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-xs"
                              title="Kirim ke WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingRole(acc)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-sky-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Ubah Kredensial & Info"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Hapus User Petugas */}
                            {isProtected ? (
                              <button
                                type="button"
                                disabled
                                className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                title="Super Admin Utama Terlindungi (Tidak Dapat Dihapus)"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingRole(acc)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Hapus User Petugas Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW MODE 2: KARTU GRID PETUGAS */}
          {roleViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleAccounts.map((acc) => {
                const baseUrl = window.location.origin + window.location.pathname;
                const magicUrl = `${baseUrl}#token=${acc.token}`;
                const isSuperAdmin = acc.role === 'admin';
                const isProtected = isSuperAdmin && (acc.id === 'role-admin' || roleAccounts.filter(r => r.role === 'admin').length <= 1);

                return (
                  <div key={acc.id} className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-sky-500/50 hover:shadow-md transition-all space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <InitialsAvatar
                            name={acc.name}
                            src={acc.avatar}
                            className="w-12 h-12 text-sm"
                            rounded="rounded-2xl"
                          />
                          <button
                            type="button"
                            onClick={() => setAvatarModalState({
                              isOpen: true,
                              targetId: acc.id,
                              targetType: 'role',
                              currentAvatar: acc.avatar
                            })}
                            className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-full text-slate-600 hover:text-sky-600 shadow-xs cursor-pointer"
                            title="Ganti Foto Avatar"
                          >
                            <Camera className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{acc.name}</h4>
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {acc.role}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{acc.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">WA: {acc.phone || '-'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingRole(acc)}
                          className="p-2 rounded-xl text-slate-500 hover:text-sky-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Ubah Kredensial"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Tombol Hapus User Petugas di Kartu */}
                        {!isProtected && (
                          <button
                            type="button"
                            onClick={() => setDeletingRole(acc)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Hapus Akun User Petugas Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Token & PIN / Password Credentials */}
                    <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      {isSuperAdmin ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-500 font-bold">Password Super Admin:</span>
                            <span className="font-mono font-black text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                              {acc.pin || acc.password || 'iftahadmin87'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            🛡️ Super Admin login khusus dengan password ini (tanpa biometrik).
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Status Biometrik:</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              acc.biometricStatus === 'APPROVED'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {acc.biometricStatus === 'APPROVED' ? 'Wajib Login Biometrik' : 'Menunggu Persetujuan'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Kode Sidik Jari:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                              {acc.fingerprintCode || `FP-STAFF-${acc.role.toUpperCase()}`}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-850">
                        <span className="text-slate-500">Token Magic Link:</span>
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded">
                          #{acc.token}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 truncate pt-0.5 font-mono">
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
                        className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 text-center cursor-pointer"
                      >
                        Salin Link
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendRoleMagicLink(acc)}
                        className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim ke WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB KHUSUS: DATA AKUN WALI SANTRI & SANTRI BINAAN */}
      {activeAdminTab === 'wali' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Manajemen Akun Wali Santri & Santri Terikat
                </h3>
                <span className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {waliBiometricList.length} Akun Wali
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kelola akun wali santri, edit data wali & santri binaannya, tambah akun baru, persetujuan verifikasi, serta bagikan tautan Magic Link login portal.
              </p>
            </div>

            {/* Quick Actions for Wali */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle View Mode: Tabel vs Kartu */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setWaliViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    waliViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Tampilkan dalam bentuk Tabel"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWaliViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    waliViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Tampilkan dalam bentuk Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
              </div>

              {unapprovedWaliCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    approveAllPendingFingerprints();
                    confetti({ particleCount: 80, spread: 70 });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
                  title="Setujui seluruh permohonan wali santri sekaligus"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Setujui Semua Wali ({unapprovedWaliCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAddWaliOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Daftarkan Akun Wali Baru</span>
              </button>
            </div>
          </div>

          {/* Filter Pills for Wali */}
          <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setWaliFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                waliFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua ({waliBiometricList.length})
            </button>

            <button
              type="button"
              onClick={() => setWaliFilter('unapproved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                waliFilter === 'unapproved'
                  ? 'bg-rose-500 text-white shadow-sm font-black'
                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <span>Belum Disetujui</span>
              {unapprovedWaliCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {unapprovedWaliCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setWaliFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                waliFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <span>Menunggu Verifikasi</span>
              {pendingBiometricCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {pendingBiometricCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setWaliFilter('approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                waliFilter === 'approved'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              }`}
            >
              Terverifikasi Aktif ({waliBiometricList.filter(w => w.fingerprintStatus === 'APPROVED').length})
            </button>

            <button
              type="button"
              onClick={() => setWaliFilter('rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                waliFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <span>Ditolak</span>
              {rejectedWaliCount > 0 && (
                <span className="bg-rose-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {rejectedWaliCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Box for Wali */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={waliSearch}
              onChange={(e) => setWaliSearch(e.target.value)}
              placeholder="Cari wali santri berdasarkan Nama Wali, No. WA, Token, atau Nama Santri..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          {/* LIST / TABEL WALI SANTRI */}
          {filteredWaliList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              Tidak ada data wali santri dalam filter ini.
            </div>
          ) : waliViewMode === 'table' ? (
            /* WALI TABLE VIEW */
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Wali Santri & WA</th>
                    <th className="py-3 px-4">Santri Binaan (Multi-Anak)</th>
                    <th className="py-3 px-4">Gembok & PIN</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4">Token Akses</th>
                    <th className="py-3 px-4 text-right">Aksi Akun & Santri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredWaliList.map((w) => {
                    const isPending = w.fingerprintStatus === 'PENDING_APPROVAL';
                    const isApproved = w.fingerprintStatus === 'APPROVED';
                    const isRejected = w.fingerprintStatus === 'REJECTED';

                    const handleSendApprovalWA = () => {
                      const baseUrl = pesantrenInfo.appBaseUrl || `${window.location.origin}${window.location.pathname}`;
                      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
                      const link = `${cleanBase}#token=${w.parentToken}`;
                      const msg = 
                        `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
                        `Kepada Yth. Bapak/Ibu *${w.parentName}*\n` +
                        `Alhamdulillah, akun wali santri Anda pada portal Maisya-Saku Ma'had Imam Syafi'i Brebes telah *DISETUJUI & AKTIF* oleh Bendahara Ma'had.\n\n` +
                        `Silakan klik tautan di bawah ini untuk langsung membuka aplikasi pengelolaan uang saku santri:\n` +
                        `${link}\n\n` +
                        `Jazakumullahu khairan.`;
                      openWhatsAppDirect(w.parentPhone, msg);
                    };

                    return (
                      <tr key={w.parentToken} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{w.parentName}</div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>WA: {w.parentPhone || '-'}</span>
                            {w.parentPhone && (
                              <button
                                type="button"
                                onClick={handleSendApprovalWA}
                                className="text-emerald-600 hover:text-emerald-700 font-bold underline"
                              >
                                (Chat WA)
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {w.children.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 text-[11px]"
                              >
                                <strong className="text-sky-800 dark:text-sky-300">{c.name}</strong>
                                <span className="text-slate-400 text-[10px]">({c.class} • NIS: {c.nis})</span>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            <div>
                              <span className="text-slate-500">PIN: </span>
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                                {w.pin || '-'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              🔒 {w.bindingLockCode || '-'}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                            isApproved
                              ? 'bg-sky-600 text-white'
                              : isPending
                              ? 'bg-amber-400 text-slate-900 animate-pulse'
                              : isRejected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {isApproved ? 'Terverifikasi Aktif' : isPending ? 'Menunggu Verifikasi' : isRejected ? 'Ditolak' : 'Belum Disetujui'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 inline-block">
                            #{w.parentToken}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Tombol Setujui jika belum disetujui */}
                            {!isApproved && (
                              <button
                                type="button"
                                onClick={() => {
                                  approveFingerprint(w.parentToken);
                                  confetti({ particleCount: 60, spread: 50 });
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                title="Setujui Akun Wali"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>
                            )}

                            {/* Tombol Kirim Link WA jika sudah disetujui */}
                            {isApproved && (
                              <button
                                type="button"
                                onClick={handleSendApprovalWA}
                                className="bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="Kirim Magic Link Login ke WA"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Kirim WA</span>
                              </button>
                            )}

                            {/* Tombol Edit Data Wali & Santri */}
                            <button
                              type="button"
                              onClick={() => setEditingWali({
                                parentToken: w.parentToken,
                                parentName: w.parentName,
                                parentPhone: w.parentPhone,
                                pin: w.pin,
                                children: w.children.map(c => ({
                                  id: c.id,
                                  name: c.name,
                                  nis: c.nis,
                                  class: c.class,
                                  room: c.room || 'Asrama Santri'
                                }))
                              })}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-sky-700 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Edit Data Wali & Santrinya"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Tolak jika belum disetujui */}
                            {!isApproved && !isRejected && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectionReason('Identitas wali / santri belum sesuai dengan database mahad');
                                  setRejectingWali(w);
                                }}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 dark:border-rose-800 cursor-pointer"
                                title="Tolak Pengajuan"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tombol Hapus Akun Wali */}
                            <button
                              type="button"
                              onClick={() => setDeletingWali(w)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Hapus Akun Wali Santri Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* WALI CARDS VIEW */
            <div className="space-y-3">
              {filteredWaliList.map((w) => {
                const isPending = w.fingerprintStatus === 'PENDING_APPROVAL';
                const isApproved = w.fingerprintStatus === 'APPROVED';
                const isRejected = w.fingerprintStatus === 'REJECTED';

                const handleSendApprovalWA = () => {
                  const baseUrl = pesantrenInfo.appBaseUrl || `${window.location.origin}${window.location.pathname}`;
                  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
                  const link = `${cleanBase}#token=${w.parentToken}`;
                  const msg = 
                    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
                    `Kepada Yth. Bapak/Ibu *${w.parentName}*\n` +
                    `Alhamdulillah, akun wali santri Anda pada portal Maisya-Saku Ma'had Imam Syafi'i Brebes telah *DISETUJUI & AKTIF* oleh Bendahara Ma'had.\n\n` +
                    `Silakan klik tautan di bawah ini untuk langsung membuka aplikasi pengelolaan uang saku santri:\n` +
                    `${link}\n\n` +
                    `Jazakumullahu khairan.`;
                  openWhatsAppDirect(w.parentPhone, msg);
                };

                return (
                  <div
                    key={w.parentToken}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isPending
                        ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/30 shadow-sm'
                        : isApproved
                        ? 'border-sky-200 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isPending
                          ? 'bg-amber-100 text-amber-700'
                          : isApproved
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Users className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{w.parentName}</h4>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            WA: {w.parentPhone || '-'}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-400 text-slate-900 animate-pulse'
                              : isApproved
                              ? 'bg-sky-600 text-white'
                              : isRejected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {isPending ? 'Menunggu Verifikasi' : isApproved ? 'Terverifikasi Aktif' : isRejected ? 'Ditolak' : 'Belum Disetujui'}
                          </span>
                        </div>

                        {/* Children Badges */}
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium pt-0.5">
                          <span className="text-slate-500">Santri Binaan: </span>
                          {w.children.map((c) => (
                            <span key={c.id} className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[11px] mr-1.5 my-0.5">
                              <strong className="text-sky-700 dark:text-sky-400">{c.name}</strong>
                              <span className="text-slate-400">({c.class} • NIS: {c.nis})</span>
                            </span>
                          ))}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            🔒 Gembok: <strong>{w.bindingLockCode || '-'}</strong>
                          </span>
                          <span className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            🔑 PIN Login: <strong>{w.pin || '-'}</strong>
                          </span>
                          <span className="bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                            Token: #{w.parentToken}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Cards */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                      {/* Tombol Edit Data Wali & Santri */}
                      <button
                        type="button"
                        onClick={() => setEditingWali({
                          parentToken: w.parentToken,
                          parentName: w.parentName,
                          parentPhone: w.parentPhone,
                          pin: w.pin,
                          children: w.children.map(c => ({
                            id: c.id,
                            name: c.name,
                            nis: c.nis,
                            class: c.class,
                            room: c.room || 'Asrama Santri'
                          }))
                        })}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="Edit Data Wali & Santri Terikat"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                        <span>Edit Wali & Santri</span>
                      </button>

                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            approveFingerprint(w.parentToken);
                            confetti({ particleCount: 60, spread: 50 });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                          title="Admin menyetujui akun ini"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                      )}

                      {isApproved && (
                        <button
                          type="button"
                          onClick={handleSendApprovalWA}
                          className="bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-sky-200 dark:border-sky-800 cursor-pointer"
                          title="Kirim link ke WA"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </button>
                      )}

                      {!isApproved && !isRejected && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectionReason('Identitas wali / santri belum sesuai dengan database mahad');
                            setRejectingWali(w);
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-800 cursor-pointer"
                          title="Tolak pengajuan akun ini"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tolak</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingWali(w)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                        title="Hapus pengajuan akun wali ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATABASE SANTRI & SMARTCARD */}
      {activeAdminTab === 'santri' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Database Santri & Pengaturan Smartcard
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kelola data lengkap santri, hubungkan nomor kartu RFID, barcode, dan bagikan tautan wali santri
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddSantriOpen(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-center shadow-md active:scale-95 transition-all"
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
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none"
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
                  <th className="py-3 px-4">Biometrik Santri</th>
                  <th className="py-3 px-4 text-right">Aksi & Smartcard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSantri.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar
                          name={s.name}
                          src={s.avatar}
                          className="w-9 h-9 text-xs"
                          rounded="rounded-xl"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
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
                          className="text-sky-700 hover:underline font-bold"
                          title="Kirim Magic Link ke Wali via WhatsApp"
                        >
                          (Kirim WA)
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-black text-sky-700 text-sm">
                      {formatRupiah(s.balance)}
                    </td>
                    <td className="py-3 px-4">
                      {s.spendingLimit?.active ? (
                        <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {formatRupiah(s.spendingLimit.amount)} / {s.spendingLimit.type}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Bebas Limit</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.biometricStatus === 'APPROVED' || s.biometricRegistered ? (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>✓ Terverifikasi</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Reset biometrik santri ${s.name}?`)) {
                                resetSantriBiometric(s.id);
                              }
                            }}
                            className="text-[10px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                            title="Reset Biometrik Santri"
                          >
                            Reset
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Belum
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedSantriForBiometric(s)}
                            className="bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-sky-100 flex items-center gap-1"
                            title="Rekam Biometrik Santri Langsung di Aplikasi"
                          >
                            <Fingerprint className="w-3 h-3" />
                            <span>+ Rekam</span>
                          </button>
                        </div>
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-slate-100"
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

      {/* TAB 3: PERSETUJUAN TOP-UP (TERIKAT AKUN WALI, EDIT & HAPUS ANTREAN) */}
      {activeAdminTab === 'approvals' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Antrean Konfirmasi Transfer Uang Saku Santri
                </h3>
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {pendingTopups.length} Menunggu Persetujuan
                </span>
                {orphanTopups.length > 0 && (
                  <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{orphanTopups.length} Akun Wali Terhapus</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verifikasi bukti transfer dari wali santri dan setujui untuk mendebit saldo santri secara otomatis. Antrean terikat langsung dengan data akun wali santri.
              </p>
            </div>

            {orphanTopups.length > 0 && (
              <button
                type="button"
                onClick={() => purgeOrphanTopups()}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-center active:scale-95"
                title="Hapus semua data antrean yang akun wali atau santrinya sudah tidak ada di sistem"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan {orphanTopups.length} Antrean Yatim</span>
              </button>
            )}
          </div>

          {/* Warning Banner if Orphan Topups Exist */}
          {orphanTopups.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-rose-900 dark:text-rose-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold">
                    Perhatian: Ditemukan {orphanTopups.length} antrean dari akun wali/santri yang telah dihapus
                  </div>
                  <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    Data antrean ini (termasuk transfer yang akun walinya sudah Anda hapus) masih tersimpan di antrean. Anda dapat menghapus data ini sekarang agar tidak terus muncul, atau mengeditnya untuk dihubungkan ke santri lain.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => purgeOrphanTopups()}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start md:self-center shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua Antrean Yatim</span>
              </button>
            </div>
          )}

          {/* Filter Pills & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setTopupFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  topupFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Semua ({topupRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setTopupFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  topupFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                }`}
              >
                Menunggu ({pendingTopups.length})
              </button>
              <button
                type="button"
                onClick={() => setTopupFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  topupFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                Disetujui ({approvedTopups.length})
              </button>
              <button
                type="button"
                onClick={() => setTopupFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  topupFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                }`}
              >
                Ditolak ({rejectedTopups.length})
              </button>
              {orphanTopups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTopupFilter('orphan')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    topupFilter === 'orphan'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Akun Terhapus ({orphanTopups.length})</span>
                </button>
              )}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari santri, wali, NIS, bank..."
                value={topupSearch}
                onChange={(e) => setTopupSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {topupSearch && (
                <button
                  type="button"
                  onClick={() => setTopupSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Topup List Items */}
          {filteredTopups.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {topupSearch ? 'Tidak ada antrean top-up yang sesuai dengan pencarian.' : 'Tidak ada antrean konfirmasi transfer pada kategori ini.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTopups.map((topup) => {
                const linkedSantri = santriList.find(s => s.id === topup.santriId || (s.nis && s.nis === topup.santriNis));
                const isOrphan = !linkedSantri || !linkedSantri.parentToken;

                return (
                  <div key={topup.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedProofUrl(topup.proofImageUrl)}
                        className="relative group shrink-0 cursor-pointer"
                        title="Klik untuk melihat bukti transfer penuh"
                      >
                        <img
                          src={topup.proofImageUrl}
                          alt="Bukti Transfer"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 group-hover:opacity-80 transition-opacity"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                          <Eye className="w-4 h-4" />
                        </span>
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {topup.santriName || linkedSantri?.name || 'Santri Tidak Dikenal'}
                          </h4>
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded">
                            NIS: {topup.santriNis || linkedSantri?.nis || '-'}
                          </span>
                          {/* Status Badge */}
                          {topup.status === 'PENDING' && (
                            <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Menunggu
                            </span>
                          )}
                          {topup.status === 'APPROVED' && (
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Disetujui
                            </span>
                          )}
                          {topup.status === 'REJECTED' && (
                            <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Ditolak
                            </span>
                          )}
                          {/* Orphan Badge */}
                          {isOrphan && (
                            <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Akun Wali/Santri Telah Dihapus</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Wali: <strong className="text-slate-800 dark:text-slate-200">{topup.parentName || '-'}</strong> ({topup.parentPhone || '-'})
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Tujuan: <strong>{topup.bankTarget || 'Bank Syariah Indonesia'}</strong> • Kode Unik: <strong>{topup.uniqueCode || 0}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Diajukan: {formatDateTime(topup.createdAt)} {topup.note ? `• "${topup.note}"` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold">Nominal Setoran</div>
                        <div className="text-lg font-black text-sky-700 dark:text-sky-400">
                          {formatRupiah(topup.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total Transfer: {formatRupiah(topup.totalTransfer || topup.amount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingTopup(topup)}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                          title="Edit Data Transfer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeletingTopup(topup)}
                          className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold cursor-pointer transition-colors"
                          title="Hapus Antrean Top-up Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Approve & Reject (If Pending) */}
                        {topup.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReject(topup.id)}
                              className="p-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-bold cursor-pointer transition-colors"
                              title="Tolak Setoran"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(topup.id)}
                              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>Setujui Setoran</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PENGATURAN BIOMETRIK SANTRI (DEDICATED SCANNING & BIOMETRIC ENROLLMENT) */}
      {activeAdminTab === 'biometric' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Pengaturan & Pendaftaran Biometrik Santri
                </h3>
                <span className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>
                    {santriList.filter(s => s.biometricStatus === 'APPROVED' || s.biometricRegistered).length} / {santriList.length} Santri Terdaftar
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Khusus untuk <strong>pendaftaran, scanning sensor sidik jari, edit kode biometrik, dan reset data biometrik santri</strong> untuk verifikasi transaksi belanja bebas tunai di ma'had. Biometrik santri hanya dapat didaftarkan jika santri telah memiliki akun wali santri.
              </p>
            </div>

            {/* Toggle View Mode: Tabel vs Kartu */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setBiometricViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    biometricViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Tampilkan dalam bentuk Tabel"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBiometricViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    biometricViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Tampilkan dalam bentuk Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills for Santri Biometric */}
          <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setSantriBiometricFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                santriBiometricFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua Santri ({santriList.length})
            </button>

            <button
              type="button"
              onClick={() => setSantriBiometricFilter('unregistered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                santriBiometricFilter === 'unregistered'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <span>Belum Rekam</span>
              <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {santriList.filter(s => s.biometricStatus !== 'APPROVED' && !s.biometricRegistered).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSantriBiometricFilter('registered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                santriBiometricFilter === 'registered'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <span>Terverifikasi Biometrik</span>
              <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {santriList.filter(s => s.biometricStatus === 'APPROVED' || s.biometricRegistered).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSantriBiometricFilter('with_wali')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                santriBiometricFilter === 'with_wali'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              }`}
            >
              Ada Akun Wali ({santriList.filter(s => s.parentToken).length})
            </button>

            <button
              type="button"
              onClick={() => setSantriBiometricFilter('without_wali')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                santriBiometricFilter === 'without_wali'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              Belum Ada Wali ({santriList.filter(s => !s.parentToken).length})
            </button>
          </div>

          {/* Search Box for Biometric Santri */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={biometricSearch}
              onChange={(e) => setBiometricSearch(e.target.value)}
              placeholder="Cari santri berdasarkan Nama, NIS, Kelas, Nama Wali, atau Kode Sidik Jari..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          {/* LIST / TABEL BIOMETRIK SANTRI */}
          {filteredBiometricSantri.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              Tidak ada data santri dalam filter biometrik ini.
            </div>
          ) : biometricViewMode === 'table' ? (
            /* BIOMETRIC TABLE VIEW */
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nama Santri</th>
                    <th className="py-3 px-4">NIS & Kelas</th>
                    <th className="py-3 px-4">Akun Wali Santri</th>
                    <th className="py-3 px-4">Status & Kode Biometrik</th>
                    <th className="py-3 px-4">Waktu Pendaftaran</th>
                    <th className="py-3 px-4 text-right">Aksi Biometrik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBiometricSantri.map((s) => {
                    const isRegistered = s.biometricStatus === 'APPROVED' || s.biometricRegistered;
                    const hasWali = Boolean(s.parentToken);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar
                              name={s.name}
                              src={s.avatar}
                              className="w-9 h-9 text-xs"
                              rounded="rounded-xl"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{s.name}</div>
                              <div className="text-[10px] text-slate-400">{s.room || 'Asrama Santri'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{s.nis}</div>
                          <div className="text-[11px] text-slate-500">{s.class}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {hasWali ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                <span>✓ {s.parentName}</span>
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono">
                                WA: {s.parentPhone || '-'} • #{s.parentToken}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span>Belum Ada Akun Wali</span>
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Daftarkan di tab Akun Wali
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {isRegistered ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Terverifikasi Aktif</span>
                              </span>
                              <div>
                                <span className="font-mono text-[11px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                                  {s.biometricCode || s.fingerprintCode || 'FP-ISB-REGISTERED'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                                <span>Belum Rekam Biometrik</span>
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Perlu scan sidik jari layar
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {s.fingerprintApprovedAt 
                            ? formatDateTime(s.fingerprintApprovedAt) 
                            : s.biometricRegisteredAt 
                            ? formatDateTime(s.biometricRegisteredAt) 
                            : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Rekam / Scan Biometrik Sensor */}
                            {!isRegistered && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!hasWali) {
                                    showToast(
                                      `Santri "${s.name}" belum memiliki akun wali santri terdaftar! Daftarkan akun wali santri terlebih dahulu pada tab Akun Wali Santri agar hak akses dan otorisasi tersinkronisasi.`,
                                      'error'
                                    );
                                    return;
                                  }
                                  setSelectedSantriForBiometric(s);
                                }}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                title="Sentuhkan jari santri pada sensor layar untuk merekam sidik jari"
                              >
                                <Fingerprint className="w-3.5 h-3.5" />
                                <span>+ Rekam (Scan)</span>
                              </button>
                            )}

                            {/* Tombol Edit Biometrik */}
                            <button
                              type="button"
                              onClick={() => setEditingBiometricSantri({
                                id: s.id,
                                name: s.name,
                                nis: s.nis,
                                class: s.class,
                                parentName: s.parentName,
                                parentPhone: s.parentPhone,
                                parentToken: s.parentToken,
                                biometricCode: s.biometricCode || s.fingerprintCode || '',
                                status: isRegistered ? 'APPROVED' : 'NOT_REGISTERED'
                              })}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Edit Kode Biometrik / Scan Ulang"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Hapus / Reset Biometrik */}
                            {isRegistered && (
                              <button
                                type="button"
                                onClick={() => setDeletingBiometricSantri(s)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Hapus / Reset Data Biometrik Santri Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* BIOMETRIC CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBiometricSantri.map((s) => {
                const isRegistered = s.biometricStatus === 'APPROVED' || s.biometricRegistered;
                const hasWali = Boolean(s.parentToken);

                return (
                  <div
                    key={s.id}
                    className={`p-5 rounded-2xl border-2 transition-all space-y-3.5 ${
                      isRegistered
                        ? 'border-sky-200 dark:border-sky-800/80 bg-sky-50/20 dark:bg-sky-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar
                          name={s.name}
                          src={s.avatar}
                          className="w-12 h-12 text-sm"
                          rounded="rounded-2xl"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</div>
                          <div className="text-xs text-slate-500 font-mono">NIS: {s.nis} • {s.class}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{s.room || 'Asrama Santri'}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        isRegistered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-400 text-slate-900'
                      }`}>
                        {isRegistered ? '✓ Terverifikasi' : 'Belum Rekam'}
                      </span>
                    </div>

                    {/* Wali Santri Status Box */}
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Akun Wali Santri:</span>
                        {hasWali ? (
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <span className="text-emerald-600">✓</span>
                            <span>{s.parentName}</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Belum Ada Akun</span>
                          </span>
                        )}
                      </div>

                      {hasWali && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>WA: {s.parentPhone || '-'}</span>
                          <span>Token: #{s.parentToken}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-850">
                        <span className="text-slate-500">Kode Sidik Jari:</span>
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded text-[11px]">
                          {s.biometricCode || s.fingerprintCode || 'Belum Rekam'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {!isRegistered ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasWali) {
                              showToast(
                                `Santri "${s.name}" belum memiliki akun wali santri! Daftarkan akun wali terlebih dahulu pada tab Akun Wali Santri.`,
                                'error'
                              );
                              return;
                            }
                            setSelectedSantriForBiometric(s);
                          }}
                          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>+ Rekam Sidik Jari (Scan)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedSantriForBiometric(s)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Scan Ulang Sidik Jari Santri"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                          <span>Scan Ulang</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingBiometricSantri({
                          id: s.id,
                          name: s.name,
                          nis: s.nis,
                          class: s.class,
                          parentName: s.parentName,
                          parentPhone: s.parentPhone,
                          parentToken: s.parentToken,
                          biometricCode: s.biometricCode || s.fingerprintCode || '',
                          status: isRegistered ? 'APPROVED' : 'NOT_REGISTERED'
                        })}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Edit Kode Biometrik"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {isRegistered && (
                        <button
                          type="button"
                          onClick={() => setDeletingBiometricSantri(s)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Hapus Data Biometrik Santri"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFIL PESANTREN & REKENING RESMI */}
      {activeAdminTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
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
                whatsappAdmin: form.get('whatsappAdmin'),
                staffGatePin: form.get('staffGatePin') || '991588',
                appBaseUrl: form.get('appBaseUrl') || 'https://isb-portal.web.app/'
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Resmi Admin:</label>
                <input
                  name="whatsappAdmin"
                  defaultValue={pesantrenInfo.whatsappAdmin || '6282119836050'}
                  required
                  placeholder="6282119836050"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tagline Pesantren:</label>
                <input
                  name="tagline"
                  defaultValue={pesantrenInfo.tagline}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Gerbang Akses Petugas (Staff Gate PIN):</label>
                <input
                  name="staffGatePin"
                  defaultValue={pesantrenInfo.staffGatePin || '991588'}
                  required
                  placeholder="991588"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sky-700 focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Ma'had:</label>
              <input
                name="address"
                defaultValue={pesantrenInfo.address || "Jalan Terusan Islamic Center Sigempol KM 03 Limbangan Wetan Brebes"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Domain Publik Aplikasi / Base URL Magic Link:
              </label>
              <input
                name="appBaseUrl"
                defaultValue={pesantrenInfo.appBaseUrl || 'https://isb-portal.web.app/'}
                placeholder="https://isb-portal.web.app/"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:border-sky-600 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Domain HTTPS publik ini disematkan pada pesan WhatsApp agar tautan otomatis bergaris bawah biru & bisa langsung diklik di ponsel wali santri.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md"
              >
                Simpan Profil Pesantren
              </button>
            </div>
          </form>

          {/* Bank Accounts List */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Daftar Rekening Bank Resmi:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pesantrenInfo.bankAccounts && pesantrenInfo.bankAccounts.map((acc, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-800 text-xs">{acc.bank}</span>
                    <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded">
                      {acc.category === 'spp' ? 'SPP' : 'Uang Saku'}
                    </span>
                  </div>
                  <div className="text-base font-mono font-bold text-slate-900 dark:text-white">{acc.accountNo}</div>
                  <div className="text-xs text-slate-700">a/n <strong>{acc.accountHolder}</strong></div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Konfirmasi WA: {acc.contactName} ({acc.contactWa})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REKAP TRANSAKSI */}
      {activeAdminTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
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
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatDateTime(t.timestamp)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{t.santriName} ({t.santriNis})</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.categoryLabel || t.type}</td>
                    <td className={`py-2.5 px-3 font-bold ${t.type === 'DEPOSIT' ? 'text-sky-700' : 'text-slate-900 dark:text-white'}`}>
                      {t.type === 'DEPOSIT' ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{formatRupiah(t.currentBalance)}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{t.verificationMethod}</td>
                    <td className="py-2.5 px-3 text-slate-500">{t.cashierName}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTx({
                            id: t.id,
                            santriId: t.santriId,
                            santriName: t.santriName,
                            santriNis: t.santriNis,
                            type: t.type,
                            categoryLabel: t.categoryLabel || t.type,
                            amount: t.amount,
                            cashierName: t.cashierName || 'Ust. Bendahara',
                            note: t.note || '',
                            adjustBalance: true
                          })}
                          className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                          title="Edit Data Transaksi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTx({
                            id: t.id,
                            santriId: t.santriId,
                            santriName: t.santriName,
                            santriNis: t.santriNis,
                            type: t.type,
                            categoryLabel: t.categoryLabel || t.type,
                            amount: t.amount,
                            timestamp: t.timestamp,
                            rollbackBalance: true
                          })}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 6: FIREBASE CLOUD */}
      {activeAdminTab === 'firebase' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
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
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project ID:</label>
                <input
                  type="text"
                  value={fbConfig.projectId || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                  placeholder="maisya-saku-xxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Auth Domain:</label>
                <input
                  type="text"
                  value={fbConfig.authDomain || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                  placeholder="maisya-saku-xxxx.firebaseapp.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Storage Bucket:</label>
                <input
                  type="text"
                  value={fbConfig.storageBucket || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, storageBucket: e.target.value })}
                  placeholder="maisya-saku-xxxx.appspot.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md"
              >
                Simpan & Muat Ulang Firebase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: EDIT ROLE, JABATAN & KREDENSIAL */}
      {editingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              const selectedRole = form.get('role');
              const customRoleKey = form.get('customRoleKey');
              const finalRole = selectedRole === 'custom' && customRoleKey ? customRoleKey.trim().toLowerCase() : selectedRole;
              const newTitle = form.get('title');
              const newName = form.get('name');
              const newPhone = form.get('phone');
              const newPin = form.get('pin');
              const newToken = form.get('token');

              updateRoleAccount(editingRole.id, {
                role: finalRole,
                title: newTitle,
                name: newName,
                phone: newPhone,
                pin: newPin,
                password: newPin,
                token: newToken
              });
              setEditingRole(null);
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Role & Jabatan: {editingRole.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Pilihan Role & Hak Akses Portal */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Role / Unit Tugas (Hak Akses):
                </label>
                <select
                  name="role"
                  id="edit-role-select"
                  defaultValue={['admin', 'kantin', 'laundry', 'wartel', 'spp', 'kiosk'].includes(editingRole.role) ? editingRole.role : 'custom'}
                  onChange={(e) => {
                    const titles = {
                      admin: 'Administrator & Bendahara Utama',
                      kantin: 'Petugas Kasir Kantin Santri',
                      laundry: 'Petugas Laundry Pesantren',
                      wartel: 'Petugas Wartel Santri',
                      spp: 'Kasir SPP & Tagihan Pesantren',
                      kiosk: 'Petugas Anjungan Mandiri (Kiosk)',
                      custom: editingRole.title || 'Petugas Layanan Santri'
                    };
                    const titleInput = document.getElementById('edit-role-title');
                    const customContainer = document.getElementById('edit-custom-role-container');
                    if (titleInput && titles[e.target.value]) {
                      titleInput.value = titles[e.target.value];
                    }
                    if (customContainer) {
                      if (e.target.value === 'custom') {
                        customContainer.classList.remove('hidden');
                      } else {
                        customContainer.classList.add('hidden');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="admin">ADMIN - Administrator & Bendahara Utama</option>
                  <option value="kantin">KANTIN - Petugas Kasir Kantin Santri</option>
                  <option value="laundry">LAUNDRY - Petugas Laundry Pesantren</option>
                  <option value="wartel">WARTEL - Petugas Wartel Santri</option>
                  <option value="spp">SPP - Kasir SPP & Tagihan Pesantren</option>
                  <option value="kiosk">KIOSK - Petugas Anjungan Mandiri</option>
                  <option value="custom">CUSTOM - Buat Role Kustom Lainnya</option>
                </select>
              </div>

              {/* Input Custom Role Key jika memilih custom */}
              <div
                id="edit-custom-role-container"
                className={`space-y-1.5 ${['admin', 'kantin', 'laundry', 'wartel', 'spp', 'kiosk'].includes(editingRole.role) ? 'hidden' : ''}`}
              >
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Kode Role Kustom (Huruf kecil tanpa spasi):
                </label>
                <input
                  name="customRoleKey"
                  defaultValue={editingRole.role}
                  placeholder="Contoh: keamanan, kesehatan, asrama"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Jabatan / Role Title */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Jabatan / Posisi Resmi:
                </label>
                <input
                  name="title"
                  id="edit-role-title"
                  defaultValue={editingRole.title}
                  required
                  placeholder="Contoh: Petugas Kasir Kantin Santri"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-semibold text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">
                  Nama jabatan ini akan tampil di kolom "Role & Jabatan", profil petugas, dan struk bukti transaksi.
                </p>
              </div>

              {/* Nama Lengkap Petugas */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap Petugas:
                </label>
                <input
                  name="name"
                  defaultValue={editingRole.name}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">PIN Keamanan:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const pinInput = document.getElementById('edit-role-pin');
                        if (pinInput) pinInput.value = Math.floor(100000 + Math.random() * 900000).toString();
                      }}
                      className="text-[10px] text-sky-600 hover:underline font-bold cursor-pointer"
                    >
                      Acak
                    </button>
                  </div>
                  <input
                    name="pin"
                    id="edit-role-pin"
                    defaultValue={editingRole.pin}
                    required
                    maxLength={10}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold tracking-widest text-sky-800 dark:text-sky-300 focus:bg-white focus:border-sky-600 outline-none text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">No. WhatsApp:</label>
                  <input
                    name="phone"
                    defaultValue={editingRole.phone || ''}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Token Magic Link Unik:</label>
                <div className="flex gap-2">
                  <input
                    name="token"
                    id="role-token-input"
                    defaultValue={editingRole.token}
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold focus:bg-white focus:border-sky-600 outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('role-token-input');
                      const roleVal = document.getElementById('edit-role-select')?.value || 'staff';
                      if (input) input.value = `${roleVal}-isb-${Math.floor(1000 + Math.random() * 9000)}`;
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Acak
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* Opsi Hapus Role langsung dari modal edit jika bukan protected admin */}
              {!(editingRole.role === 'admin' && (editingRole.id === 'role-admin' || roleAccounts.filter(r => r.role === 'admin').length <= 1)) ? (
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingRole;
                    setEditingRole(null);
                    setDeletingRole(toDelete);
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Role</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
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
                pin: form.get('pin') || form.get('password') || '1234',
                parentPassword: form.get('password') || form.get('pin') || '1234',
                password: form.get('password') || form.get('pin') || '1234',
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              });
              setIsAddSantriOpen(false);
            }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Pendaftaran Akun Baru Santri di Maisya-Saku
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri:</label>
                  <input
                    name="name"
                    required
                    placeholder="Nama santri..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-semibold"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kamar Asrama:</label>
                  <input
                    name="room"
                    defaultValue="Kamar Abu Bakar 01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp Wali:</label>
                  <input
                    name="parentPhone"
                    defaultValue="081234567899"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-mono"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Kiosk (4-6 Digit):</label>
                  <input
                    name="pin"
                    defaultValue="1234"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Password Akun (Wali / Santri):</label>
                    <button
                      type="button"
                      onClick={() => setShowAddSantriPass(!showAddSantriPass)}
                      className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showAddSantriPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showAddSantriPass ? 'Sembunyikan' : 'Lihat'}</span>
                    </button>
                  </div>
                  <input
                    name="password"
                    type={showAddSantriPass ? "text" : "password"}
                    defaultValue="1234"
                    required
                    placeholder="Minimal 4 karakter..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Tag RFID Fisik:</label>
                  <input
                    name="rfidTag"
                    defaultValue={`RFID-${Math.floor(100000 + Math.random() * 900000)}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Saldo Awal (Rp):</label>
                <input
                  name="initialBalance"
                  type="number"
                  defaultValue="100000"
                  step="5000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sky-800 focus:bg-white focus:border-sky-600 outline-none"
                />
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
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm"
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
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS:</label>
                  <input
                    name="nis"
                    defaultValue={editingSantri.nis}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas:</label>
                  <input
                    name="class"
                    defaultValue={editingSantri.class}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kamar Asrama:</label>
                  <input
                    name="room"
                    defaultValue={editingSantri.room}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Wali Santri:</label>
                  <input
                    name="parentName"
                    defaultValue={editingSantri.parentName}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Wali:</label>
                  <input
                    name="parentPhone"
                    defaultValue={editingSantri.parentPhone}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Token Magic Link Wali:</label>
                  <input
                    name="parentToken"
                    defaultValue={editingSantri.parentToken}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-sky-600 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Santri/Wali:</label>
                  <input
                    name="pin"
                    defaultValue={editingSantri.pin}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RFID Tag:</label>
                  <input
                    name="rfidTag"
                    defaultValue={editingSantri.rfidTag}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode:</label>
                  <input
                    name="barcode"
                    defaultValue={editingSantri.barcode}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:border-sky-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saldo (Rp):</label>
                  <input
                    name="balance"
                    type="number"
                    defaultValue={editingSantri.balance}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sky-800 focus:bg-white focus:border-sky-600 outline-none"
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
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm"
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
            <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden border-2 border-amber-300/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-sky-200">MA'HAD IMAM SYAFI'I BREBES</div>
                  <div className="text-sm font-black tracking-wide">MAISYA-SAKU SMARTCARD</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-300 text-xs font-serif font-black">
                  ISB
                </div>
              </div>

              <div className="flex items-center gap-4 my-3">
                <InitialsAvatar
                  name={selectedCardSantri.name}
                  src={selectedCardSantri.avatar}
                  className="w-16 h-16 text-lg border-2 border-amber-300 shadow-md"
                  rounded="rounded-2xl"
                />
                <div>
                  <div className="text-base font-black leading-tight text-white">{selectedCardSantri.name}</div>
                  <div className="text-xs text-sky-200 font-mono mt-0.5">NIS: {selectedCardSantri.nis}</div>
                  <div className="text-xs text-sky-100">{selectedCardSantri.class}</div>
                  <div className="text-[11px] text-sky-300">{selectedCardSantri.room}</div>
                </div>
              </div>

              <div className="bg-white/95 p-2.5 rounded-xl text-slate-900 dark:text-white flex items-center justify-between mt-4">
                <div>
                  <div className="font-mono font-black text-xs tracking-widest">{selectedCardSantri.barcode}</div>
                  <div className="text-[9px] text-slate-500 font-sans">RFID: {selectedCardSantri.rfidTag}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-sky-800">
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
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: WHATSAPP DISPATCH MODAL */}
      {/* MODAL EDIT TRANSAKSI KEUANGAN */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Edit Data Transaksi Keuangan
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {editingTx.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await editTransaction(editingTx.id, {
                    amount: Number(editingTx.amount),
                    categoryLabel: editingTx.categoryLabel,
                    cashierName: editingTx.cashierName,
                    note: editingTx.note
                  }, { adjustBalance: editingTx.adjustBalance });
                  setEditingTx(null);
                } catch (err) {
                  showToast(err.message || 'Gagal mengubah transaksi', 'error');
                }
              }}
              className="space-y-3.5 text-xs text-left"
            >
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Santri Terkait:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{editingTx.santriName} ({editingTx.santriNis})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe Transaksi:</span>
                  <span className={`font-bold ${editingTx.type === 'DEPOSIT' ? 'text-sky-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {editingTx.type === 'DEPOSIT' ? 'Setoran (Uang Masuk)' : 'Pengeluaran (Belanja/Layanan)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Transaksi (Rp):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editingTx.amount}
                  onChange={(e) => setEditingTx({ ...editingTx, amount: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Label Kategori Transaksi:
                </label>
                <input
                  type="text"
                  value={editingTx.categoryLabel}
                  onChange={(e) => setEditingTx({ ...editingTx, categoryLabel: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Petugas / Kasir:
                </label>
                <input
                  type="text"
                  value={editingTx.cashierName}
                  onChange={(e) => setEditingTx({ ...editingTx, cashierName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Keterangan:
                </label>
                <textarea
                  rows="2"
                  value={editingTx.note}
                  onChange={(e) => setEditingTx({ ...editingTx, note: e.target.value })}
                  placeholder="Catatan transaksi..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none focus:border-sky-600"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingTx.adjustBalance}
                    onChange={(e) => setEditingTx({ ...editingTx, adjustBalance: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span className="leading-snug">
                    Otomatis sesuaikan saldo santri dengan selisih nominal baru (direkomendasikan)
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HAPUS TRANSAKSI KEUANGAN */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-md">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Hapus Data Transaksi Ini?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Data transaksi ini akan dihapus dari rekap riwayat keuangan.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Santri:</span>
                <span className="font-bold text-slate-900 dark:text-white">{deletingTx.santriName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{deletingTx.categoryLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-bold text-rose-600 font-mono">{formatRupiah(deletingTx.amount)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 text-left leading-relaxed">
              {deletingTx.type === 'DEPOSIT'
                ? `ℹ️ Jika setoran ini dihapus, saldo santri akan otomatis dikurangi sebesar ${formatRupiah(deletingTx.amount)}.`
                : `ℹ️ Jika pengeluaran ini dihapus, saldo santri akan otomatis dikembalikan (refund) sebesar ${formatRupiah(deletingTx.amount)}.`}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 text-left">
              <input
                type="checkbox"
                checked={deletingTx.rollbackBalance}
                onChange={(e) => setDeletingTx({ ...deletingTx, rollbackBalance: e.target.checked })}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <span className="font-medium">Sesuaikan / kembalikan saldo santri</span>
            </label>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteTransaction(deletingTx.id, { rollbackBalance: deletingTx.rollbackBalance });
                    setDeletingTx(null);
                  } catch (err) {
                    showToast(err.message || 'Gagal menghapus transaksi', 'error');
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REKAM BIOMETRIK SANTRI OLEH ADMIN / PETUGAS */}
      {selectedSantriForBiometric && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedSantriForBiometric(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>

            <BiometricTouchPad
              santriName={`${selectedSantriForBiometric.name} (${selectedSantriForBiometric.class || 'Santri'})`}
              title="Pendaftaran Biometrik Santri"
              subtitle="Sentuhkan jari santri pada sensor layar tablet / perangkat fingerprint untuk merekam sidik jari resmi pondok"
              isEnrollment={true}
              onVerified={async (method, code) => {
                await registerSantriBiometric(selectedSantriForBiometric.id, {
                  method,
                  biometricCode: code
                });
                if (selectedSantriForBiometric.parentToken) {
                  await approveFingerprint(selectedSantriForBiometric.parentToken);
                }
                confetti({ particleCount: 75, spread: 60 });
                setSelectedSantriForBiometric(null);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL TOLAK PENGAJUAN AKUN */}
      {rejectingWali && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tolak Pengajuan Akun
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingWali(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div><strong>Wali Santri:</strong> {rejectingWali.parentName} ({rejectingWali.parentPhone || '-'})</div>
              <div>
                <strong>Santri Terkait:</strong> {rejectingWali.children?.map(c => c.name).join(', ') || '-'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Alasan Penolakan:
              </label>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Tulis alasan penolakan..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingWali(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await rejectFingerprint(rejectingWali.parentToken, rejectionReason);
                  setRejectingWali(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS PENGAJUAN AKUN */}
      {deletingWali && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Pengajuan Akun
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingWali(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
              <p>Apakah Anda yakin ingin menghapus data pengajuan akun ini secara permanen?</p>
              <div className="bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-1.5 text-rose-950 dark:text-rose-200">
                <div><strong>Wali:</strong> {deletingWali.parentName} ({deletingWali.parentPhone || '-'})</div>
                <div>
                  <strong>Santri:</strong> {deletingWali.children?.map(c => `${c.name} (${c.class})`).join(', ') || '-'}
                </div>
                <div><strong>Token:</strong> <span className="font-mono">#{deletingWali.parentToken}</span></div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Data pendaftaran dan relasi akun santri terkait akan dihapus dari sistem.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingWali(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteWaliAccount(deletingWali.parentToken);
                  setDeletingWali(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      <WhatsAppDispatchModal
        isOpen={whatsAppModal.isOpen}
        onClose={() => setWhatsAppModal({ ...whatsAppModal, isOpen: false })}
        title={whatsAppModal.title}
        recipientName={whatsAppModal.recipientName}
        initialPhone={whatsAppModal.initialPhone}
        token={whatsAppModal.token}
        pin={whatsAppModal.pin}
        isRole={whatsAppModal.isRole}
        onSavePhone={whatsAppModal.onSavePhone}
        showToast={showToast}
      />

      {/* MODAL 7: PENDAFTARAN BIOMETRIK PETUGAS BARU */}
      <PetugasBiometricRegisterModal
        isOpen={isStaffRegisterModalOpen}
        onClose={() => setIsStaffRegisterModalOpen(false)}
      />

      {/* MODAL 8: AVATAR EDITOR MODAL */}
      <AvatarEditorModal
        isOpen={avatarModalState.isOpen}
        onClose={() => setAvatarModalState({ ...avatarModalState, isOpen: false })}
        currentAvatar={avatarModalState.currentAvatar}
        title="Ganti Foto Avatar Akun"
        onSaveAvatar={(newAvatar) => {
          if (avatarModalState.targetType === 'role' && avatarModalState.targetId) {
            updateRoleAccount(avatarModalState.targetId, { avatar: newAvatar });
          } else if (avatarModalState.targetType === 'santri' && avatarModalState.targetId) {
            updateSantri(avatarModalState.targetId, { avatar: newAvatar });
          } else {
            updateSessionAvatar(newAvatar);
          }
          showToast('Foto avatar berhasil diperbarui!', 'success');
        }}
      />

      {/* MODAL: TAMBAH USER PETUGAS BARU (SUPER ADMIN) */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              const selectedRole = form.get('role');
              const customRoleKey = form.get('customRoleKey');
              const role = selectedRole === 'custom' && customRoleKey ? customRoleKey.trim().toLowerCase() : selectedRole;
              const name = form.get('name');
              const title = form.get('title');
              const phone = form.get('phone');
              const pin = form.get('pin');
              const token = form.get('token');
              const fingerprintCode = form.get('fingerprintCode');

              addRoleAccount({
                role,
                name,
                title,
                phone,
                pin,
                password: pin,
                token,
                fingerprintCode,
                biometricStatus: role === 'admin' ? 'PASSWORD_ONLY' : 'APPROVED',
                biometricRegistered: role !== 'admin'
              });

              setIsAddRoleOpen(false);
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tambah User & Role Petugas Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoleOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Role / Unit Tugas:
                </label>
                <select
                  name="role"
                  id="new-role-select"
                  required
                  defaultValue="kantin"
                  onChange={(e) => {
                    const titles = {
                      kantin: 'Petugas Kasir Kantin Santri',
                      laundry: 'Petugas Laundry Pesantren',
                      wartel: 'Petugas Wartel Santri',
                      spp: 'Kasir SPP & Tagihan Pesantren',
                      kiosk: 'Petugas Anjungan Mandiri (Kiosk)',
                      admin: 'Administrator & Bendahara Utama',
                      custom: 'Petugas Layanan Santri'
                    };
                    const titleInput = document.getElementById('new-role-title');
                    const tokenInput = document.getElementById('new-role-token');
                    const fpInput = document.getElementById('new-role-fp');
                    const customContainer = document.getElementById('new-custom-role-container');
                    if (titleInput) titleInput.value = titles[e.target.value] || `Petugas ${e.target.value}`;
                    if (tokenInput) tokenInput.value = `${e.target.value}-isb-${Math.floor(1000 + Math.random() * 9000)}`;
                    if (fpInput) fpInput.value = `FP-STAFF-${e.target.value.toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
                    if (customContainer) {
                      if (e.target.value === 'custom') customContainer.classList.remove('hidden');
                      else customContainer.classList.add('hidden');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="kantin">KANTIN - Kasir Kantin</option>
                  <option value="laundry">LAUNDRY - Petugas Laundry</option>
                  <option value="wartel">WARTEL - Petugas Wartel</option>
                  <option value="spp">SPP - Kasir SPP & Tagihan</option>
                  <option value="kiosk">KIOSK - Petugas Kiosk Mandiri</option>
                  <option value="admin">ADMIN - Super Admin / Bendahara</option>
                  <option value="custom">CUSTOM - Buat Role Kustom Lainnya</option>
                </select>
              </div>

              {/* Input Custom Role Key jika memilih custom */}
              <div
                id="new-custom-role-container"
                className="space-y-1.5 hidden"
              >
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Kode Role Kustom (Huruf kecil tanpa spasi):
                </label>
                <input
                  name="customRoleKey"
                  placeholder="Contoh: keamanan, kesehatan, asrama"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap Petugas:</label>
                <input
                  name="name"
                  placeholder="Contoh: Akhi Fajar (Kasir Kantin 2)"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jabatan / Role Title:</label>
                <input
                  name="title"
                  id="new-role-title"
                  defaultValue="Petugas Kasir Kantin Santri"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:border-sky-600 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">PIN (6 Digit):</label>
                    <button
                      type="button"
                      onClick={() => {
                        const pinInput = document.getElementById('new-role-pin');
                        if (pinInput) pinInput.value = Math.floor(100000 + Math.random() * 900000).toString();
                      }}
                      className="text-[10px] text-sky-600 hover:underline font-bold cursor-pointer"
                    >
                      Acak
                    </button>
                  </div>
                  <input
                    name="pin"
                    id="new-role-pin"
                    defaultValue={Math.floor(100000 + Math.random() * 900000).toString()}
                    required
                    maxLength={6}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold tracking-widest text-sky-800 dark:text-sky-300 text-center outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp:</label>
                  <input
                    name="phone"
                    placeholder="08123456789"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Token Magic Link Unik:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const role = document.getElementById('new-role-select')?.value || 'staff';
                      const tokenInput = document.getElementById('new-role-token');
                      if (tokenInput) tokenInput.value = `${role}-isb-${Math.floor(1000 + Math.random() * 9000)}`;
                    }}
                    className="text-[10px] text-sky-600 hover:underline font-bold cursor-pointer"
                  >
                    Acak Token
                  </button>
                </div>
                <input
                  name="token"
                  id="new-role-token"
                  defaultValue={`kantin-isb-${Math.floor(1000 + Math.random() * 9000)}`}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-sky-700 dark:text-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Sidik Jari Petugas:</label>
                <input
                  name="fingerprintCode"
                  id="new-role-fp"
                  defaultValue={`FP-STAFF-KANTIN-${Math.floor(10 + Math.random() * 90)}`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-700 dark:text-slate-300 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddRoleOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Simpan & Daftarkan Petugas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: HAPUS USER & ROLE PETUGAS */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Role & User Petugas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingRole(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
              <p>Apakah Anda yakin ingin menghapus role dan akun user petugas berikut dari sistem?</p>
              <div className="bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-1 text-rose-950 dark:text-rose-200">
                <div><strong>Nama Petugas:</strong> {deletingRole.name}</div>
                <div><strong>Role:</strong> <span className="uppercase font-bold">{deletingRole.role}</span></div>
                <div><strong>Jabatan:</strong> {deletingRole.title}</div>
                <div><strong>Token:</strong> <span className="font-mono">#{deletingRole.token}</span></div>
                <div><strong>WhatsApp:</strong> {deletingRole.phone || '-'}</div>
              </div>
              <p className="text-[11px] text-slate-400">
                Setelah dihapus, hak akses dan magic link login petugas ini tidak lagi berlaku dan tidak dapat digunakan untuk mengakses portal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingRole(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteRoleAccount(deletingRole.id);
                  setDeletingRole(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Ya, Hapus Role & Petugas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH AKUN WALI SANTRI BARU (MULTI-ANAK) */}
      {isAddWaliOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              const parentName = form.get('parentName');
              const parentPhone = form.get('parentPhone');
              const password = form.get('password');

              try {
                await registerWaliSantri({
                  parentName,
                  parentPhone,
                  password,
                  childrenList: newWaliChildren.filter(c => c.name && c.name.trim())
                });
                setIsAddWaliOpen(false);
                setNewWaliChildren([{ name: '', isb: '', class: 'Santri Baru', room: 'Asrama Santri' }]);
              } catch (err) {
                alert(err.message || 'Gagal mendaftarkan akun wali santri');
              }
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Daftarkan Akun Wali Santri Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWaliOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50 dark:bg-sky-950/60 p-3 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-300 text-[11px]">
                💡 Daftarkan akun wali santri beserta santri-santrinya. Santri yang terikat pada akun wali ini nantinya dapat didaftarkan biometriknya pada tab Biometrik Santri.
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap Wali Santri:</label>
                <input
                  name="parentName"
                  placeholder="Contoh: Bapak Ahmad Shodiq"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp Wali:</label>
                  <input
                    name="parentPhone"
                    placeholder="08123456789"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">PIN / Password Login:</label>
                  <input
                    name="password"
                    placeholder="4-6 digit (contoh: 1234)"
                    defaultValue={Math.floor(1000 + Math.random() * 9000).toString()}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-center font-bold text-amber-700 dark:text-amber-300 outline-none"
                  />
                </div>
              </div>

              {/* Children List */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Santri Binaan ({newWaliChildren.length} Anak):
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewWaliChildren([...newWaliChildren, { name: '', isb: '', class: 'Santri Baru', room: 'Asrama Santri' }])}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Anak Lain</span>
                  </button>
                </div>

                {newWaliChildren.map((child, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-600 dark:text-slate-400">Anak #{idx + 1}</span>
                      {newWaliChildren.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewWaliChildren(newWaliChildren.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                        >
                          Hapus Baris
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        placeholder="Nama Lengkap Santri"
                        value={child.name}
                        onChange={(e) => {
                          const updated = [...newWaliChildren];
                          updated[idx].name = e.target.value;
                          setNewWaliChildren(updated);
                        }}
                        required
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                      />
                      <input
                        placeholder="NIS / ISB (opsional)"
                        value={child.isb}
                        onChange={(e) => {
                          const updated = [...newWaliChildren];
                          updated[idx].isb = e.target.value;
                          setNewWaliChildren(updated);
                        }}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                      />
                      <input
                        placeholder="Kelas (contoh: 7A / Baru)"
                        value={child.class}
                        onChange={(e) => {
                          const updated = [...newWaliChildren];
                          updated[idx].class = e.target.value;
                          setNewWaliChildren(updated);
                        }}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddWaliOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Daftarkan Akun Wali
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT DATA WALI SANTRI & SANTRI TERKAIT */}
      {editingWali && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await updateWaliAccount(editingWali.parentToken, {
                parentName: editingWali.parentName,
                parentPhone: editingWali.parentPhone,
                pin: editingWali.pin,
                parentPassword: editingWali.pin,
                children: editingWali.children
              });
              setEditingWali(null);
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Data Wali Santri & Santri Terikat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWali(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                <span className="text-slate-500">Token Akun:</span>
                <span className="font-bold text-sky-700 dark:text-sky-400">#{editingWali.parentToken}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Wali Santri:</label>
                <input
                  value={editingWali.parentName || ''}
                  onChange={(e) => setEditingWali({ ...editingWali, parentName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp:</label>
                  <input
                    value={editingWali.parentPhone || ''}
                    onChange={(e) => setEditingWali({ ...editingWali, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">PIN Login:</label>
                  <input
                    value={editingWali.pin || ''}
                    onChange={(e) => setEditingWali({ ...editingWali, pin: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-center text-amber-700 dark:text-amber-300 outline-none"
                  />
                </div>
              </div>

              {/* Children List in Edit Modal */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Santri Binaan Terikat:
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingWali({
                      ...editingWali,
                      children: [...(editingWali.children || []), { name: '', nis: '', class: 'Santri Baru', room: 'Asrama Santri' }]
                    })}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Santri Binaan Baru</span>
                  </button>
                </div>

                {editingWali.children?.map((child, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-600 dark:text-slate-400">
                        Santri #{idx + 1} {child.id ? `(ID: ${child.id})` : '(Santri Baru)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Nama Santri:</label>
                        <input
                          value={child.name || ''}
                          onChange={(e) => {
                            const updated = [...editingWali.children];
                            updated[idx].name = e.target.value;
                            setEditingWali({ ...editingWali, children: updated });
                          }}
                          required
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">NIS / ISB:</label>
                        <input
                          value={child.nis || ''}
                          onChange={(e) => {
                            const updated = [...editingWali.children];
                            updated[idx].nis = e.target.value;
                            setEditingWali({ ...editingWali, children: updated });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Kelas:</label>
                        <input
                          value={child.class || ''}
                          onChange={(e) => {
                            const updated = [...editingWali.children];
                            updated[idx].class = e.target.value;
                            setEditingWali({ ...editingWali, children: updated });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingWali(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT DATA BIOMETRIK SANTRI */}
      {editingBiometricSantri && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              const biometricCode = form.get('biometricCode');
              const status = form.get('status');

              await updateSantriBiometric(editingBiometricSantri.id, {
                biometricCode,
                status
              });
              setEditingBiometricSantri(null);
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Biometrik Santri
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBiometricSantri(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{editingBiometricSantri.name}</div>
                <div className="text-slate-500 font-mono">NIS: {editingBiometricSantri.nis} • {editingBiometricSantri.class}</div>
                <div className="text-slate-500">Wali: {editingBiometricSantri.parentName || 'Belum Terhubung'}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Kode Sidik Jari / Biometrik:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('edit-santri-biometric-code');
                      if (input) input.value = `FP-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                    }}
                    className="text-[10px] text-sky-600 hover:underline font-bold cursor-pointer"
                  >
                    Acak Kode Baru
                  </button>
                </div>
                <input
                  name="biometricCode"
                  id="edit-santri-biometric-code"
                  defaultValue={editingBiometricSantri.biometricCode || `FP-ISB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-sky-700 dark:text-sky-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Verifikasi:</label>
                <select
                  name="status"
                  defaultValue={editingBiometricSantri.status}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="APPROVED">Terverifikasi Aktif (APPROVED)</option>
                  <option value="NOT_REGISTERED">Belum Rekam (NOT_REGISTERED)</option>
                </select>
              </div>

              {/* Opsi Scan Ulang Sensor Sentuh */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const target = santriList.find(s => s.id === editingBiometricSantri.id) || editingBiometricSantri;
                    setEditingBiometricSantri(null);
                    setSelectedSantriForBiometric(target);
                  }}
                  className="w-full py-2.5 px-3 bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Scan Sensor Layar Sentuh Langsung</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBiometricSantri(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Simpan Biometrik
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT DATA TOP-UP REQUEST */}
      {editingTopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sky-600">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Antrean Top-Up Santri
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTopup(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const selectedSantriId = formData.get('santriId');
                const matchedSantri = santriList.find(s => s.id === selectedSantriId);

                await editTopupRequest(editingTopup.id, {
                  amount: Number(formData.get('amount')) || editingTopup.amount,
                  bankTarget: formData.get('bankTarget') || editingTopup.bankTarget,
                  note: formData.get('note') || '',
                  status: formData.get('status') || editingTopup.status,
                  santriId: selectedSantriId || editingTopup.santriId,
                  santriName: matchedSantri?.name || editingTopup.santriName,
                  santriNis: matchedSantri?.nis || editingTopup.santriNis,
                  parentName: matchedSantri?.parentName || editingTopup.parentName,
                  parentPhone: matchedSantri?.parentPhone || editingTopup.parentPhone,
                  parentToken: matchedSantri?.parentToken || editingTopup.parentToken || ''
                });

                setEditingTopup(null);
              }}
              className="space-y-4 text-xs"
            >
              {/* Pilih / Hubungkan ke Santri */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Hubungkan ke Akun Santri
                </label>
                <select
                  name="santriId"
                  defaultValue={editingTopup.santriId}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value={editingTopup.santriId}>
                    {editingTopup.santriName} (NIS: {editingTopup.santriNis || '-'}) {santriList.some(s => s.id === editingTopup.santriId) ? '✓ Terdaftar' : '⚠️ Akun Asli Terhapus'}
                  </option>
                  {santriList.filter(s => s.id !== editingTopup.santriId).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NIS: {s.nis}) - Wali: {s.parentName || 'Belum ada wali'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Gunakan dropdown ini jika akun santri/wali sebelumnya telah dihapus dan Anda ingin menghubungkan bukti transfer ini ke santri aktif lain.
                </p>
              </div>

              {/* Nominal Setoran */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nominal Setoran (Rp)
                </label>
                <input
                  type="number"
                  name="amount"
                  defaultValue={editingTopup.amount}
                  required
                  min="1000"
                  step="1000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Bank Tujuan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Rekening / Bank Tujuan
                </label>
                <input
                  type="text"
                  name="bankTarget"
                  defaultValue={editingTopup.bankTarget}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Status Antrean
                </label>
                <select
                  name="status"
                  defaultValue={editingTopup.status}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="PENDING">Menunggu Persetujuan (PENDING)</option>
                  <option value="APPROVED">Disetujui (APPROVED)</option>
                  <option value="REJECTED">Ditolak (REJECTED)</option>
                </select>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Catatan dari Wali Santri
                </label>
                <textarea
                  name="note"
                  defaultValue={editingTopup.note || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTopup(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HAPUS ANTREAN TOP-UP SECARA PERMANEN */}
      {deletingTopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Antrean Top-Up
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingTopup(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
              <p>Apakah Anda yakin ingin menghapus data antrean transfer top-up berikut secara permanen?</p>
              <div className="bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-1 text-rose-950 dark:text-rose-200">
                <div><strong>Nama Santri:</strong> {deletingTopup.santriName} (NIS: {deletingTopup.santriNis || '-'})</div>
                <div><strong>Nama Wali:</strong> {deletingTopup.parentName || '-'} ({deletingTopup.parentPhone || '-'})</div>
                <div><strong>Nominal Setoran:</strong> {formatRupiah(deletingTopup.amount)}</div>
                <div><strong>Bank Tujuan:</strong> {deletingTopup.bankTarget}</div>
                <div><strong>Status:</strong> {deletingTopup.status}</div>
              </div>
              <p className="text-[11px] text-slate-400">
                Data antrean ini akan dihapus permanen dari sistem dan tidak akan muncul kembali di tab antrean.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingTopup(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteTopupRequest(deletingTopup.id);
                  setDeletingTopup(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
