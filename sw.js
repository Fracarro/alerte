/* Service worker - Alerte Fracarro Tunisie
   Rôle : rendre l'app installable et utilisable hors connexion.
   Les appels à l'API (dépôt/suivi d'alerte) ne sont jamais mis en cache :
   ils ont besoin du réseau, sinon ils sont mis en file d'attente côté page. */

const CACHE = 'alerte-fracarro-v5';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo-fracarro.png',
  './icons/wordmark-alerte.svg',
  './app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne jamais mettre en cache les appels vers l'API Apps Script
  if (url.hostname.indexOf('script.google.com') >= 0 || url.hostname.indexOf('script.googleusercontent.com') >= 0) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
