/*
 * Service worker mínimo para que la web sea instalable como PWA.
 *
 * Estrategia conservadora (es una web de marketing: nada de contenido rancio):
 * network-first para las navegaciones, con la home como respaldo offline. No
 * cachea agresivamente el resto de recursos.
 */
const CACHE = 'refcon-v1';
const OFFLINE_URL = '/es';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => {}),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Solo interviene en navegaciones (páginas): red primero, offline de respaldo.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))),
    );
  }
});
