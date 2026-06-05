import { ref, readonly } from "vue";

/**
 * Composable that manages Service Worker registration and update detection.
 * Exposes reactive state for whether an update is available and a function to apply it.
 */

const updateAvailable = ref(false);
let waitingWorker: ServiceWorker | null = null;

/**
 * Registers the service worker and listens for update events.
 * Should be called once at app startup.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("ServiceWorker registered with scope:", registration.scope);

      // If there's already a waiting worker (e.g. user refreshed after deploy)
      if (registration.waiting) {
        waitingWorker = registration.waiting;
        updateAvailable.value = true;
      }

      // Listen for new installing workers
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // When the new worker is installed and waiting to activate
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            waitingWorker = newWorker;
            updateAvailable.value = true;
          }
        });
      });

      // When the controlling SW changes (after SKIP_WAITING), reload the page
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (err) {
      console.error("ServiceWorker registration failed:", err);
    }
  });
}

/**
 * Tells the waiting Service Worker to skip waiting and take control.
 * This will trigger a page reload via the controllerchange listener.
 */
export function applyUpdate() {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }
}

/** Reactive flag indicating whether a new version is available */
export const swUpdateAvailable = readonly(updateAvailable);
