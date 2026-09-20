const CACHE_NAME = "shadowing-shell-v3";
const MEDIA_CACHE_NAME = "shadowing-media-v3";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./icon.svg",
  "./manifest.json",
  "./manifest.webmanifest",
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
            if (key !== CACHE_NAME && key !== MEDIA_CACHE_NAME) {
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

  const url = new URL(request.url);
  const isNavigation =
    request.mode === "navigate" ||
    (request.headers.get("accept") &&
      request.headers.get("accept").includes("text/html"));

  // 1. Navigation requests (HTML): Network-Only with offline cache fallback
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("./index.html");
          });
        })
    );
    return;
  }

  // 2. Scenario media & subtitle requests (.mp3, .lrc, .md): On-demand runtime caching
  const isMedia =
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".lrc") ||
    url.pathname.endsWith(".md") ||
    url.pathname.includes("/audio/") ||
    url.pathname.includes("/scenarios/");

  if (isMedia) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then((mediaCache) => {
        return mediaCache.match(request).then((cachedMedia) => {
          if (cachedMedia) {
            return cachedMedia;
          }
          return fetch(request)
            .then((networkResponse) => {
              if (
                networkResponse &&
                networkResponse.status === 200 &&
                (networkResponse.type === "basic" ||
                  networkResponse.type === "cors")
              ) {
                const responseToCache = networkResponse.clone();
                mediaCache.put(request, responseToCache).catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => cachedMedia);
        });
      })
    );
    return;
  }

  // 3. Static shell assets: Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          (networkResponse.type !== "basic" && networkResponse.type !== "cors")
        ) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache).catch(() => {});
        });
        return networkResponse;
      });
    })
  );
});
