const CACHE_NAME = "aec-blog-v1";

const urlsToCache = [
  "/Blog/",
  "/Blog/index.html",
  "/Blog/style.css",
  "/Blog/app.js",
  "/Blog/1.png"
];

// Install Service Worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate
self.addEventListener("activate", event => {
  console.log("Service Worker Activated");
});

// Fetch (Offline Support)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
