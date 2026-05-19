self.addEventListener('install', (event: any) => {
  event.waitUntil((async () => {
    // skip caching for MVP, placeholder for future Workbox integration
    (self as any).skipWaiting();
  })());
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil((async () => {
    (self as any).clients.claim();
  })());
});

self.addEventListener('fetch', (event: any) => {
  // For MVP, use network-first for API calls, fallback to cache for assets
  const url = new URL(event.request.url);
  if(url.pathname.startsWith('/api') || url.hostname.includes('openfoodfacts.org')){
    return event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
  }
  event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});
