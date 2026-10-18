import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Send, 
  Plus, 
  Trash2, 
  User, 
  Phone, 
  GraduationCap, 
  Hash, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  KeyRound, 
  X,
  ArrowRight,
  Info,
  Sun,
  Moon,
  Wallet,
  CreditCard,
  QrCode,
  ShoppingBag,
  Shirt,
  Building2,
  Landmark,
  Clock,
  HeartHandshake,
  Lock,
  Smartphone,
  ChevronRight,
  BadgeCheck,
  ChevronDown
} from 'lucide-react';
import { useApp, playSound, formatRupiah } from '../context/AppContext';
import { formatPhoneNumber, openWhatsAppDirect } from '../utils/whatsapp';
import confetti from 'canvas-confetti';

export default function LandingPage({ onSelectRole }) {
  const { 
    pesantrenInfo, 
    registerWaliSantri, 
    roleAccounts, 
    theme, 
    toggleTheme, 
    showToast 
  } = useApp();

  // Form State
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [children, setChildren] = useState([
    { id: 1, name: '', isb: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffPinGateOpen, setStaffPinGateOpen] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [staffPinError, setStaffPinError] = useState('');

  const handleOpenStaffGate = () => {
    setStaffPinGateOpen(true);
    setStaffPinInput('');
    setStaffPinError('');
  };

  const handleStaffPinDigit = (digit) => {
    if (staffPinInput.length < 6) {
      playSound('beep');
      const next = staffPinInput + digit;
      setStaffPinInput(next);
      setStaffPinError('');
      if (next.length === 6) {
        if (next === (pesantrenInfo.staffGatePin || '991588')) {
          playSound('success');
          setStaffPinGateOpen(false);
          setShowStaffModal(true);
          setStaffPinInput('');
        } else {
          playSound('error');
          setStaffPinError('PIN Akses Petugas Salah! (Gunakan PIN resmi: 991588)');
          setStaffPinInput('');
        }
      }
    }
  };

  const handleStaffPinBackspace = () => {
    setStaffPinInput(prev => prev.slice(0, -1));
    setStaffPinError('');
    playSound('beep');
  };

  const handleStaffPinClear = () => {
    setStaffPinInput('');
    setStaffPinError('');
  };

  // Add more children
  const handleAddChild = () => {
    setChildren(prev => [
      ...prev,
      { id: Date.now(), name: '', isb: '' }
    ]);
    playSound('beep');
  };

  // Remove child
  const handleRemoveChild = (idToRemove) => {
    if (children.length <= 1) return;
    setChildren(prev => prev.filter(c => c.id !== idToRemove));
    playSound('beep');
  };

  // Update child field
  const handleChildChange = (id, field, value) => {
    setChildren(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!parentName.trim()) {
      showToast('Nama Wali Santri wajib diisi.', 'error');
      return;
    }

    const clean = formatPhoneNumber(parentPhone);
    if (!clean || clean.length < 9) {
      showToast('Nomor WhatsApp tidak valid (minimal 9 digit).', 'error');
      return;
    }

    const validChildren = children.filter(c => c.name.trim() && c.isb.trim());
    if (validChildren.length === 0) {
      showToast('Minimal 1 data ananda (Nama & Nomor ISB) wajib diisi lengkap.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = registerWaliSantri({
        parentName: parentName.trim(),
        parentPhone: clean,
        childrenList: validChildren
      });

      confetti({ particleCount: 80, spread: 70 });

      // Construct official WhatsApp message with binding lock and PIN
      const childSummary = validChildren
        .map((c, i) => `  ${i + 1}. *${c.name.trim()}* (Nomor ISB: *${c.isb.trim()}*)`)
        .join('\n');

      const waMessage = 
        `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `Kepada Yth. Bapak/Ibu *${result.parentName}*\n` +
        `Berikut adalah Data Registrasi Resmi & Tautan Akses Anda pada sistem Maisya-Saku Ma'had Imam Syafi'i Brebes:\n\n` +
        `${childSummary}\n\n` +
        `🔐 Kode Gembok Database: *${result.bindingLockCode}*\n` +
        `🔑 PIN Masuk Otomatis: *${result.generatedPin}* (Disimpan untuk cadangan darurat)\n\n` +
        `Klik tautan di bawah ini untuk mendaftarkan sidik jari Anda:\n` +
        `${result.fullLink}\n\n` +
        `Tahapan Akses:\n` +
        `1. Buka tautan di atas melalui browser HP/tablet Anda\n` +
        `2. Rekam sidik jari fisik Anda pada layar sentuh\n` +
        `3. Admin Ma'had akan menyetujui akun Anda agar tautan login sidik jari resmi aktif.\n\n` +
        `Alamat: ${pesantrenInfo.address}\n` +
        `WhatsApp Admin: ${pesantrenInfo.phone}\n` +
        `Jazakumullahu khairan.`;

      // Open WhatsApp directly via wa.me / app protocol
      openWhatsAppDirect(result.cleanPhone, waMessage);

      setGeneratedResult({
        ...result,
        waMessage
      });

      showToast('Tautan login berhasil dibuat & dialihkan ke WhatsApp!', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal membuat tautan login.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.fullLink);
    setCopied(true);
    showToast('Tautan login resmi berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLinkNow = () => {
    if (!generatedResult) return;
    window.location.hash = `token=${generatedResult.token}`;
  };

  const handleStaffRoleSelect = (token) => {
    if (onSelectRole) {
      onSelectRole(token);
    } else {
      window.location.hash = `token=${token}`;
    }
    setShowStaffModal(false);
  };

  const scrollToForm = () => {
    const el = document.getElementById('form-pendaftaran-wali');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors selection:bg-sky-500 selection:text-white flex flex-col font-sans">
      
      {/* 1. TOP ANNOUNCEMENT BAR (Scalev Blue Gradient) */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-sky-800 text-white text-[11px] sm:text-xs py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              Resmi
            </span>
            <span className="font-medium truncate">
              {pesantrenInfo.name} • Portal Keuangan Santri Cashless & Transparan
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="https://wa.me/6282119836050" 
              target="_blank" 
              rel="noreferrer"
              className="hover:underline flex items-center gap-1 font-semibold hidden md:inline-flex"
            >
              <Phone className="w-3 h-3" />
              <span>Bantuan Admin: 082119836050</span>
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors"
              title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 h-3 text-amber-300" />
                  <span>Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-slate-100" />
                  <span>Gelap</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. STICKY MAIN NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="./logo-maisya.jpg"
              alt="Logo Ma'had Imam Syafi'i Brebes"
              className="w-10 h-10 rounded-2xl object-cover border border-sky-300 dark:border-sky-800 shadow-md shadow-sky-500/25 shrink-0"
            />
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span>Maisya-Saku</span>
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-200 dark:border-sky-800">
                  PPISB
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-none">
                {pesantrenInfo.name}
              </div>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#keunggulan" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Keunggulan
            </a>
            <a href="#layanan" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Layanan Pesantren
            </a>
            <a href="#cara-kerja" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Alur 3 Langkah
            </a>
            <a href="#rekening" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Rekening Resmi
            </a>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenStaffGate}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Akses Petugas Dilindungi PIN 991588"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">Akses Petugas</span>
            </button>

            <button
              type="button"
              onClick={scrollToForm}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buat Tautan Masuk</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-sky-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 transition-colors">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-400/15 dark:bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 text-xs font-black shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-spin-slow" />
              <span>SISTEM KEUANGAN SANTRI CASHLESS & TERINTEGRASI</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Transparansi Keuangan Santri,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600">
                Ketenangan Hati Para Wali
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              Sistem dompet digital resmi <strong>{pesantrenInfo.name}</strong>. Pantau saldo uang saku ananda, atur limit jajan harian, dan terima bukti transaksi otomatis via WhatsApp dengan verifikasi sidik jari di layar HP/tablet.
            </p>

            {/* CTA Group */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xl shadow-sky-500/30 flex items-center justify-center gap-2.5 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Buat Tautan Wali Santri Sekarang</span>
              </button>

              <button
                type="button"
                onClick={handleOpenStaffGate}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <KeyRound className="w-4 h-4 text-sky-500" />
                <span>Portal Petugas & Admin</span>
              </button>
            </div>

            {/* Live Trust Badges Grid */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">100% Cashless</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Bebas uang hilang</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Laporan WhatsApp</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Notifikasi otomatis</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Sidik Jari Layar</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Aman tanpa password</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Cloud Firestore</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Database realtime</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. PERBANDINGAN: SEBELUM VS SESUDAH MAISYA-SAKU */}
      <section id="keunggulan" className="py-14 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Mengapa Maisya-Saku Dihadirkan?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Solusi Tuntas Problematika Uang Saku Santri
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Transformasi pengelolaan uang saku tradisional menjadi ekosistem digital yang adil, disiplin, dan amanah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Sisi Tradisional (Merah/Abu) */}
            <div className="p-6 rounded-3xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-4">
              <div className="flex items-center gap-2.5 text-red-700 dark:text-red-400 font-bold text-sm">
                <X className="w-5 h-5 shrink-0" />
                <span>Kendala Sistem Uang Tunai Lama:</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Uang tunai sering hilang, terselip di kasur, atau tercecer di asrama santri.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Orang tua tidak mengetahui untuk apa saja uang saku dibelanjakan setiap hari.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Santri cepat menghabiskan jatah bulanan di minggu pertama (konsumtif).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Pencatatan utang laundry dan wartel santri masih manual di buku catatan kertas.</span>
                </li>
              </ul>
            </div>

            {/* Sisi Solusi Maisya-Saku (Biru Scalev) */}
            <div className="p-6 rounded-3xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-500/40 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 text-sky-700 dark:text-sky-300 font-bold text-sm">
                <Check className="w-5 h-5 shrink-0 text-sky-500" />
                <span>Solusi Nyata dengan Maisya-Saku:</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">✓</span>
                  <span>Saldo aman tersimpan di dompet digital santri, cukup tap Smartcard RFID/ISB.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">✓</span>
                  <span>Setiap transaksi tercatat transparan dan dapat dipantau langsung oleh wali santri.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">✓</span>
                  <span>Wali santri bebas mengatur batas maksimal jajan per hari (misal Rp 20.000/hari).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">✓</span>
                  <span>Biaya laundry & wartel otomatis memotong saldo dengan tarif transparan.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EKOSISTEM LAYANAN TERINTEGRASI */}
      <section id="layanan" className="py-16 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Satu Kartu untuk Semua
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Ekosistem Layanan Ma'had Imam Syafi'i
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Integrasi menyeluruh dari asrama, kantin, laundry, hingga pusat kendali bendahara.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Kantin POS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Kantin & POS Digital
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Kasir kantin dilengkapi barcode scanner & tap kartu. Santri jajan makanan sehat bergizi tanpa memegang uang kotor.
              </p>
            </div>

            {/* Card 2: Laundry Syar'i */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shirt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Laundry Bersih Kiloan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Penimbangan baju kiloan otomatis. Status cuci, setrika, dan potongan biaya langsung tercatat di profil santri.
              </p>
            </div>

            {/* Card 3: Wartel Santri */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Wartel & Telepon Santri
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Fasilitas telepon untuk mengobati rindu dengan orang tua di rumah dengan penghitung durasi menit otomatis.
              </p>
            </div>

            {/* Card 4: SPP & Syahriyah */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                SPP & Tagihan Syahriyah
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cek rincian tagihan pendidikan dan uang gedung dengan verifikasi setoran ke rekening resmi yayasan secara instan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ALUR 3 LANGKAH BAGI WALI SANTRI */}
      <section id="cara-kerja" className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Sangat Mudah & Praktis
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              3 Langkah Mulai Memantau Keuangan Ananda
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Tidak perlu mengunduh aplikasi rumit atau menghafal username/password.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white font-black flex items-center justify-center mb-4 text-sm shadow-md shadow-sky-500/25">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Isi Data Wali & Ananda
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Masukkan nama Anda, nomor WhatsApp aktif, dan Nomor ISB/NIS ananda pada form pendaftaran di bawah ini.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white font-black flex items-center justify-center mb-4 text-sm shadow-md shadow-sky-500/25">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Terima Tautan via WhatsApp
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sistem otomatis membuatkan Tautan Resmi (*Magic Link*) dan mengirimkannya langsung ke nomor WhatsApp Anda.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white font-black flex items-center justify-center mb-4 text-sm shadow-md shadow-sky-500/25">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Sidik Jari & Pantau Realtime
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Klik link dari WhatsApp, sentuh sensor sidik jari di layar HP/tablet Anda, dan nikmati kemudahan pantau saldo ananda!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FORM GENERATOR TAUTAN WALI SANTRI (INTERACTIVE CORE) */}
      <section id="form-pendaftaran-wali" className="py-16 bg-gradient-to-b from-sky-50/70 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-xl w-full mx-auto px-4">
          
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 px-4 py-1.5 rounded-full text-xs font-black shadow-xs">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>Portal Registrasi & Pembuatan Magic Link</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Formulir Akses Wali Santri
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Silakan lengkapi form ini untuk mendapatkan tautan masuk portal resmi Anda.
            </p>
          </div>

          {generatedResult ? (
            /* SUCCESS RESULT CARD (Scalev Blue) */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-sky-500 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 transition-colors">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-sky-100 dark:bg-sky-950/70 border-2 border-sky-500 dark:border-sky-400 text-sky-600 dark:text-sky-300 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-sky-500/25">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Tautan Berhasil Dibuat!
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tautan resmi telah dibuat untuk <strong className="text-sky-600 dark:text-sky-400">{generatedResult.parentName}</strong> dan dialihkan ke WhatsApp nomor: <strong className="font-mono text-slate-900 dark:text-white">+{generatedResult.cleanPhone}</strong>
                </p>
              </div>

              {/* Link Preview Box */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    <span>Tautan Resmi Portal (Online):</span>
                    <span className="text-[10px] text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 font-bold">
                      Aktif di WhatsApp
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 font-mono text-xs text-sky-700 dark:text-sky-300 break-all select-all shadow-inner">
                    {generatedResult.fullLink}
                  </div>
                </div>

                {generatedResult.localLink && generatedResult.localLink !== generatedResult.fullLink && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      <span>Tautan Uji Coba Laptop Ini (Localhost):</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedResult.localLink);
                          showToast('Tautan localhost laptop disalin!', 'success');
                        }}
                        className="text-[10px] text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 underline font-semibold flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin Localhost</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all select-all">
                      {generatedResult.localLink}
                    </div>
                  </div>
                )}
              </div>

              {/* Educational Alert: Why WhatsApp links need save or reply */}
              <div className="p-4 rounded-2xl bg-sky-50/90 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/70 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                  <Info className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>Tips WhatsApp: Agar Tautan Otomatis Bisa Diklik</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  WhatsApp memiliki proteksi di mana tautan dari <strong>nomor yang belum tersimpan di kontak HP</strong> awalnya dimatikan (berwarna teks biasa).
                </p>
                <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-sky-100 dark:border-sky-900/50 text-slate-700 dark:text-slate-300 space-y-1.5 shadow-xs">
                  <div className="font-bold text-sky-700 dark:text-sky-400 text-[11px]">
                    💡 2 Cara Mudah Mengaktifkannya:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li><strong>Simpan nomor pengirim</strong> ke kontak buku telepon HP Anda, ATAU</li>
                    <li><strong>Balas pesan tersebut 1 kali</strong> (misal: balas <em>"Wa'alaikumussalam"</em>).</li>
                  </ol>
                  <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium pt-0.5 border-t border-slate-100 dark:border-slate-800">
                    ✓ Seketika tautan akan otomatis berubah menjadi warna biru aktif & bisa langsung diklik!
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleOpenLinkNow}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <span>Buka Tautan Sekarang (Lanjut Verifikasi Sidik Jari)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openWhatsAppDirect(generatedResult.cleanPhone, generatedResult.waMessage)}
                    className="bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/50 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Kirim Ulang ke WA</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setGeneratedResult(null)}
                  className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white pt-2 font-medium"
                >
                  ← Buat Tautan untuk Wali Santri Lainnya
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION & LINK GENERATOR FORM */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl space-y-6 transition-colors">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Parent Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    <span>Nama Lengkap Wali Santri / Orang Tua:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: dr. Hendra Pratama / H. Bambang Irawan"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-sky-500 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Parent WhatsApp */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-500" />
                      <span>Nomor WhatsApp Wali Santri (Aktif):</span>
                    </label>
                    <span className="text-[10px] text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded font-semibold border border-sky-200 dark:border-sky-800">
                      Otomatis Buka wa.me
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Contoh: 081234567890 atau 6281234567890"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-sky-500 rounded-2xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Children List (Multi-Child ISB Support) */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-sky-500" />
                      <span>Data Ananda di Pesantren:</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {children.length} Ananda Terdaftar
                    </span>
                  </div>

                  <div className="space-y-3">
                    {children.map((child, index) => (
                      <div 
                        key={child.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                            <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span>Ananda ke-{index + 1}</span>
                          </span>

                          {children.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(child.id)}
                              className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus data anak ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
                              <User className="w-3 h-3 text-sky-500" />
                              <span>Nama Lengkap Ananda:</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={child.name}
                              onChange={(e) => handleChildChange(child.id, 'name', e.target.value)}
                              placeholder="Contoh: Muhammad Al-Fatih"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-sky-500 rounded-xl text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
                              <Hash className="w-3 h-3 text-sky-500" />
                              <span>Nomor ISB Santri (NIS):</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={child.isb}
                              onChange={(e) => handleChildChange(child.id, 'isb', e.target.value)}
                              placeholder="Contoh: 202401001 atau isb-12-27"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-sky-500 rounded-xl text-xs font-mono text-sky-700 dark:text-sky-300 outline-none placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Child Button */}
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 border border-dashed border-sky-400/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Data Anak (Jika Anak Lebih Dari 1)</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-sky-500/30 flex items-center justify-center gap-2.5 transition-transform active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Tautan Masuk ke WhatsApp Saya</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* 8. REKENING RESMI PESANTREN (TRANSPARANSI TOP-UP & SPP) */}
      <section id="rekening" className="py-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Amanah & Terpercaya
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Rekening Resmi {pesantrenInfo.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Pengisian saldo uang saku santri dan pembayaran SPP dipisahkan ke rekening resmi masing-masing untuk menjaga akuntabilitas keuangan syariah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Rekening 1: Uang Saku Santri */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border-2 border-sky-200 dark:border-sky-800/60 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
                  Rekening Uang Saku Santri
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Kode Bank: 451
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Bank Syariah Indonesia (BSI)</div>
                <div className="text-2xl font-mono font-black text-sky-700 dark:text-sky-400 tracking-wider select-all mt-1">
                  5221717173
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                  a.n. <span className="text-slate-900 dark:text-white font-bold">Ponpes Imam Syafii Brebes</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong>Peruntukan:</strong> Jajan Kantin, Laundry, Telepon/Wartel, & Tarik Tunai
              </div>

              <a
                href="https://wa.me/6281949682554"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Konfirmasi Uang Saku: 081949682554 (Ustadz Firdhi)</span>
              </a>
            </div>

            {/* Rekening 2: SPP & Pendidikan */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border-2 border-purple-200 dark:border-purple-800/60 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                  Rekening SPP & Pendidikan
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Kode Bank: 451
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Bank Syariah Indonesia (BSI)</div>
                <div className="text-2xl font-mono font-black text-purple-700 dark:text-purple-400 tracking-wider select-all mt-1">
                  6469965840
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                  a.n. <span className="text-slate-900 dark:text-white font-bold">Yayasan Pendidikan Imam Syafi'i Brebes</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong>Peruntukan:</strong> Pembayaran SPP Bulanan, Syahriyah, & Biaya Pendidikan
              </div>

              <a
                href="https://wa.me/62818275720"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Konfirmasi SPP: 0818275720 (Bapak Imawan)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-10 transition-colors text-xs text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="./logo-maisya.jpg"
                  alt="Logo Maisya"
                  className="w-8 h-8 rounded-xl object-cover border border-sky-400"
                />
                <span className="font-black text-base text-slate-900 dark:text-white">
                  Maisya-Saku
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                Sistem Informasi Manajemen Keuangan Santri Cashless & Transparan Ma'had Imam Syafi'i Brebes. Didukung PWA, sensor sidik jari touchscreen, dan sinkronisasi Cloud Firestore.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 dark:text-white">Alamat Ma'had</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Jalan Terusan Islamic Center Sigempol KM 03 Limbangan Wetan Brebes
              </p>
              <div className="text-xs pt-1">
                <a 
                  href="https://wa.me/6282119836050" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
                >
                  WhatsApp Admin: 082119836050
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 dark:text-white">Akses Cepat Petugas</div>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={handleOpenStaffGate}
                    className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Login Petugas & Bendahara (PIN: 991588)</span>
                  </button>
                </li>
                <li>
                  <a href="#cara-kerja" className="hover:underline">Panduan Alur Wali</a>
                </li>
                <li>
                  <a href="#rekening" className="hover:underline">Rekening Resmi</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-slate-500">
            <div>
              © {new Date().getFullYear()} {pesantrenInfo.name}. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Mencetak Generasi Rabbani Berdasarkan Al-Qur'an dan Sunnah</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL 1: STAFF GATE PIN PROTECTION (PIN: 991588) */}
      {staffPinGateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Gerbang Akses Petugas</h3>
              </div>
              <button
                type="button"
                onClick={() => setStaffPinGateOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tombol ini dilindungi. Masukkan <strong>6-digit PIN Petugas</strong> untuk membuka menu peran operasional:
              </p>
            </div>

            {staffPinError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs text-center font-bold">
                {staffPinError}
              </div>
            )}

            {/* PIN Dots Indicator */}
            <div className="flex justify-center items-center gap-2.5 my-3">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    idx < staffPinInput.length
                      ? 'bg-sky-500 scale-125 shadow-sm shadow-sky-500/50'
                      : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Keypad 0-9 */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleStaffPinDigit(String(num))}
                  className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 active:scale-95 text-base font-bold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all select-none"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleStaffPinClear}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 active:scale-95 text-[11px] font-bold text-slate-500 dark:text-slate-400 rounded-xl transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleStaffPinDigit('0')}
                className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 active:scale-95 text-base font-bold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleStaffPinBackspace}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 active:scale-95 text-[11px] font-bold text-slate-500 dark:text-slate-400 rounded-xl transition-all"
              >
                ⌫ Hapus
              </button>
            </div>

            <div className="text-[10px] text-center text-slate-400 pt-1">
              Petugas resmi Ma'had Imam Syafi'i Brebes
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STAFF & ADMIN ACCESS (UNLOCKED AFTER PIN 991588) */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pilih Peran Petugas</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih akun tugas operasional Anda:
            </p>

            {/* Quick Staff Roles List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {roleAccounts.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleStaffRoleSelect(role.token)}
                  className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-600/50 flex items-center gap-3 transition-all"
                >
                  <img
                    src={role.avatar}
                    alt={role.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {role.name}
                    </div>
                    <div className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold truncate">
                      {role.title}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>

            <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              Setiap sesi petugas dilindungi PIN & Sidik Jari Touchscreen
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
