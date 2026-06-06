import { ref } from "vue";
import { f7 } from "framework7-vue";
import { household } from "../js/api/household";

const isConnected = ref(false);
let eventSource: EventSource | null = null;
let reconnectTimer: any = null;

// Cache for household members
const memberCache = new Map<string, string>();

let pendingNotifications: { type: "transaction" | "envelope"; senderUserId: string }[] = [];
let batchTimeout: any = null;

async function getMemberName(userId: string): Promise<string> {
  if (!userId) return "Pasangan Anda";
  if (memberCache.has(userId)) {
    return memberCache.get(userId)!;
  }

  try {
    const detail = await household.get();
    if (detail && detail.members) {
      detail.members.forEach(m => {
        memberCache.set(m.userId, m.name);
      });
    }
  } catch (err) {
    console.error("[Sync] Failed to fetch household members for attribution:", err);
  }

  return memberCache.get(userId) || "Pasangan Anda";
}

async function queueNotification(type: "transaction" | "envelope", senderUserId: string) {
  pendingNotifications.push({ type, senderUserId });

  if (batchTimeout) return;

  batchTimeout = setTimeout(async () => {
    const list = [...pendingNotifications];
    pendingNotifications = [];
    batchTimeout = null;

    if (list.length === 0) return;

    // Resolve all sender names in parallel
    const resolvedNames = await Promise.all(
      Array.from(new Set(list.map(item => item.senderUserId))).map(async id => {
        return { id, name: await getMemberName(id) };
      })
    );
    const nameMap = new Map(resolvedNames.map(r => [r.id, r.name]));

    // Group items by type
    const txItems = list.filter(item => item.type === "transaction");
    const envItems = list.filter(item => item.type === "envelope");

    const txSenders = Array.from(
      new Set(txItems.map(item => nameMap.get(item.senderUserId) || "Pasangan Anda"))
    );
    const envSenders = Array.from(
      new Set(envItems.map(item => nameMap.get(item.senderUserId) || "Pasangan Anda"))
    );

    let toastText = "";
    if (txItems.length > 0 && envItems.length > 0) {
      const allSenders = Array.from(new Set([...txSenders, ...envSenders])).join(", ");
      toastText = `${allSenders} melakukan pembaruan transaksi dan anggaran.`;
    } else if (txItems.length > 0) {
      if (txItems.length === 1) {
        toastText = `${txSenders[0]} baru saja mencatat transaksi baru.`;
      } else {
        toastText = `${txSenders.join(", ")} mencatat beberapa transaksi baru.`;
      }
    } else if (envItems.length > 0) {
      if (envItems.length === 1) {
        toastText = `${envSenders[0]} baru saja menyesuaikan anggaran amplop.`;
      } else {
        toastText = `${envSenders.join(", ")} menyesuaikan beberapa anggaran amplop.`;
      }
    }

    if (toastText) {
      f7.toast
        .create({
          text: toastText,
          closeTimeout: 3000,
          position: "bottom",
        })
        .open();
    }
  }, 1500);
}

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

      eventSource.onmessage = async event => {
        try {
          const payload = JSON.parse(event.data);
          console.log("[Sync] Received real-time sync event:", payload);

          if (payload.event === "transaction_changed") {
            // Dispatch global event for transactions
            window.dispatchEvent(new CustomEvent("fintr:transaction-saved"));
            queueNotification("transaction", payload.senderUserId);
          } else if (payload.event === "envelope_changed") {
            // Dispatch global event for envelopes
            window.dispatchEvent(new CustomEvent("fintr:envelope-changed"));
            queueNotification("envelope", payload.senderUserId);
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
