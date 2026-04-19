const CACHE_NAME = 'jotagarden-v8';
const ASSETS = [
  '/jotagarden/',
  '/jotagarden/index.html',
  '/jotagarden/app.js',
  '/jotagarden/db.js',
  '/jotagarden/manifest.json',
  'https://cdn.jsdelivr.net/npm/dexie@4.0.8/dist/dexie.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ App pronta para modo voo');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => k !== CACHE_NAME && caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => {
        // Se estiver totalmente offline e não houver cache
        if (e.request.mode === 'navigate') {
          return caches.match('/jotagarden/index.html');
        }
      });
    })
  );
});
