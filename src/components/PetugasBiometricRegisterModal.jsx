import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Fingerprint, 
  CheckCircle2, 
  Send, 
  X, 
  User, 
  Phone, 
  Briefcase, 
  Clock, 
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';
import { formatPhoneNumber, openWhatsAppDirect } from '../utils/whatsapp';
import BiometricTouchPad from './BiometricTouchPad';
import confetti from 'canvas-confetti';

const ROLE_OPTIONS = [
  { id: 'kantin', label: 'Kasir Kantin Santri', icon: '🏪' },
  { id: 'laundry', label: 'Petugas Laundry Pesantren', icon: '🧺' },
  { id: 'wartel', label: 'Operator Wartel Santri', icon: '☎️' },
  { id: 'spp', label: 'Kasir SPP & Syahriyah', icon: '💳' },
  { id: 'kiosk', label: 'Petugas Kiosk Anjungan Mandiri', icon: '🖥️' }
];

export default function PetugasBiometricRegisterModal({ isOpen, onClose }) {
  const { registerPetugasBiometric, pesantrenInfo, showToast } = useApp();

  const [name, setName] = useState('');
  const [role, setRole] = useState('kantin');
  const [phone, setPhone] = useState('');
  const [recordedFingerCode, setRecordedFingerCode] = useState(null);
  const [step, setStep] = useState('form'); // 'form' | 'fingerprint' | 'success'
  const [createdResult, setCreatedResult] = useState(null);

  if (!isOpen) return null;

  const handleProceedToFingerprint = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama Petugas wajib diisi.', 'error');
      return;
    }
    const clean = formatPhoneNumber(phone);
    if (!clean || clean.length < 8) {
      showToast('Nomor WhatsApp petugas tidak valid (minimal 8 digit).', 'error');
      return;
    }
    playSound('beep');
    setStep('fingerprint');
  };

  const handleFingerprintVerified = async (method, code) => {
    try {
      const generatedCode = code || `FP-STAFF-${role.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      setRecordedFingerCode(generatedCode);

      const result = await registerPetugasBiometric({
        name: name.trim(),
        role,
        phone: formatPhoneNumber(phone),
        fingerprintCode: generatedCode
      });

      setCreatedResult(result);
      setStep('success');
      confetti({ particleCount: 70, spread: 60 });
      showToast('Pendaftaran biometrik petugas berhasil diajukan!', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal mendaftarkan biometrik petugas.', 'error');
    }
  };

  const handleSendWAConfirmation = () => {
    if (!createdResult) return;
    const adminPhone = pesantrenInfo.whatsappAdmin || '6282119836050';
    const selectedRoleObj = ROLE_OPTIONS.find(r => r.id === role);
    const roleTitle = selectedRoleObj ? selectedRoleObj.label : role;

    const msg = 
      `Assalamu'alaikum Warahmatullahi Wabarakatuh Super Admin Ma'had Imam Syafi'i Brebes.\n\n` +
      `Saya ingin mengajukan verifikasi pendaftaran sidik jari biometrik petugas baru:\n` +
      `Nama Petugas: *${createdResult.name}*\n` +
      `Tugas / Peran: *${roleTitle}*\n` +
      `Nomor WhatsApp: *+${createdResult.phone}*\n` +
      `Kode Sidik Jari Unik: *${createdResult.fingerprintCode}*\n` +
      `Token Akses: *#${createdResult.token}*\n\n` +
      `Saya telah merekam sidik jari fisik pada portal Maisya-Saku. Mohon kesediaan Super Admin untuk menyetujui akun petugas ini di menu Verifikasi Biometrik Petugas agar saya dapat login bertugas.\n\n` +
      `Jazakumullahu khairan.`;

    openWhatsAppDirect(adminPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200 relative transition-colors max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Pendaftaran Biometrik Petugas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perekaman sidik jari petugas Ma'had Imam Syafi'i Brebes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: FORM IDENTITAS PETUGAS */}
        {step === 'form' && (
          <form onSubmit={handleProceedToFingerprint} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-500" />
                <span>Nama Lengkap Petugas:</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Akhi Ahmad (Petugas Kantin)"
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-sans text-slate-900 dark:text-white focus:border-sky-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                <span>Pilihan Pos / Peran Tugas:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRole(opt.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      role === opt.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-sky-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-500" />
                <span>Nomor WhatsApp Aktif Petugas:</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-sans text-slate-900 dark:text-white focus:border-sky-500 outline-none font-mono"
              />
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/60 rounded-xl border border-sky-200 dark:border-sky-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-sky-500" />
                <span>Ketentuan Login Petugas:</span>
              </div>
              <p>
                Sesuai kebijakan keamanan kasir pesantren, petugas wajib merekam sidik jari dan disetujui Super Admin sebelum dapat membuka kasir operasional.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-transform active:scale-98"
            >
              <span>Lanjut: Rekam Sidik Jari Petugas</span>
              <Fingerprint className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: REKAM SIDIK JARI */}
        {step === 'fingerprint' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
                Langkah 2: Rekam Sidik Jari Fisik
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Tempelkan Sidik Jari Petugas
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perekaman untuk: <strong>{name}</strong> ({ROLE_OPTIONS.find(r => r.id === role)?.label})
              </p>
            </div>

            <BiometricTouchPad
              santriName={name}
              title="Rekam Sidik Jari Petugas"
              subtitle="Sentuh & tahan sensor sidik jari pada layar sentuh hingga proses pemindaian 100%"
              isEnrollment={true}
              onVerified={handleFingerprintVerified}
            />

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold underline text-center"
            >
              Kembali ke Formulir
            </button>
          </div>
        )}

        {/* STEP 3: SUKSES & KONFIRMASI KE WA ADMIN */}
        {step === 'success' && createdResult && (
          <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                Menunggu Persetujuan Super Admin
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white pt-2">
                Perekaman Sidik Jari Berhasil!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                Data biometrik petugas <strong>{createdResult.name}</strong> telah disimpan di database. Silakan kirim konfirmasi ke WhatsApp Super Admin Ma'had untuk mengaktifkan akun kasir Anda.
              </p>
            </div>

            {/* Account Details Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Petugas:</span>
                <span className="font-bold text-slate-900 dark:text-white">{createdResult.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peran Tugas:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{createdResult.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Sidik Jari:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                  {createdResult.fingerprintCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token Akses:</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  #{createdResult.token}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSendWAConfirmation}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim Permohonan ke WhatsApp Super Admin</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
