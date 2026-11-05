// Cache hors ligne de l'appli (version 94bdf99f5b : change à chaque nouvelle fabrication)
const CACHE = 'bpadn-94bdf99f5b';
const PDF_CACHE = 'bpadn-pdf';   // PDF gardés hors ligne : jamais effacés par une mise à jour
const FILES = ["./", "index.html", "bibliotheque.html", "pdfs.json", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "vendor/pdf.min.js", "vendor/pdf.worker.min.js", "supernova.html", "vendor/pdf-lib.min.js", "vendor/tex-svg-full.js"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== PDF_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.includes('/podcast/')) return;   // audio lu par morceaux : sans cache (sinon Safari coince)
  if (url.pathname.endsWith('.pdf')) {   // PDF : cache d'abord (lourds, changent rarement)
    e.respondWith(caches.open(PDF_CACHE).then(c => c.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request))));
    return;
  }
  // Le reste : réseau d'abord (pour recevoir les mises à jour), cache si pas de réseau
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && url.origin === location.origin) {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
});
