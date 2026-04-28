const CACHE_NAME = 'docegestao-v3.0';
const OFFLINE_URL = './offline.html';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  './js/modules/dashboard.js',
  './js/modules/receitas.js',
  './js/modules/agenda.js',
  './js/modules/gestao.js',
  './manifest.json',
  OFFLINE_URL
];

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.allSettled(
      STATIC_ASSETS.map(url => 
        caches.open(CACHE_NAME)
          .then(c => c.add(url))
          .catch(err => console.warn('Falha ao cachear', url, err))
      )
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // HTML: Network First
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Static: Cache First
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});