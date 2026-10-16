import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Phone, 
  Smartphone, 
  Globe,
  Link2,
  Sparkles,
  Info
} from 'lucide-react';
import { formatPhoneNumber, openWhatsAppDirect } from '../utils/whatsapp';

export default function WhatsAppDispatchModal({
  isOpen,
  onClose,
  title = "Kirim Pesan WhatsApp",
  recipientName = "",
  initialPhone = "",
  token = "",
  pin = "",
  isRole = true,
  onSavePhone = null,
  showToast = () => {}
}) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [urlMode, setUrlMode] = useState('online'); // 'online' | 'localhost' | 'custom'
  const [customDomain, setCustomDomain] = useState(() => {
    return localStorage.getItem('maisya_public_domain') || 'https://ponpes-imamsyafii.github.io/maisya-saku/';
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPhoneNumber(initialPhone || '');
  }, [initialPhone]);

  if (!isOpen) return null;

  const cleanPhone = formatPhoneNumber(phoneNumber);

  // Compute Active URL based on user preference
  const localhostBase = `${window.location.origin}${window.location.pathname}`;
  const effectiveBase = urlMode === 'localhost' 
    ? localhostBase 
    : (customDomain.endsWith('/') ? customDomain : `${customDomain}/`);

  const magicLink = `${effectiveBase}#token=${token}`;

  // Formatted Message without broken emoji, with URL on its own line for WhatsApp auto-hyperlinking
  const message = isRole
    ? `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. *${recipientName}*\n` +
      `Berikut adalah Tautan Masuk Resmi (Magic Link) Anda pada sistem Maisya-Saku Ma'had Imam Syafi'i Brebes:\n\n` +
      `Klik tautan di bawah ini:\n` +
      `${magicLink}\n\n` +
      `PIN Masuk Anda: *${pin}*\n` +
      `(Anda juga dapat masuk menggunakan sensor sidik jari pada layar HP/tablet).\n\n` +
      `Harap jaga kerahasiaan tautan dan PIN ini.`
    : `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. Bapak/Ibu *${recipientName}*\n` +
      `Berikut adalah Tautan Portal Keuangan Santri Maisya-Saku Ma'had Imam Syafi'i Brebes:\n\n` +
      `Klik tautan di bawah ini:\n` +
      `${magicLink}\n\n` +
      `PIN Masuk: *${pin || '1234'}* (atau gunakan sensor sidik jari di HP/tablet)\n\n` +
      `Melalui tautan ini Anda dapat memantau saldo realtime, membatasi jajan ananda, dan konfirmasi transfer uang saku.\n` +
      `Jazakumullahu khairan.`;

  const handleSendDirectApp = () => {
    if (!cleanPhone) {
      showToast('Masukkan nomor WhatsApp yang valid.', 'error');
      return;
    }

    if (onSavePhone) {
      onSavePhone(phoneNumber);
    }

    // Persist custom domain if changed
    if (customDomain) {
      localStorage.setItem('maisya_public_domain', customDomain);
    }

    openWhatsAppDirect(cleanPhone, message);
    showToast('Membuka aplikasi WhatsApp...', 'info');
    onClose();
  };

  const handleSendWeb = () => {
    if (!cleanPhone) {
      showToast('Masukkan nomor WhatsApp yang valid.', 'error');
      return;
    }

    if (onSavePhone) {
      onSavePhone(phoneNumber);
    }

    if (customDomain) {
      localStorage.setItem('maisya_public_domain', customDomain);
    }

    const encoded = encodeURIComponent(message);
    const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    window.open(webUrl, '_blank');
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    showToast('Teks pesan & tautan berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Penerima: <strong className="text-slate-800">{recipientName}</strong></p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editable Phone Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Nomor WhatsApp Tujuan:
            </label>
            <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded">
              Bisa langsung diganti
            </span>
          </div>

          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Contoh: 08123456789 atau 628123456789"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 focus:border-sky-600 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Format terdeteksi: <code className="font-mono text-sky-800 font-bold">+{cleanPhone || '...'}</code>
          </div>
        </div>

        {/* Domain / Link Target Selector (Fixes WhatsApp localhost unclickable issue!) */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-sky-600" />
              <span>Format Alamat Link di WhatsApp:</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setUrlMode('online')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                urlMode === 'online'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>🌐 Domain / GitHub Pages</span>
              </div>
              <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                (Tautan Biru Aktif Bisa Diklik di WA)
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUrlMode('localhost')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                urlMode === 'localhost'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <div>💻 Localhost Laptop</div>
              <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                (Hanya untuk dibuka di browser laptop)
              </div>
            </button>
          </div>

          {urlMode === 'online' && (
            <div className="pt-1">
              <div className="text-[11px] text-slate-600 mb-1 font-semibold">
                Alamat Web Pesantren / GitHub Pages Anda:
              </div>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="https://username.github.io/maisya-saku/"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-mono text-sky-800 outline-none focus:border-sky-600"
              />
              <div className="text-[10px] text-slate-400 mt-1 flex items-start gap-1">
                <Info className="w-3 h-3 text-sky-600 shrink-0 mt-0.5" />
                <span>WhatsApp otomatis menjadikan alamat HTTPS / domain publik sebagai link biru yang bisa langsung diklik oleh penerima di HP mereka.</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Preview & Edit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Isi Pesan WhatsApp yang Dikirim:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(magicLink);
                  showToast('Tautan Magic Link saja berhasil disalin!', 'success');
                }}
                className="text-[11px] font-bold text-slate-600 hover:text-sky-700 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
                title="Salin hanya URL tautan"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Salin Tautan Saja</span>
              </button>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin Semua'}</span>
              </button>
            </div>
          </div>

          <div className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto select-all">
            {message}
          </div>
        </div>

        {/* Dispatch Options */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSendDirectApp}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <Smartphone className="w-4 h-4" />
            <span>Buka Langsung Aplikasi WhatsApp</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (!cleanPhone) {
                  showToast('Masukkan nomor WhatsApp yang valid.', 'error');
                  return;
                }
                if (onSavePhone) onSavePhone(phoneNumber);
                const encoded = encodeURIComponent(message);
                window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
                onClose();
              }}
              className="bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-sky-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
              <span>Buka via wa.me</span>
            </button>

            <button
              type="button"
              onClick={handleSendWeb}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>WhatsApp Web</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              window.open(magicLink, '_blank');
            }}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Uji Buka Tautan Ini di Tab Baru (Test Login)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
