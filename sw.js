/* Service worker - Alerte Fracarro Tunisie
   Stratégie « réseau d'abord » : l'appareil affiche toujours la dernière version
   publiée et bascule sur la copie enregistrée uniquement sans connexion.
   Les appels à l'API (dépôt / suivi d'alerte) ne sont jamais mis en cache. */

const CACHE = 'alerte-fracarro-v7';
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo-fracarro.png',
  './icons/wordmark-alerte.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Jamais de cache pour le serveur d'alertes
  if (url.hostname.indexOf('script.google') >= 0) return;
  // Uniquement les fichiers de l'application
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copie = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copie));
        return res;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
  );
});
