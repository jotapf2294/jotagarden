// sw.js - O cérebro Offline
const CACHE_NAME = 'doce-gestao-v5';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  './js/modules/dashboard.js',
  './js/modules/receitas/index.js',
  './js/modules/agenda/index.js',
  './js/modules/gestao/index.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
