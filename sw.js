(() => {
  // src/sw.ts
  self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
      self.skipWaiting();
    })());
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
      self.clients.claim();
    })());
  });
  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith("/api") || url.hostname.includes("openfoodfacts.org")) {
      return event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    }
    event.respondWith(caches.match(event.request).then((resp) => resp || fetch(event.request)));
  });
})();
