import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Handle chunk loading error across deployments (jika chunk lama terhapus di server)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite module preload error detected. Auto-refreshing for newest version...', event);
  if ('caches' in window) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
      window.location.reload();
    });
  } else {
    window.location.reload();
  }
});

// Register PWA Service Worker with auto-update
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(
      (registration) => {
        registration.update().catch(() => {});
        setInterval(() => {
          registration.update().catch(() => {});
        }, 30000);
      },
      (err) => {
        console.warn('Maisya-Saku ServiceWorker registration failed: ', err);
      }
    );
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
