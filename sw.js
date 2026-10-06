const CACHE_NAME = "kansai-adventure-r2-p13-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./data/trip.js",
  "./data/trip-meta.js",
  "./data/place-index.js",
  "./data/location-index.js",
  "./data/food-index.js",
  "./data/budget-index.js",
  "./data/trip.json",
  "./data/trip-meta.js",
  "./data/place-index.json",
  "./data/location-index.json",
  "./data/food-index.json",
  "./data/budget-index.json",
  "./data/trip-schema.json",
  "./data/update-log.json",
  "./icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll())
      .then(clients => clients.forEach(client => client.postMessage({ type: "KansaiAdventureOfflineReady" })))
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type !== "basic") return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
