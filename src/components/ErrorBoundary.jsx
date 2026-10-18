import React from 'react';
import { RefreshCw, Home, AlertCircle, MessageSquare } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Maisya-Saku Portal Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // Clear legacy localStorage cache that might have triggered an invalid state
    try {
      localStorage.removeItem('maisya_purged_dummy_clean_v5');
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '';
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center gap-3">
              <img 
                src="./logo-maisya.jpg" 
                alt="Logo Maisya" 
                className="w-12 h-12 rounded-2xl object-cover border border-sky-300 dark:border-sky-800 shadow-sm"
              />
              <div className="text-left">
                <div className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Maisya-Saku
                </div>
                <div className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
                  Ma'had Imam Syafi'i Brebes
                </div>
              </div>
            </div>

            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Memulihkan Tampilan Portal
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Aplikasi mendeteksi pembaruan data atau cache sesi sebelumnya. Silakan klik tombol di bawah untuk menyegarkan dan memuat ulang portal dengan lancar.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Segarkan & Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Beranda Utama</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <span>Bantuan Admin:</span>
              <a
                href="https://wa.me/6282119836050?text=Assalamu%27alaikum%20Admin%2C%20saya%20mengalami%20kendala%20di%20portal%20Maisya-Saku."
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp 0821-1983-6050</span>
              </a>
            </div>

            {/* Error detail for debugging if needed */}
            {this.state.error && (
              <details className="text-left text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <summary className="cursor-pointer font-mono font-medium hover:text-slate-600">Info Teknis (Diagnostik)</summary>
                <div className="mt-1 font-mono text-rose-500 break-all select-all">
                  {this.state.error?.toString()}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
