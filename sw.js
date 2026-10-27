/* Socle — service worker.
   Stratégie « cache d'abord, mise à jour en arrière-plan » : l'application
   s'ouvre instantanément et sans réseau ; une nouvelle version de data.js
   publiée sur le site est récupérée en tâche de fond et s'affiche à
   l'ouverture suivante. Changer VERSION force le renouvellement complet. */
const VERSION = 'socle-v2';
const FICHIERS = ['./', 'index.html', 'data.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const enCache = await cache.match(req, {ignoreSearch: true});
    const reseau = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (enCache) { e.waitUntil(reseau); return enCache; }
    return (await reseau) || new Response('Hors ligne', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }));
});
