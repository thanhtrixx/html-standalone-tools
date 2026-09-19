const CACHE_NAME = "shadowing-player-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./icon.svg",
  "./manifest.json",
  "./manifest.webmanifest",
  "./audio/specialty-coffee.mp3",
  "./audio/specialty-coffee.lrc",
  "./audio/specialty-coffee.srt",
  "./audio/tech-standup.mp3",
  "./audio/tech-standup.lrc",
  "./audio/tech-standup.srt",
  "./audio/airport-security.mp3",
  "./audio/airport-security.lrc",
  "./audio/airport-security.srt",
  "./audio/academic-ai-future.mp3",
  "./audio/academic-ai-future.lrc",
  "./audio/academic-ai-future.srt",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || !request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            (networkResponse.type !== "basic" &&
              networkResponse.type !== "cors")
          ) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (request.url.startsWith("http")) {
              cache.put(request, responseToCache).catch(() => {});
            }
          });
          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
