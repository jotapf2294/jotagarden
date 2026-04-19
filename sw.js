const CACHE_NAME = 'jotagarden-v6-cache';
// Lista de ficheiros para guardar no telemóvel
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './db.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/dexie@4.0.8/dist/dexie.min.js'
];

// Instalação: Guarda os ficheiros no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 JotaGarden: Ficheiros guardados para uso offline');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Interceção: Serve do cache se estiver offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});