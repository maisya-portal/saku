import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Copy, Check, X, Phone, User, AlertCircle } from 'lucide-react';
import { formatPhoneNumber, openWhatsAppDirect } from '../utils/whatsapp';

export default function WhatsAppMessageModal({
  isOpen,
  onClose,
  recipientName = 'Admin Ma\'had',
  recipientRole = 'Layanan Pesantren',
  phoneNumber = '6282119836050',
  initialMessage = '',
  title = 'Pratinjau & Konfirmasi Pesan WhatsApp'
}) {
  const [message, setMessage] = useState(initialMessage);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage, isOpen]);

  if (!isOpen) return null;

  const cleanPhone = formatPhoneNumber(phoneNumber);

  const handleCopy = () => {
    if (!message) return;
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToWhatsApp = () => {
    if (!cleanPhone) return;
    // Copy to clipboard as a safety backup so user doesn't lose modifications
    try {
      navigator.clipboard.writeText(message);
    } catch (e) {
      // ignore
    }

    // Launch WhatsApp
    openWhatsAppDirect(cleanPhone, message);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 relative transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tinjau atau sesuaikan isi pesan sebelum dikirimkan ke WhatsApp resmi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient Details Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-slate-900 dark:text-white leading-tight">
                {recipientName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {recipientRole}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/90 px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800">
            <Phone className="w-3 h-3 shrink-0" />
            <span>+{cleanPhone}</span>
          </div>
        </div>

        {/* Editable Message Form */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Form Isi Pesan WhatsApp:
            </label>
            <span className="text-[10px] text-slate-400">
              Dapat diedit / ditambah catatan
            </span>
          </div>
          <textarea
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tuliskan pesan atau catatan yang ingin disampaikan..."
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-sans text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none leading-relaxed resize-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>Teks pesan otomatis disalin ke clipboard saat Anda menekan tombol kirim.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Pesan Tersalin!' : 'Salin Pesan Saja'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendToWhatsApp}
            className="w-full flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>Kirim ke WhatsApp Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
