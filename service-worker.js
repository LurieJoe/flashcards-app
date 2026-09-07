'use strict';

// Compatibility worker for installations created before the app moved to /app/.
// Activate immediately so old root-scoped workers and caches retire reliably.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('message', event => {
  if (typeof event.data === 'string' && event.data.startsWith('activate-')) {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key.startsWith('flashcards-')).map(key => caches.delete(key))
    );
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
