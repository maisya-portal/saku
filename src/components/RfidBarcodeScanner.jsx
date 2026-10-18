import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, ScanLine, Search, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useApp, playSound } from '../context/AppContext';

export default function RfidBarcodeScanner({ onSelectSantri, selectedSantri = null, autoFocus = true }) {
  const { santriList } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'rfid' | 'barcode'
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Listen to USB RFID/Barcode scanner input (they type very fast and send 'Enter')
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = searchTerm.trim().toUpperCase();
      if (!val) return;

      // Find by RFID, Barcode, or NIS
      const found = santriList.find(s => {
        if (!s) return false;
        return (
          (s.rfidTag || '').toUpperCase() === val || 
          (s.barcode || '').toUpperCase() === val || 
          (s.nis || '') === val ||
          (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      if (found) {
        playSound('beep');
        onSelectSantri(found);
        setSearchTerm('');
      } else {
        playSound('error');
      }
    }
  };

  const filteredSantri = santriList.filter(s => {
    if (!s) return false;
    const term = (searchTerm || '').toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.nis || '').toLowerCase().includes(term) ||
      (s.class || '').toLowerCase().includes(term) ||
      (s.rfidTag || '').toLowerCase().includes(term) ||
      (s.barcode || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-sky-600" />
          <span>Pilih / Tap Kartu Santri (RFID / Barcode / Cari)</span>
        </label>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
          Support USB RFID & Scanner Barcode
        </span>
      </div>

      {/* Input scanner with status icon */}
      <div className="relative mb-3">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tap Kartu RFID, scan Barcode, atau ketik Nama / NIS..."
          className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-sky-500/40 focus:border-sky-600 focus:bg-white rounded-xl text-sm font-semibold outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
        />
        <CreditCard className="w-5 h-5 text-sky-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Demo Test Buttons for Easy Simulation */}
      <div className="mb-3">
        <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Simulasi Tap Cepat Kartu Santri (Klik salah satu):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {santriList.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                playSound('beep');
                onSelectSantri(s);
              }}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                selectedSantri?.id === s.id
                  ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                  : 'bg-sky-50/70 hover:bg-sky-100/70 text-sky-900 border-sky-200'
              }`}
            >
              🏷️ {s.name.split(' ')[0]} ({s.class.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Selected Santri Preview Card */}
      {selectedSantri ? (
        <div className="bg-sky-50 border-2 border-sky-500/50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedSantri.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt={selectedSantri.name}
              className="w-12 h-12 rounded-xl object-cover border border-sky-300"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 leading-tight">{selectedSantri.name}</h4>
                <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  TERPILIH
                </span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-sky-800">NIS: {selectedSantri.nis}</span>
                <span>•</span>
                <span className="bg-white px-2 py-0.5 rounded text-slate-700 border border-slate-200 font-medium">
                  {selectedSantri.class}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                RFID: <code className="bg-white px-1 py-0.2 rounded border">{selectedSantri.rfidTag}</code> | 
                Barcode: <code className="bg-white px-1 py-0.2 rounded border">{selectedSantri.barcode}</code>
              </div>
            </div>
          </div>
          <div className="text-right pl-2">
            <div className="text-[11px] text-slate-500 font-medium">Saldo Tersedia</div>
            <div className="text-lg font-black text-sky-700">
              Rp {selectedSantri.balance.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
          {filteredSantri.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Santri tidak ditemukan dengan kata kunci "{searchTerm}".
            </div>
          ) : (
            filteredSantri.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  playSound('beep');
                  onSelectSantri(s);
                }}
                className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{s.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-mono text-sky-700 font-semibold">NIS: {s.nis}</span>
                      <span>•</span>
                      <span>{s.class}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-sky-700">
                    Rp {s.balance.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {s.rfidTag}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
