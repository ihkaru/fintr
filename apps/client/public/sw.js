const CACHE_NAME = "famivault-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/src/js/app.ts",
  "/src/css/app.css",
  "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap",
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
];

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
          }
        } catch (err) {
          console.error("Service Worker: Failed to store shared file", err);
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

  // 3. Cache-first strategy for static assets
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
