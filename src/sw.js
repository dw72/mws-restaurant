import { storage } from "./js/storage";

const APP_NAME = "mws-restaurant";
const CACHE_VERSION = 1;
const CACHE_NAME = `${APP_NAME}-v${CACHE_VERSION}`;
const CACHE_URLS = [
  "/",
  "index.html",
  "restaurant.html",
  "offline.html",
  "css/styles.css",
  "js/main.js",
  "js/restaurant.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName.startsWith(APP_NAME))
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener("sync", event => {
  if (event.tag === "sync-favorites") {
    event.waitUntil(storage.syncFavorites());
  }
});

self.addEventListener("message", event => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith("http") || url.port === "1337") return;
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cacheResponse => {
        const fetchPromise = fetch(event.request)
          .then(response => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => {
            return cache.match("/offline.html");
          });
        return cacheResponse || fetchPromise;
      });
    })
  );
});
