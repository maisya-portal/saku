import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  Sparkles, 
  User, 
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';

const PRESET_AVATARS = [
  // Santri Putra / Ikhwan
  { id: 'av-1', label: 'Santri Fatih', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-2', label: 'Santri Hamzah', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-3', label: 'Santri Zaid', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-4', label: 'Santri Umar', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80' },
  // Wali Santri / Dewasa
  { id: 'av-5', label: 'Wali Santri (Abu)', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-6', label: 'Wali Santri (Ummu)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-7', label: 'Wali Santri Elegan', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-8', label: 'Wali Santri Bersahaja', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
  // Petugas & Pengelola
  { id: 'av-9', label: 'Petugas Kantin', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-10', label: 'Petugas Laundry', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-11', label: 'Petugas Wartel', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-12', label: 'Kasir SPP', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80' },
  // Ilustrasi Karakter & Islami
  { id: 'av-13', label: 'Ilustrasi Santri Cerdas', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-14', label: 'Ilustrasi Hafidz', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-15', label: 'Simbol Masjid & Berkah', url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-16', label: 'Logo Resmi Ma\'had', url: './logo-maisya.jpg' }
];

export default function AvatarEditorModal({
  isOpen,
  onClose,
  currentAvatar,
  onSaveAvatar,
  title = 'Ganti Foto Avatar Akun'
}) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || PRESET_AVATARS[0].url);
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'upload' | 'url'
  const [customUrl, setCustomUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle local image file upload & compression
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Harap pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    setUploadError('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to 200x200 canvas for fast loading & compact storage
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setSelectedAvatar(compressedDataUrl);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setUploadError('Gagal memproses gambar. Silakan coba file lain.');
        setIsProcessing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
  };

  const handleSave = () => {
    if (selectedAvatar) {
      onSaveAvatar(selectedAvatar);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 relative transition-colors max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sesuaikan foto profil akun Anda
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

        {/* Live Preview Card */}
        <div className="flex items-center justify-center py-2 shrink-0">
          <div className="relative group">
            <img 
              src={selectedAvatar} 
              alt="Pratinjau Avatar" 
              className="w-24 h-24 rounded-3xl object-cover border-4 border-sky-400 dark:border-sky-500 shadow-xl shadow-sky-500/20"
            />
            <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-1 rounded-full shadow-md border-2 border-white dark:border-slate-900">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Pilihan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link URL</span>
          </button>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3">
          {activeTab === 'gallery' && (
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative p-1 rounded-2xl border-2 transition-all hover:scale-105 ${
                    selectedAvatar === av.url
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/70 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-sky-300'
                  }`}
                  title={av.label}
                >
                  <img 
                    src={av.url} 
                    alt={av.label} 
                    className="w-full h-14 rounded-xl object-cover" 
                  />
                  {selectedAvatar === av.url && (
                    <div className="absolute top-1.5 right-1.5 bg-sky-500 text-white p-0.5 rounded-full shadow-xs">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                  <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate mt-1 text-center">
                    {av.label.split(' ')[0]}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3 text-center py-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-8 border-2 border-dashed border-sky-300 dark:border-sky-700 hover:border-sky-500 rounded-3xl bg-sky-50/50 dark:bg-sky-950/30 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-700 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isProcessing ? 'Memproses gambar...' : 'Pilih Foto dari Galeri / Kamera HP'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Mendukung format JPG, PNG, atau WEBP
                </div>
              </button>

              {uploadError && (
                <div className="text-xs text-rose-500 font-medium">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-3 py-2">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Masukkan Tautan Gambar (URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/foto.jpg"
                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-sans text-slate-900 dark:text-white focus:border-sky-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors shrink-0"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="w-1/2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Avatar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
