const CACHE_NAME = "shadowing-shell-v5";
const MEDIA_CACHE_NAME = "shadowing-media-v5";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./dictionary.json",
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

self.addEventListener("message", (event) => {
  if (
    event.data === "SKIP_WAITING" ||
    (event.data && event.data.type === "SKIP_WAITING")
  ) {
    self.skipWaiting();
  }
  if (
    event.data === "CLEAR_ALL_CACHES" ||
    (event.data && event.data.type === "CLEAR_ALL_CACHES")
  ) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
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
        .catch(async () => {
          const cachedResponse =
            (await caches.match(request)) ||
            (await caches.match("./index.html"));
          return (
            cachedResponse ||
            new Response("Offline page unavailable", {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/plain" },
            })
          );
        })
    );
    return;
  }

  // 2. Heavy audio tracks (.mp3, .webm, .opus): Cache-First with full HTTP 206 Range support for audio seeking
  const isMedia =
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".webm") ||
    url.pathname.endsWith(".opus") ||
    url.pathname.endsWith(".wav") ||
    url.pathname.endsWith(".m4a");

  if (isMedia) {
    const rangeHeader = request.headers.get("range");

    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then(async (mediaCache) => {
        let cachedMedia = await mediaCache.match(request, {
          ignoreSearch: true,
        });

        // If not in cache, fetch the full audio without Range header to store in cache
        if (!cachedMedia) {
          try {
            const fullRequest = new Request(request.url, {
              method: "GET",
              headers: new Headers(request.headers),
              mode: request.mode === "navigate" ? "same-origin" : request.mode,
              credentials: request.credentials,
            });
            fullRequest.headers.delete("range");
            const networkResponse = await fetch(fullRequest);
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === "basic" ||
                networkResponse.type === "cors")
            ) {
              await mediaCache.put(request.url, networkResponse.clone());
              cachedMedia = networkResponse;
            } else {
              cachedMedia = networkResponse;
            }
          } catch (e) {
            // Fetch error
          }
        }

        if (cachedMedia) {
          // If the audio element issued a Range request (when seeking to any timestamp)
          if (rangeHeader) {
            const arrayBuffer = await cachedMedia.clone().arrayBuffer();
            const bytesMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
            if (bytesMatch) {
              const start = parseInt(bytesMatch[1], 10);
              const end = bytesMatch[2]
                ? parseInt(bytesMatch[2], 10)
                : arrayBuffer.byteLength - 1;
              const slicedBuffer = arrayBuffer.slice(start, end + 1);

              return new Response(slicedBuffer, {
                status: 206,
                statusText: "Partial Content",
                headers: {
                  "Content-Type":
                    cachedMedia.headers.get("Content-Type") || "audio/mpeg",
                  "Content-Range": `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
                  "Content-Length": String(slicedBuffer.byteLength),
                  "Accept-Ranges": "bytes",
                },
              });
            }
          }
          return cachedMedia;
        }

        return new Response("Audio media unavailable offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      })
    );
    return;
  }

  // 3. Scenario subtitles and manifests (.lrc, .md, scenarios.json): Network-First with cache fallback
  const isSubtitleOrManifest =
    url.pathname.endsWith(".lrc") ||
    url.pathname.endsWith(".md") ||
    url.pathname.endsWith(".json");

  if (isSubtitleOrManifest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === "basic" ||
              networkResponse.type === "cors")
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(MEDIA_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response("Subtitles unavailable offline", {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/plain" },
            })
          );
        })
    );
    return;
  }

  // 4. Static shell assets: Cache-First
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
            cache.put(request, responseToCache).catch(() => {});
          });
          return networkResponse;
        })
        .catch(() => {
          return (
            cachedResponse ||
            new Response("Resource not found", {
              status: 404,
              statusText: "Not Found",
              headers: { "Content-Type": "text/plain" },
            })
          );
        });
    })
  );
});
