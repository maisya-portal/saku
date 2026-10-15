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
  Info
} from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import { formatPhoneNumber, openWhatsAppDirect } from '../utils/whatsapp';
import confetti from 'canvas-confetti';

export default function WaliLinkGenerator({ onOpenStaffLogin }) {
  const { pesantrenInfo, registerWaliSantri, roleAccounts, setUrlToken, showToast } = useApp();

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
        `1. Klik tautan di atas\n` +
        `2. Daftarkan sidik jari Anda di layar HP/tablet\n` +
        `3. Setelah disetujui Admin, Anda dapat memantau saldo & membatasi jajan ananda secara realtime.\n\n` +
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
    window.location.hash = `token=${generatedResult.token}`;
  };

  const handleStaffRoleSelect = (token) => {
    window.location.hash = `token=${token}`;
    setShowStaffModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <div className="max-w-xl w-full mx-auto text-center pt-3 pb-2">
        <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Portal Pembuatan Tautan Akses Wali Santri</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {pesantrenInfo.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Dapatkan Tautan Masuk Resmi (Magic Link) otomatis dikirimkan ke WhatsApp Anda untuk memantau keuangan ananda.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="max-w-xl w-full mx-auto my-auto py-4">
        {generatedResult ? (
          /* SUCCESS RESULT CARD */
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-emerald-500/50 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-900/60 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-black text-white">
                Tautan Berhasil Dibuat!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tautan resmi telah dibuat untuk <strong className="text-emerald-400">{generatedResult.parentName}</strong> dan dialihkan ke WhatsApp nomor: <strong className="text-white font-mono">+{generatedResult.cleanPhone}</strong>
              </p>
            </div>

            {/* Link Preview Box */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Tautan Masuk Anda:</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Tautan Aktif
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all">
                {generatedResult.fullLink}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleOpenLinkNow}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <span>Buka Tautan Sekarang (Lanjut Verifikasi Sidik Jari)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openWhatsAppDirect(generatedResult.cleanPhone, generatedResult.waMessage)}
                  className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kirim Ulang ke WA</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-slate-700 hover:bg-slate-650 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setGeneratedResult(null)}
                className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 font-medium"
              >
                ← Buat Tautan untuk Wali Santri Lainnya
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION & LINK GENERATOR FORM */
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Parent Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nama Lengkap Wali Santri / Orang Tua:</span>
                </label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Contoh: dr. Hendra Pratama / H. Bambang Irawan"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-2xl text-xs sm:text-sm text-white outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Parent WhatsApp */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nomor WhatsApp Wali Santri (Aktif):</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded font-semibold border border-emerald-900">
                    Format: 08... atau 628...
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-2xl text-xs sm:text-sm text-emerald-400 font-mono outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Children Data Section */}
              <div className="pt-2 border-t border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-400" />
                      <span>Data Ananda di Pesantren</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Mendukung 1 tautan untuk memantau lebih dari 1 anak
                    </p>
                  </div>

                  <span className="text-[11px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-bold">
                    {children.length} Santri
                  </span>
                </div>

                {/* Children inputs list */}
                <div className="space-y-3">
                  {children.map((child, index) => (
                    <div 
                      key={child.id}
                      className="p-3.5 sm:p-4 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-3 relative transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <span>Santri #{index + 1}</span>
                          {index === 0 && <span className="text-slate-500 text-[10px] font-normal">(Anak Pertama)</span>}
                        </span>

                        {children.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(child.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                            title="Hapus data santri ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-medium mb-1">
                            Nama Santri:
                          </label>
                          <input
                            type="text"
                            required
                            value={child.name}
                            onChange={(e) => handleChildChange(child.id, 'name', e.target.value)}
                            placeholder="Nama Lengkap Ananda"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white outline-none placeholder:text-slate-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 font-medium mb-1 flex items-center gap-1">
                            <Hash className="w-3 h-3 text-emerald-500" />
                            <span>Nomor ISB Santri (NIS):</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={child.isb}
                            onChange={(e) => handleChildChange(child.id, 'isb', e.target.value)}
                            placeholder="Contoh: 202401001 atau ISB-..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs font-mono text-emerald-300 outline-none placeholder:text-slate-600"
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
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-dashed border-emerald-500/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Data Anak (Jika Anak Lebih Dari 1)</span>
                </button>
              </div>

              {/* Info Notice (Scalev / Xendit Style) */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl text-[11px] text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Seperti pada aplikasi <strong>Scalev / Xendit Gateway</strong>, setelah Anda menekan tombol di bawah, sistem secara otomatis men-generate tautan khusus dan membukanya langsung ke WhatsApp Anda.
                </div>
              </div>

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-transform active:scale-98"
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
          className="text-slate-400 hover:text-emerald-400 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Akses Petugas & Super Admin Ma'had</span>
        </button>

        <div className="text-[11px] text-slate-500">
          Maisya-Saku • Ma'had Imam Syafi'i Brebes • Dilindungi PIN & Biometrik Touchscreen
        </div>
      </div>

      {/* MODAL: STAFF & ADMIN ACCESS */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Akses Petugas & Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pilih akun petugas atau masukkan token akun Anda untuk masuk:
            </p>

            {/* Quick Staff Roles List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {roleAccounts.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleStaffRoleSelect(role.token)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 flex items-center gap-2.5 transition-colors"
                >
                  <img
                    src={role.avatar}
                    alt={role.name}
                    className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40"
                  />
                  <div className="overflow-hidden flex-1">
                    <div className="text-xs font-bold text-white truncate">{role.name}</div>
                    <div className="text-[10px] text-emerald-400 truncate">{role.title}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">#{role.token}</span>
                </button>
              ))}
            </div>

            {/* Manual Token Input */}
            <div className="pt-2 border-t border-slate-700">
              <label className="block text-[11px] text-slate-400 font-medium mb-1">
                Atau Ketik Token Langsung:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={staffTokenInput}
                  onChange={(e) => setStaffTokenInput(e.target.value)}
                  placeholder="admin-isb-2026"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (staffTokenInput.trim()) {
                      handleStaffRoleSelect(staffTokenInput.trim());
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs"
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
