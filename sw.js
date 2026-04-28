const CACHE_NAME = 'doce-gestao-v2'; // Muda versão sempre que alterar assets
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

// Instalação: cacheia tudo mas não quebra se 1 falhar
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Falha ao cachear:', asset, err);
        }
      }
    })
  );
  self.skipWaiting(); // Ativa SW novo imediatamente
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // Controla páginas abertas
});

// Fetch: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkRes => {
        // Atualiza cache em background
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkRes.clone());
        });
        return networkRes;
      }).catch(() => cached); // Se offline, usa cache
      
      return cached || fetchPromise;
    })
  );
});
