// Cache version — bump this string on each deploy to trigger SW update.
// Vite build hashes the JS/CSS filenames, but the SW file itself needs
// a changed constant so the browser treats it as a new worker.
const CACHE_VERSION = "__CACHE_V1__";
const CACHE_NAME = `famivault-${CACHE_VERSION}`;

const ASSETS = ["/", "/index.html"];

// Install Event
self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => {
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME && key !== "shared-image-cache") {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Message handler — allows the app to tell a waiting SW to activate immediately
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch Event
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Skip caching for non-http/https requests (like chrome-extension://)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // 1. Intercept the Share Target POST request
  if (url.pathname === "/share" && event.request.method === "POST") {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get("receipt");
          const title = formData.get("title");
          const text = formData.get("text");
          const urlStr = formData.get("url");

          if (file) {
            const cache = await caches.open("shared-image-cache");
            // Store the shared file in the cache under /shared-image
            await cache.put(
              "/shared-image",
              new Response(file, {
                headers: {
                  "Content-Type": file.type,
                  "Content-Length": file.size.toString(),
                  "x-file-name": encodeURIComponent(file.name || "shared-receipt.png"),
                },
              })
            );
          } else if (title || text || urlStr) {
            const cache = await caches.open("shared-image-cache");
            const sharedTextData = {
              title: title || "",
              text: text || "",
              url: urlStr || "",
            };
            // Store the shared text in the cache under /shared-text
            await cache.put(
              "/shared-text",
              new Response(JSON.stringify(sharedTextData), {
                headers: {
                  "Content-Type": "application/json",
                },
              })
            );
          }
        } catch (err) {
          console.error("Service Worker: Failed to store shared content", err);
        }
        // Redirect to home page where the app will check the cache and redirect to add-transaction
        return Response.redirect("/", 303);
      })()
    );
    return;
  }

  // 2. Bypass cache for API requests
  if (url.pathname.startsWith("/api")) {
    return;
  }

  // 3. Network-first for navigation, cache-first for assets
  if (event.request.mode === "navigate") {
    // Navigation requests: try network first so the user always gets the
    // latest index.html after a deploy, fall back to cache for offline.
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Update the cache with the fresh response
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => cached || caches.match("/"));
        })
    );
    return;
  }

  // 4. Cache-first strategy for static assets (JS/CSS/images/fonts)
  event.respondWith(
    caches
      .match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          // Cache newly fetched assets if they are from our origin
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic" &&
            !url.pathname.includes("/node_modules/")
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Fallback to offline page/root if fetch fails
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      })
  );
});
