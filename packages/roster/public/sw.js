// Simple service worker for offline support
const CACHE_NAME = 'roster-v1';
const urlsToCache = ['/roster/', '/roster/index.html', '/roster/assets/'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(() => {
        // Fail silently - not critical
      })
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      // If fetch fails, try to serve from cache
      return caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        // If not in cache, return a basic offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/roster/index.html');
        }
        throw new Error('Network failed and no cache available');
      });
    })
  );
});
