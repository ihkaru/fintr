import { ref } from "vue";

const isConnected = ref(false);
let eventSource: EventSource | null = null;
let reconnectTimer: any = null;

export function useSync() {
  const startSync = () => {
    if (eventSource) return;

    const token = localStorage.getItem("fintr_token");
    if (!token) {
      console.warn("[Sync] No token found, skipping sync connection.");
      return;
    }

    console.log("[Sync] Connecting to real-time events stream...");

    const url = `/api/sync/events?token=${encodeURIComponent(token)}`;

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log("[Sync] Connected to real-time events stream.");
        isConnected.value = true;
      };

      eventSource.onerror = e => {
        console.error("[Sync] EventSource connection error:", e);
        isConnected.value = false;

        // Native EventSource automatically reconnects, but if it enters CLOSED state
        // (e.g. server refused connection or auth failed), we attempt manual retry.
        if (eventSource && eventSource.readyState === EventSource.CLOSED) {
          stopSync();
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            startSync();
          }, 5000);
        }
      };

      eventSource.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          console.log("[Sync] Received real-time sync event:", payload);

          if (payload.event === "transaction_changed") {
            // Dispatch global event for transactions
            window.dispatchEvent(new CustomEvent("fintr:transaction-saved"));
          } else if (payload.event === "envelope_changed") {
            // Dispatch global event for envelopes
            window.dispatchEvent(new CustomEvent("fintr:envelope-changed"));
          }
        } catch (err) {
          console.error("[Sync] Error parsing SSE payload:", err);
        }
      };
    } catch (err) {
      console.error("[Sync] Failed to initialize EventSource:", err);
    }
  };

  const stopSync = () => {
    clearTimeout(reconnectTimer);
    if (eventSource) {
      console.log("[Sync] Disconnecting from real-time events stream...");
      eventSource.close();
      eventSource = null;
    }
    isConnected.value = false;
  };

  return {
    isConnected,
    startSync,
    stopSync,
  };
}
