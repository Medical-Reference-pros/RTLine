// RTLine Service Worker
// ── UPDATE THIS VERSION STRING WITH EVERY RELEASE ──
const CACHE_NAME = 'rtline-cache-v1.1';

const ASSETS = [
  './',
  './index.html'
];

// INSTALL — cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // Take over immediately — don't wait for old SW to finish
  self.skipWaiting();
});

// ACTIVATE — delete all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  // Claim all open clients immediately
  self.clients.claim();
});

// FETCH — stale-while-revalidate
// Serve from cache instantly, then fetch fresh in background and update cache.
// On the NEXT open, the user gets the fresh version automatically.
self.addEventListener('fetch', event => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cached); // network failed — fall back to cache

        // Return cached instantly; fresh version updates cache for next time
        return cached || fetchPromise;
      })
    )
  );
});
