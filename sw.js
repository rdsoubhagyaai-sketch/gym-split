const CACHE = 'gym-split-v1';
const STATIC = [
  '/gym-split/',
  '/gym-split/index.html',
  '/gym-split/manifest.json',
  '/gym-split/icon-192x192.png',
  '/gym-split/icon-512x512.png',
  '/gym-split/apple-touch-icon.png',
];

// Install — cache static shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for GIFs/images, cache first for shell
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network-first for external GIFs and images
  if (
    url.hostname === 'static.exercisedb.dev' ||
    url.hostname === 'raw.githubusercontent.com'
  ) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (app shell)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
