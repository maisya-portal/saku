import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Phone, 
  Smartphone, 
  Globe 
} from 'lucide-react';
import { formatPhoneNumber, openWhatsAppDirect } from '../utils/whatsapp';

export default function WhatsAppDispatchModal({
  isOpen,
  onClose,
  title = "Kirim Pesan WhatsApp",
  recipientName = "",
  initialPhone = "",
  defaultMessage = "",
  onSavePhone = null,
  showToast = () => {}
}) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [message, setMessage] = useState(defaultMessage || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cleanPhone = formatPhoneNumber(phoneNumber);

  const handleSendDirectApp = () => {
    if (!cleanPhone) {
      showToast('Masukkan nomor WhatsApp yang valid.', 'error');
      return;
    }

    // Save phone if callback provided
    if (onSavePhone) {
      onSavePhone(phoneNumber);
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Nomor WhatsApp Tujuan:
            </label>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              Bisa langsung diubah
            </span>
          </div>

          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Contoh: 08123456789 atau 628123456789"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Format terdeteksi: <code className="font-mono text-emerald-800 font-bold">+{cleanPhone || '...'}</code>
          </div>
        </div>

        {/* Message Preview & Edit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Isi Pesan WhatsApp:
            </label>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Pesan'}</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-800 outline-none font-sans leading-relaxed"
          />
        </div>

        {/* Dispatch Options */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSendDirectApp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <Smartphone className="w-4 h-4" />
            <span>Buka Langsung Aplikasi WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleSendWeb}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Buka di WhatsApp Web (Browser)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
