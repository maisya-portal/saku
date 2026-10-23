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
  Moon
} from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import { formatPhoneNumber, openWhatsAppDirect } from '../utils/whatsapp';
import confetti from 'canvas-confetti';
import InitialsAvatar from './InitialsAvatar';

export default function WaliLinkGenerator({ onOpenStaffLogin }) {
  const { pesantrenInfo, registerWaliSantri, roleAccounts, setUrlToken, showToast, theme, toggleTheme } = useApp();

  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [children, setChildren] = useState([
    { id: 1, name: '', isb: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffTokenInput, setStaffTokenInput] = useState('');

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
  const handleSubmit = async (e) => {
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
      const result = await registerWaliSantri({
        parentName: parentName.trim(),
        parentPhone: clean,
        childrenList: validChildren
      });

      confetti({ particleCount: 70, spread: 60 });

      // Construct official WhatsApp message
      const childSummary = validChildren
        .map((c, i) => `  ${i + 1}. *${c.name.trim()}* (Nomor ISB: *${c.isb.trim()}*)`)
        .join('\n');

      const waMessage = 
        `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `Kepada Yth. Bapak/Ibu *${result.parentName}*\n` +
        `Berikut adalah Tautan Akses Resmi (Magic Link) Anda pada sistem Maisya-Saku Ma'had Imam Syafi'i Brebes untuk ananda:\n\n` +
        `${childSummary}\n\n` +
        `Klik tautan di bawah ini untuk masuk ke portal:\n` +
        `${result.fullLink}\n\n` +
        `Tahap Selanjutnya:\n` +
        `1. Klik tautan di atas untuk masuk langsung ke portal wali santri\n` +
        `2. Akun Anda akan diverifikasi oleh Admin Ma'had\n` +
        `3. Biometrik santri untuk otorisasi belanja akan didaftarkan langsung oleh Admin / Petugas di Pondok Pesantren.\n\n` +
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
    showToast('Tautan login berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLinkNow = () => {
    if (!generatedResult) return;
    if (onOpenStaffLogin) {
      onOpenStaffLogin(generatedResult.token);
    }
    window.location.hash = `token=${generatedResult.token}`;
  };

  const handleStaffRoleSelect = (token) => {
    window.location.hash = `token=${token}`;
    setShowStaffModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-sky-500 selection:text-white relative transition-colors">
      {/* Theme Toggle Button (Top Right Corner) */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 shadow-md hover:bg-slate-100 dark:hover:bg-slate-850 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
          title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-slate-200">Tema Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline text-slate-700">Tema Gelap</span>
            </>
          )}
        </button>
      </div>

      {/* Top Header */}
      <div className="max-w-xl w-full mx-auto text-center pt-3 pb-2">
        <div className="inline-flex items-center gap-2 bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Portal Pembuatan Tautan Akses Wali Santri</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
          {pesantrenInfo.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto transition-colors">
          Dapatkan Tautan Masuk Resmi (Magic Link) otomatis dikirimkan ke WhatsApp Anda untuk memantau keuangan ananda.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="max-w-xl w-full mx-auto my-auto py-4">
        {generatedResult ? (
          /* SUCCESS RESULT CARD (Scalev Blue) */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-sky-500/50 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 transition-colors">
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
                  <span>Tautan Resmi WhatsApp (Domain Online):</span>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 font-bold">
                    Otomatis Biru di HP
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

            {/* Educational Alert: Why WhatsApp links are not clickable initially */}
            <div className="p-4 rounded-2xl bg-sky-50/90 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/70 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                <Info className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Kenapa tautan di WhatsApp belum berwarna biru?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                WhatsApp memiliki proteksi anti-spam di mana tautan dari <strong>nomor yang belum tersimpan di kontak HP</strong> awalnya dimatikan (berwarna teks biasa).
              </p>
              <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-sky-100 dark:border-sky-900/50 text-slate-700 dark:text-slate-300 space-y-1.5 shadow-xs">
                <div className="font-bold text-sky-700 dark:text-sky-400 text-[11px]">
                  💡 2 Cara Mudah Mengaktifkannya:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li><strong>Simpan nomor pengirim</strong> ke kontak buku telepon HP, ATAU</li>
                  <li><strong>Balas pesan tersebut 1 kali</strong> (misal balas: <em>"Wa'alaikumussalam"</em> atau <em>"Ok"</em>).</li>
                </ol>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium pt-0.5 border-t border-slate-100 dark:border-slate-800">
                  ✓ Seketika seluruh tautan di obrolan akan otomatis berubah menjadi warna biru aktif & bisa langsung diklik!
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
                <span>Buka Tautan Sekarang (Masuk ke Portal Wali Santri)</span>
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
          /* REGISTRATION & LINK GENERATOR FORM (Scalev Theme) */
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
                    Format: 08... atau 628...
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-sky-500 rounded-2xl text-xs sm:text-sm text-sky-600 dark:text-sky-400 font-mono outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Children Data Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-sky-500" />
                      <span>Data Ananda di Pesantren</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mendukung 1 tautan untuk memantau lebih dari 1 anak
                    </p>
                  </div>

                  <span className="text-[11px] bg-slate-100 dark:bg-slate-950 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-bold">
                    {children.length} Santri
                  </span>
                </div>

                {/* Children inputs list */}
                <div className="space-y-3">
                  {children.map((child, index) => (
                    <div 
                      key={child.id}
                      className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1">
                          <span>Santri #{index + 1}</span>
                          {index === 0 && <span className="text-slate-400 text-[10px] font-normal">(Anak Pertama)</span>}
                        </span>

                        {children.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(child.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
                            title="Hapus data santri ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                            Nama Santri:
                          </label>
                          <input
                            type="text"
                            required
                            value={child.name}
                            onChange={(e) => handleChildChange(child.id, 'name', e.target.value)}
                            placeholder="Nama Lengkap Ananda"
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
                            placeholder="Contoh: 202401001 atau ISB-..."
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

              {/* Info Notice (Scalev Style) */}
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/25 rounded-2xl text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Seperti pada aplikasi <strong>Scalev E-Payment</strong>, setelah Anda menekan tombol di bawah, sistem secara otomatis men-generate tautan khusus dan membukanya langsung ke WhatsApp Anda.
                </div>
              </div>

              {/* Main Submit Button (Scalev Blue) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-sky-500/30 flex items-center justify-center gap-2.5 transition-transform active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Link Login ke WhatsApp Saya</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer & Staff Login Modal Trigger */}
      <div className="max-w-md w-full mx-auto text-center pt-2 pb-3 space-y-2">
        <button
          type="button"
          onClick={() => setShowStaffModal(true)}
          className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Akses Petugas & Super Admin Ma'had</span>
        </button>

        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Maisya-Saku • Ma'had Imam Syafi'i Brebes • Dilindungi PIN & Biometrik Touchscreen
        </div>
      </div>

      {/* MODAL: STAFF & ADMIN ACCESS */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Akses Petugas & Admin</h3>
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
              Pilih akun petugas atau masukkan token akun Anda untuk masuk:
            </p>

            {/* Quick Staff Roles List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {roleAccounts.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleStaffRoleSelect(role.token)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <InitialsAvatar
                    name={role.name}
                    src={role.avatar}
                    className="w-8 h-8 text-[11px]"
                    rounded="rounded-lg"
                  />
                  <div className="overflow-hidden flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{role.name}</div>
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 truncate">{role.title}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">#{role.token}</span>
                </button>
              ))}
            </div>

            {/* Manual Token Input */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                Atau Ketik Token Langsung:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={staffTokenInput}
                  onChange={(e) => setStaffTokenInput(e.target.value)}
                  placeholder="admin-isb-2026"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-sky-700 dark:text-sky-300 outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (staffTokenInput.trim()) {
                      handleStaffRoleSelect(staffTokenInput.trim());
                    }
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-2 rounded-xl text-xs"
                >
                  Masuk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
