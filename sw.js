const CACHE = 'babe-v1';
const FILES = [
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/db.js',
  'js/receitas.js',
  'js/calc.js',
  'js/timers.js',
  'js/stock.js',
  'js/encomendas.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
