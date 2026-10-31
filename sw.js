/* Small offline-first shell cache. Subject files are cached as the user opens them. */
const CACHE_NAME = 'pharmaquest-20261031-fix2';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './data/manifest.json', './assets/favicon.svg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pharmaquest-') && k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isSubjectData = new URL(req.url).pathname.includes('/data/subjects/');
  if (isSubjectData) {
    event.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)); }
      return res;
    }).catch(() => caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    if (res.ok) { const copy=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)); }
    return res;
  })));
});
