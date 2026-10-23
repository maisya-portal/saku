import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

const buildTime = Date.now();
process.env.VITE_BUILD_TIME = String(buildTime);

try {
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }

  // 1. Write version.json
  fs.writeFileSync('public/version.json', JSON.stringify({
    version: '1.0.7',
    buildTime: buildTime,
    builtAt: new Date().toISOString()
  }, null, 2));

  // 2. Generate public/sw.js with dynamic CACHE_NAME based on buildTime
  const swTemplate = `// Maisya-Saku Service Worker (Build: ${buildTime})
const BUILD_TIME = '${buildTime}';
const CACHE_NAME = 'maisya-saku-v' + BUILD_TIME;
const STATIC_ASSETS = [
  './manifest.json',
  './favicon.png',
  './favicon-32x32.png',
  './favicon-16x16.png',
  './icon-192.png',
  './icon-512.png',
  './logo-maisya.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Let network handle Firebase APIs, Firestore, auth, or version.json directly
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('version.json') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // 1. Navigation / HTML requests: ALWAYS NETWORK FIRST without HTTP disk cache
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === 'GET'
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
`;
  fs.writeFileSync('public/sw.js', swTemplate);
} catch (e) {
  console.warn('Failed to write version.json or sw.js:', e);
}

// Vite plugin to inject build time into index.html
const htmlVersionPlugin = () => ({
  name: 'html-version-transform',
  transformIndexHtml(html) {
    return html.replace(/%VITE_BUILD_TIME%/g, String(buildTime));
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    htmlVersionPlugin(),
  ],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTime)
  },
  base: './', // Ensures assets load cleanly on GitHub Pages and local preview
})
