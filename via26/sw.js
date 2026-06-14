const CACHE_NAME = "via-26-v5-ios27";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./ios27.css",
  "./app.js",
  "./data.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/dubai-city-desert.jpg",
  "./assets/dolomites-meadow.jpg",
  "./assets/venice-gondola.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
        .then(response => {
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
  );
});
