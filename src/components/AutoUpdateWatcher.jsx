import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function AutoUpdateWatcher() {
  const { showToast } = useApp();
  const checkingRef = useRef(false);
  const currentBuildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : null;

  useEffect(() => {
    if (!currentBuildTime) return;

    const checkForUpdates = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        const res = await fetch(`./version.json?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (res.ok) {
          const remote = await res.json();
          if (remote && remote.buildTime && String(remote.buildTime) !== String(currentBuildTime)) {
            console.log('[AutoUpdateWatcher] Versi baru terdeteksi:', remote.buildTime, 'vs', currentBuildTime);
            showToast('Pembaruan sistem terdeteksi! Memperbarui aplikasi otomatis...', 'info');

            // Hapus semua cache storage di browser
            if ('caches' in window) {
              try {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
              } catch (e) {}
            }

            // Unregister service worker lama agar worker baru mengambil alih
            if ('serviceWorker' in navigator) {
              try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let reg of registrations) {
                  await reg.unregister();
                }
              } catch (e) {}
            }

            localStorage.setItem('maisya_build_version', String(remote.buildTime));

            // Reload bersih dengan cache buster _ts
            setTimeout(() => {
              window.location.replace(window.location.pathname + '?_ts=' + remote.buildTime + window.location.hash);
            }, 600);
          }
        }
      } catch (err) {
        // Offline / mode tanpa jaringan
      } finally {
        checkingRef.current = false;
      }
    };

    // Cek langsung saat pertama kali komponen mount
    checkForUpdates();

    // Cek setiap kali tab aktif kembali / layar HP dinyalakan / online
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    window.addEventListener('focus', checkForUpdates);
    window.addEventListener('online', checkForUpdates);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cek berkala di latar belakang setiap 15 detik
    const interval = setInterval(checkForUpdates, 15000);

    return () => {
      window.removeEventListener('focus', checkForUpdates);
      window.removeEventListener('online', checkForUpdates);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [currentBuildTime, showToast]);

  return null;
}
