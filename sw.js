const CACHE_NAME = 'doce-gestao-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  './js/modules/dashboard.js',
  './js/modules/receitas.js',
  './js/modules/agenda.js',
  './js/modules/gestao.js'
];

// Instalação e Cache inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Interceptar pedidos: Serve da Cache, se não tiver, vai à rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
}
                     );
